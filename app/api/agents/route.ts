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
          "SELECT * FROM agents WHERE owner=$1 ORDER BY created_at DESC",
          [await user()],
        )
      : await db().query(
          "SELECT id,wallet,name,description,category,hourly_lamports,created_at FROM agents WHERE listed=true ORDER BY created_at DESC",
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
    const a = agentInput.parse(await r.json());
    new PublicKey(a.wallet);
    const id = randomUUID();
    await db().query(
      "INSERT INTO agents(id,owner,wallet,name,description,strategy,category,hourly_lamports,listed) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
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
