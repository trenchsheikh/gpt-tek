import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
test("schema supports agent ownership, rental expiry and payment replay prevention", async () => {
  const db = new PGlite();
  try {
    await db.exec("CREATE ROLE anon; CREATE ROLE authenticated;");
    await db.exec(
      await readFile(new URL("../lib/schema.sql", import.meta.url), "utf8"),
    );
    await db.exec(
      await readFile(new URL("../lib/schema.sql", import.meta.url), "utf8"),
    );
    const agent = "11111111-1111-4111-8111-111111111111",
      rental = "22222222-2222-4222-8222-222222222222";
    await db.query(
      "INSERT INTO agents(id,owner,wallet,name,description,strategy,category,hourly_lamports,listed) VALUES($1,'owner','wallet','Agent','Description','Private instructions','Research',10000000,true)",
      [agent],
    );
    await db.query(
      "INSERT INTO rentals(id,agent_id,renter,payer,hours,lamports) VALUES($1,$2,'renter','payer',4,40000000)",
      [rental, agent],
    );
    const access = () =>
      db.query(
        "SELECT id FROM agents a WHERE a.id=$1 AND (owner=$2 OR EXISTS(SELECT 1 FROM rentals r WHERE r.agent_id=a.id AND renter=$2 AND status='active' AND expires_at>now()))",
        [agent, "renter"],
      );
    assert.equal((await access()).rows.length, 0);
    await db.query(
      "UPDATE rentals SET status='active',signature='confirmed-payment',expires_at=now()+interval '4 hours' WHERE id=$1",
      [rental],
    );
    assert.equal((await access()).rows.length, 1);
    await assert.rejects(() =>
      db.query(
        "INSERT INTO rentals(id,agent_id,renter,payer,hours,lamports,signature) VALUES('33333333-3333-4333-8333-333333333333',$1,'other','payer',4,40000000,'confirmed-payment')",
        [agent],
      ),
    );
    await db.query(
      "UPDATE rentals SET expires_at=now()-interval '1 second' WHERE id=$1",
      [rental],
    );
    assert.equal((await access()).rows.length, 0);
    assert.equal(
      (
        await db.query(
          "SELECT id FROM agents WHERE id=$1 AND owner='stranger'",
          [agent],
        )
      ).rows.length,
      0,
    );
  } finally {
    await db.close();
  }
});
