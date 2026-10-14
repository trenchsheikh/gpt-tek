import { limit } from "@/lib/limit";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { fail, sameOrigin } from "@/lib/http";
export async function POST(r: Request) {
  try {
    sameOrigin(r);
    await limit(
      `challenge:${r.headers.get("x-forwarded-for")?.split(",")[0] || "local"}`,
      30,
      300,
    );
    const id = randomUUID();
    const message = `AgentRouter wallet sign-in\nDomain: ${new URL(r.url).host}\nNonce: ${id}\nIssued: ${new Date().toISOString()}\nThis signature authenticates you. It does not authorize a transaction.`;
    await db().query("DELETE FROM challenges WHERE expires_at<now()");
    await db().query(
      "INSERT INTO challenges VALUES($1,$2,now()+interval '5 minutes')",
      [id, message],
    );
    return Response.json({ id, message });
  } catch (e) {
    return fail(e);
  }
}
