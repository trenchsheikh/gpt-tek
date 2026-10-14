import { Pool } from "pg";
const globalDb = globalThis as unknown as { pool?: Pool };
export function db() {
  if (!process.env.DATABASE_URL)
    throw new Error(
      "Database is not configured. Add DATABASE_URL and run the schema migration.",
    );
  return (globalDb.pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  }));
}
