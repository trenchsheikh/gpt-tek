import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { Connection, PublicKey } from "@solana/web3.js";
test("Solana RPC transport remains compatible with patched dependencies", async () => {
  const server = createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const request = JSON.parse(body);
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          jsonrpc: "2.0",
          id: request.id,
          result: { context: { slot: 1 }, value: 123456789 },
        }),
      );
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const info = server.address();
    if (!info || typeof info === "string") throw new Error("RPC port missing");
    assert.equal(
      await new Connection(`http://127.0.0.1:${info.port}`).getBalance(
        new PublicKey("11111111111111111111111111111111"),
      ),
      123456789,
    );
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
