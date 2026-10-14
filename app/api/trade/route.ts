import { randomUUID } from "crypto";
import { VersionedTransaction } from "@solana/web3.js";
import nacl from "tweetnacl";
import { db } from "@/lib/db";
import { agentAccess } from "@/lib/access";
import { planSchema } from "@/lib/agent-plan";
import { market, SOL, USDC } from "@/lib/market";
import { user, fail, sameOrigin } from "@/lib/http";
import { limit } from "@/lib/limit";
import { z } from "zod";
async function jupiter(path: string, body?: unknown) {
  const key = process.env.JUPITER_API_KEY;
  if (!key) throw new Error("Live swap routing is not configured yet.");
  const r = await fetch("https://api.jup.ag/swap/v2/" + path, {
    method: body ? "POST" : "GET",
    headers: { "x-api-key": key, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(30000),
  });
  const d = await r.json();
  if (!r.ok) throw new Error("Swap routing is temporarily unavailable.");
  return d;
}
export async function POST(r: Request) {
  try {
    sameOrigin(r);
    const uid = await user();
    await limit(`trade:${uid}`, 30, 3600);
    const b = await r.json();
    if (b.signedTransaction) {
      const intent = (
        await db().query(
          "SELECT * FROM trade_intents WHERE id=$1 AND owner=$2 AND status='pending' AND expires_at>now()",
          [b.id, uid],
        )
      ).rows[0];
      if (!intent)
        throw new Error(
          "The quote expired or was already submitted. Request a fresh quote.",
        );
      await agentAccess(intent.agent_id, uid);
      const original = VersionedTransaction.deserialize(
        Buffer.from(intent.transaction, "base64"),
      );
      const signed = VersionedTransaction.deserialize(
        Buffer.from(b.signedTransaction, "base64"),
      );
      if (
        !Buffer.from(original.message.serialize()).equals(
          Buffer.from(signed.message.serialize()),
        )
      )
        throw new Error(
          "Signed transaction does not match the approved quote.",
        );
      const index = signed.message.staticAccountKeys.findIndex(
        (k) => k.toBase58() === intent.wallet,
      );
      if (
        index < 0 ||
        index >= signed.message.header.numRequiredSignatures ||
        !nacl.sign.detached.verify(
          signed.message.serialize(),
          signed.signatures[index],
          signed.message.staticAccountKeys[index].toBytes(),
        )
      )
        throw new Error("The connected wallet signature is missing.");
      const claim = await db().query(
        "UPDATE trade_intents SET status='submitting' WHERE id=$1 AND status='pending' RETURNING id",
        [b.id],
      );
      if (!claim.rowCount)
        throw new Error("This trade is already being submitted.");
      try {
        const result = await jupiter("execute", {
          signedTransaction: b.signedTransaction,
          requestId: intent.request_id,
        });
        await db().query(
          "UPDATE trade_intents SET status=$1,signature=$2 WHERE id=$3",
          [
            result.status === "Success" ? "confirmed" : "failed",
            result.signature || null,
            b.id,
          ],
        );
        if (result.status !== "Success")
          throw new Error(
            "The swap failed. Check your wallet history before retrying.",
          );
        return Response.json(result);
      } catch (e) {
        await db().query(
          "UPDATE trade_intents SET status='unknown' WHERE id=$1 AND status='submitting'",
          [b.id],
        );
        throw e;
      }
    }
    const input = z
      .object({
        agentId: z.uuid(),
        wallet: z.string().min(32).max(44),
        action: z.enum(["buy", "sell"]),
        amountUsd: z.number().positive(),
      })
      .parse(b);
    const agent = await agentAccess(input.agentId, uid);
    const plan = planSchema.parse(agent.plan);
    if (["Trenches", "Prediction markets"].includes(plan.category))
      throw new Error(
        "This category requires its trading-platform integration before testing or execution.",
      );
    if (input.amountUsd > plan.maxTradeUsd)
      throw new Error("Trade exceeds the agent’s maximum size.");
    const snapshot = await market();
    const buy = input.action === "buy";
    const amount = String(
      Math.floor(
        buy ? input.amountUsd * 1e6 : (input.amountUsd / snapshot.price) * 1e9,
      ),
    );
    const order = await jupiter(
      "order?" +
        new URLSearchParams({
          inputMint: buy ? USDC : SOL,
          outputMint: buy ? SOL : USDC,
          amount,
          taker: input.wallet,
          slippageBps: String(plan.slippageBps),
          maxSupportedTransactionVersion: "0",
        }),
    );
    if (!order.transaction || !order.requestId)
      throw new Error("No swap route is available.");
    const tx = VersionedTransaction.deserialize(
      Buffer.from(order.transaction, "base64"),
    );
    if (
      !tx.message.staticAccountKeys
        .slice(0, tx.message.header.numRequiredSignatures)
        .some((k) => k.toBase58() === input.wallet)
    )
      throw new Error("Routing returned a transaction for a different wallet.");
    const id = randomUUID();
    await db().query(
      "INSERT INTO trade_intents(id,agent_id,owner,wallet,request_id,transaction,details) VALUES($1,$2,$3,$4,$5,$6,$7)",
      [
        id,
        input.agentId,
        uid,
        input.wallet,
        order.requestId,
        order.transaction,
        JSON.stringify({
          action: input.action,
          amountUsd: input.amountUsd,
          inputMint: buy ? USDC : SOL,
          outputMint: buy ? SOL : USDC,
          outAmount: order.outAmount,
          slippageBps: plan.slippageBps,
          snapshot,
        }),
      ],
    );
    return Response.json({
      id,
      transaction: order.transaction,
      outAmount: order.outAmount,
      action: input.action,
      amountUsd: input.amountUsd,
      slippageBps: plan.slippageBps,
      expiresIn: 60,
    });
  } catch (e) {
    return fail(e);
  }
}
