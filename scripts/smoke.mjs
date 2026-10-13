import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "-p",
    "3210",
  ],
  {
    env: { ...process.env, AUTH_SECRET: randomBytes(32).toString("hex") },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Server readiness timeout")),
      20000,
    );
    server.stderr.on("data", (d) => process.stderr.write(d));
    server.stdout.on("data", (d) => {
      if (d.toString().includes("Ready")) {
        clearTimeout(timer);
        resolve();
      }
    });
    server.on("exit", (c) => {
      clearTimeout(timer);
      reject(new Error(`Server exited ${c}`));
    });
  });
  const base = "http://localhost:3210";
  const page = await fetch(base);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Different minds/);
  const workspace = await fetch(base + "/app");
  assert.equal(workspace.status, 200);
  assert.match(await workspace.text(), /build your edge/);
  const errorPage = await fetch(base + "/sign-in?error=Configuration");
  assert.equal(errorPage.status, 200);
  assert.match(await errorPage.text(), /Sign-in could not be completed/);
  const models = await fetch(base + "/api/models");
  assert.equal(models.status, 200);
  const catalogue = await models.json();
  assert.ok(catalogue.length > 100);
  assert.ok(
    catalogue.every((m) => m.id && m.name && !m.id.startsWith("openrouter/")),
  );
  const market = await fetch(base + "/api/market");
  assert.equal(market.status, 200);
  assert.ok((await market.json()).price > 0);
  const favicon = await fetch(base + "/favicon.png");
  assert.equal(favicon.status, 200);
  const status = await fetch(base + "/api/status");
  assert.equal(status.status, 200);
  const session = await fetch(base + "/api/auth/session");
  assert.equal(session.status, 200);
  assert.equal(await session.json(), null);
  for (const path of [
    "/api/agents",
    "/api/rentals",
    "/api/mint",
    "/api/run",
    "/api/paper",
    "/api/decide",
    "/api/trade",
  ]) {
    const r = await fetch(base + path, {
      method: "POST",
      headers: { Origin: base, "Content-Type": "application/json" },
      body: "{}",
    });
    assert.equal(r.status, 401, path);
    assert.match((await r.json()).error, /Sign in/);
  }
  const csrf = await fetch(base + "/api/agents", {
    method: "POST",
    headers: {
      Origin: "https://attacker.example",
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  assert.equal(csrf.status, 400);
  console.log(
    "PASS: SSR, logo/favicon route, status, session, protected endpoints, cross-origin rejection.",
  );
} finally {
  server.kill("SIGTERM");
}
