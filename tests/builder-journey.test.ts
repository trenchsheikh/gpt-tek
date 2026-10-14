import { test } from "node:test";
import assert from "node:assert/strict";
import { applyPreferences, nextChoices } from "../lib/builder-journey";
test("guided choices enforce risk and size without accumulating duplicate strategy text", () => {
  const draft = {
    strategy: "Research SOL liquidity before trading.",
    maxTradeUsd: 100,
    stopLossPct: 10,
    slippageBps: 50,
  };
  const preferences = {
    risk: "Conservative",
    size: "$25 per trade",
    research: "Both with cross-checks",
    execution: "Paper testing first",
  };
  const updated = applyPreferences(draft, preferences);
  assert.equal(updated.maxTradeUsd, 25);
  assert.equal(updated.stopLossPct, 3);
  assert.equal(updated.slippageBps, 30);
  assert.match(updated.strategy, /Paper testing first/);
  assert.deepEqual(applyPreferences(updated, preferences), updated);
  assert.equal(nextChoices(6).length, 0);
});
