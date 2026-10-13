import { db } from "./db";
export async function agentAccess(id: string, uid: string) {
  const result = await db().query(
    "SELECT a.* FROM agents a WHERE a.id=$1 AND (a.owner=$2 OR EXISTS(SELECT 1 FROM rentals WHERE agent_id=a.id AND renter=$2 AND status='active' AND expires_at>now()))",
    [id, uid],
  );
  if (!result.rows[0])
    throw new Error("An active rental or agent ownership is required.");
  return result.rows[0];
}
