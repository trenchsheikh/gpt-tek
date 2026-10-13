import { db } from "./db";
export async function limit(id: string, max: number, seconds: number) {
  const r = await db().query(
    `INSERT INTO usage_limits(id,count,resets_at) VALUES($1,1,now()+($3::int*interval '1 second')) ON CONFLICT(id) DO UPDATE SET count=CASE WHEN usage_limits.resets_at<now() THEN 1 ELSE usage_limits.count+1 END,resets_at=CASE WHEN usage_limits.resets_at<now() THEN now()+($3::int*interval '1 second') ELSE usage_limits.resets_at END WHERE usage_limits.resets_at<now() OR usage_limits.count<$2 RETURNING id`,
    [id, max, seconds],
  );
  if (!r.rowCount)
    throw new Error("Usage limit reached. Please try again later.");
}
