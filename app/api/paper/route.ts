import { supportsSwaps } from "@/lib/integrations";
import { integrationData } from "@/lib/integration-data";
import { research } from "@/lib/research";
import { planSchema } from "@/lib/agent-plan";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { agentAccess } from "@/lib/access";
import { pipeline } from "@/lib/pipeline";
import { paperTrade } from "@/lib/agent-plan";
import { market } from "@/lib/market";
import { user, fail, sameOrigin } from "@/lib/http";
import { limit } from "@/lib/limit";
export const maxDuration = 180;
export async function GET(r: Request) {
  try {
    const uid = await user();
    const id = new URL(r.url).searchParams.get("agentId") || "";
    await agentAccess(id, uid);
    return Response.json(
      (
        await db().query(
          "SELECT * FROM paper_runs WHERE agent_id=$1 AND owner=$2 AND COALESCE(report->>'mode','paper')='paper' ORDER BY created_at DESC LIMIT 100",
          [id, uid],
        )
      ).rows,
    );
  } catch (e) {
    return fail(e);
  }
}
export async function POST(r: Request) {
  try {
    sameOrigin(r);
    const uid = await user();
    await limit(`paper:${uid}`, 12, 3600);
    const { agentId, apiKey } = await r.json();
    const agent = await agentAccess(agentId, uid);
    const p = planSchema.parse(agent.plan);
    if (!p.market)
      p.market =
        p.category === "Trenches"
          ? "Memecoin trading"
          : p.category === "Prediction markets"
            ? "Prediction markets"
            : "Spot trading";
    if (!supportsSwaps(p)) {
      const snapshot = await integrationData(p);
      const result = await research({ ...agent, plan: p }, snapshot, apiKey);
      const id = randomUUID();
      await db().query(
        "INSERT INTO paper_runs(id,agent_id,owner,price,action,amount_usd,usd,sol,equity,report) VALUES($1,$2,$3,0,'hold',0,10000,0,10000,$4)",
        [
          id,
          agentId,
          uid,
          JSON.stringify({ ...result.reports, snapshot, mode: "research" }),
        ],
      );
      return Response.json({ id, mode: "research", ...result, snapshot });
    }
    const previous = (
      await db().query(
        "SELECT * FROM paper_runs WHERE agent_id=$1 AND owner=$2 AND COALESCE(report->>'mode','paper')='paper' ORDER BY created_at DESC LIMIT 1",
        [agentId, uid],
      )
    ).rows[0];
    const balance = {
      usd: Number(previous?.usd ?? 10000),
      sol: Number(previous?.sol ?? 0),
    };
    const snapshot = await market();
    const run = await pipeline(agent, snapshot, balance, apiKey);
    if (
      previous &&
      Number(previous.equity) <= 10000 * (1 - run.plan.stopLossPct / 100) &&
      run.decision.action === "buy"
    )
      throw new Error(
        "The paper loss limit has been reached. Buying is paused.",
      );
    const next = paperTrade(
      balance,
      run.decision.action,
      run.decision.amountUsd,
      snapshot.price,
    );
    const client = await db().connect();
    try {
      await client.query("BEGIN");
      const lock = await client.query(
        "SELECT pg_try_advisory_xact_lock(hashtext($1)) AS locked",
        [agentId + uid],
      );
      if (!lock.rows[0].locked)
        throw new Error("Another test is running. Retry once it finishes.");
      const newest = (
        await client.query(
          "SELECT id FROM paper_runs WHERE agent_id=$1 AND owner=$2 AND COALESCE(report->>'mode','paper')='paper' ORDER BY created_at DESC LIMIT 1",
          [agentId, uid],
        )
      ).rows[0];
      if (newest?.id !== previous?.id)
        throw new Error(
          "Paper balance changed during analysis. Run a fresh test.",
        );
      const id = randomUUID();
      await client.query(
        "INSERT INTO paper_runs(id,agent_id,owner,price,action,amount_usd,usd,sol,equity,report) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
        [
          id,
          agentId,
          uid,
          snapshot.price,
          run.decision.action,
          run.decision.amountUsd,
          next.usd,
          next.sol,
          next.usd + next.sol * snapshot.price,
          JSON.stringify({ ...run.reports, snapshot, feeAssumptionBps: 10 }),
        ],
      );
      await client.query("COMMIT");
      return Response.json({
        id,
        ...next,
        equity: next.usd + next.sol * snapshot.price,
        ...run,
        snapshot,
      });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (e) {
    return fail(e);
  }
}
