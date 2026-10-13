import { planSchema } from "@/lib/agent-plan";
import { models } from "@/lib/models";
import { limit } from "@/lib/limit";
import { randomUUID } from "crypto";
import { PublicKey } from "@solana/web3.js";
import { db } from "@/lib/db";
import { agentInput } from "@/lib/validation";
import { user, fail, sameOrigin } from "@/lib/http";
export async function GET(r: Request) {
  try {
    const mine = new URL(r.url).searchParams.has("mine");
    const result = mine
      ? await db().query(
          "SELECT * FROM agents WHERE owner=$1 ORDER BY created_at DESC LIMIT 100",
          [await user()],
        )
      : await db().query(
          "SELECT a.id,a.wallet,a.name,a.description,a.category,a.hourly_lamports,a.created_at,a.plan->'models' AS models,(SELECT count(*)::int FROM paper_runs WHERE agent_id=a.id AND owner=a.owner) AS paper_samples FROM agents a WHERE listed=true ORDER BY created_at DESC LIMIT 100",
        );
    return Response.json(result.rows);
  } catch (e) {
    return fail(e);
  }
}
export async function POST(r: Request) {
  try {
    sameOrigin(r);
    const owner = await user();
    await limit(`create:${owner}`, 20, 3600);
    const body = await r.json();
    const a = agentInput.parse(body);
    const plan = body.plan ? planSchema.parse(body.plan) : null;
    if (plan) {
      const catalogue = await models();
      for (const id of Object.values(plan.models))
        if (!catalogue.some((m) => m.id === id))
          throw new Error("Choose currently available models.");
      if (a.listed)
        throw new Error(
          "Save a draft and complete five forward paper tests before publishing.",
        );
    }
    new PublicKey(a.wallet);
    const id = randomUUID();
    await db().query(
      "INSERT INTO agents(id,owner,wallet,name,description,strategy,category,hourly_lamports,listed,plan) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
      [
        id,
        owner,
        a.wallet,
        a.name,
        a.description,
        a.strategy,
        a.category,
        Math.round(a.hourlySol * 1e9),
        a.listed,
        plan ? JSON.stringify(plan) : null,
      ],
    );
    return Response.json({ id });
  } catch (e) {
    return fail(e);
  }
}
export async function PATCH(r: Request) {
  try {
    sameOrigin(r);
    const owner = await user();
    const { id, listed } = await r.json();
    if (typeof listed !== "boolean") throw new Error("Invalid listing");
    if (listed) {
      const a = (
        await db().query("SELECT plan FROM agents WHERE id=$1 AND owner=$2", [
          id,
          owner,
        ])
      ).rows[0];
      if (a?.plan) {
        const n = (
          await db().query(
            "SELECT count(*)::int AS n FROM paper_runs WHERE agent_id=$1 AND owner=$2",
            [id, owner],
          )
        ).rows[0].n;
        if (n < 5)
          throw new Error(
            "Complete at least five forward paper tests before publishing.",
          );
      }
    }
    const result = await db().query(
      "UPDATE agents SET listed=$1 WHERE id=$2 AND owner=$3 RETURNING id",
      [listed, id, owner],
    );
    if (!result.rowCount) throw new Error("Agent not found");
    return Response.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
