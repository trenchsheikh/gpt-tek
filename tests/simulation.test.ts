import { test } from "node:test";
import assert from "node:assert/strict";
import { simulate, simulationRules } from "../lib/simulation";
const rules = simulationRules.parse({
  approach: "momentum",
  lookback: 8,
  threshold: 0.007,
  exposure: 0.4,
  holdingBars: 8,
  takeProfit: 0.04,
  explanation: "Follow positive momentum with a limited holding period.",
});
const plan = {
  maxTradeUsd: 25,
  stopLossPct: 5,
  slippageBps: 50,
  market: "Memecoin trading",
};
test("synthetic simulation is reproducible and accounts for every closed trade", () => {
  const a = simulate(rules, plan, 1234),
    b = simulate(rules, plan, 1234);
  assert.deepEqual(a, b);
  assert.ok(a.tradeCount > 0);
  assert.ok(
    Math.abs(a.endingEquity - (100 + a.trades.reduce((n, t) => n + t.pnl, 0))) <
      1e-8,
  );
  assert.equal(a.profit, a.endingEquity - 100);
  assert.equal(a.returnPct, a.profit);
  assert.equal(a.curve.at(-1)?.equity, a.endingEquity);
  assert.ok(a.trades.every((t) => t.size <= 25 && t.fee > 0));
  assert.ok(a.score >= 0 && a.score <= 100);
  assert.ok(a.endingEquity >= 0);
});
test("strategy rules, market type and seed alter outcomes without forcing profit", () => {
  const a = simulate(rules, plan, 1234);
  assert.notEqual(a.endingEquity, simulate(rules, plan, 4321).endingEquity);
  assert.notEqual(
    a.endingEquity,
    simulate({ ...rules, approach: "mean-reversion" }, plan, 1234).endingEquity,
  );
  assert.notEqual(
    a.endingEquity,
    simulate(rules, { ...plan, market: "DeFi and yield" }, 1234).endingEquity,
  );
  assert.ok(
    Array.from(
      { length: 20 },
      (_, seed) => simulate(rules, plan, seed).profit,
    ).some((p) => p < 0),
  );
});
test("more fees reduce equity on the same path and no-trade strategies earn no fabricated score", () => {
  const a = simulate(rules, { ...plan, slippageBps: 10 }, 1234),
    b = simulate(rules, { ...plan, slippageBps: 100 }, 1234);
  assert.ok(b.endingEquity < a.endingEquity);
  const none = simulate(
    { ...rules, threshold: 0.08 },
    { ...plan, market: "DeFi and yield" },
    1234,
  );
  assert.equal(none.tradeCount, 0);
  assert.equal(none.profit, 0);
  assert.equal(none.score, 0);
});
