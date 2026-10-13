import { test } from "node:test";
import assert from "node:assert/strict";
import { guardDecision, paperTrade, planSchema } from "../lib/agent-plan";
test("model decisions cannot exceed strategy or wallet limits", () => {
  assert.throws(() =>
    guardDecision({ action: "buy", amountUsd: 101, reason: "test" }, 100, 1000),
  );
  assert.throws(() =>
    guardDecision({ action: "buy", amountUsd: 100, reason: "test" }, 200, 50),
  );
  assert.equal(
    guardDecision(
      { action: "hold", amountUsd: 500, reason: "No evidence" },
      100,
      50,
    ).amountUsd,
    0,
  );
});
test("paper simulation conserves holdings minus disclosed fees", () => {
  const buy = paperTrade({ usd: 10000, sol: 0 }, "buy", 100, 100);
  assert.equal(buy.sol, 1);
  assert.equal(buy.usd, 9899.9);
  const sell = paperTrade(buy, "sell", 100, 100);
  assert.equal(sell.sol, 0);
  assert.ok(Math.abs(sell.usd - 9999.8) < 1e-8);
  assert.throws(() => paperTrade({ usd: 10, sol: 0 }, "buy", 10, 100));
  assert.throws(() => paperTrade({ usd: 100, sol: 0 }, "sell", 100, 100));
  assert.throws(() => paperTrade({ usd: 100, sol: 0 }, "buy", 10, 0));
});
test("risk controls are bounded independently of model output", () => {
  const p = {
    name: "Research agent",
    description: "Evidence-based research agent",
    strategy: "Evaluate supplied market data before considering a trade.",
    category: "Research",
    models: { research: "a", reasoning: "a", decision: "a", execution: "a" },
    maxTradeUsd: 100,
    slippageBps: 50,
    stopLossPct: 10,
  };
  assert.equal(planSchema.safeParse(p).success, true);
  assert.equal(
    planSchema.safeParse({ ...p, slippageBps: 5000 }).success,
    false,
  );
  assert.equal(planSchema.safeParse({ ...p, maxTradeUsd: -1 }).success, false);
});
