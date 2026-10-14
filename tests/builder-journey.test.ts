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
  assert.equal(nextChoices(6, { market: "Spot trading" }).length, 0);
});

test("market-specific research and execution choices reflect available integrations", () => {
  assert.ok(
    nextChoices(1, { market: "Memecoin trading" }).includes(
      "Both with rug-risk checks",
    ),
  );
  assert.ok(
    nextChoices(1, { market: "Perp trading" }).includes(
      "Both with liquidation checks",
    ),
  );
  assert.ok(
    !nextChoices(4, { market: "Perp trading" }).includes(
      "Wallet-approved swaps",
    ),
  );
  assert.ok(nextChoices(0).includes("Prediction markets"));
});

test("platform is chosen by the user and overrides model guesses", () => {
  const draft = {
    strategy: "Research token liquidity before entries.",
    integration: "Polymarket" as const,
    maxTradeUsd: 100,
    stopLossPct: 7,
    slippageBps: 50,
  };
  const before = applyPreferences(draft, { market: "Memecoin trading" });
  assert.equal(before.integration, undefined);
  assert.deepEqual(nextChoices(4, { market: "Memecoin trading" }), [
    "Axiom",
    "Fomo",
    "GMGN",
    "Pump.fun",
    "Research only",
  ]);
  assert.deepEqual(nextChoices(4, { market: "Prediction markets" }), [
    "Polymarket",
    "Kalshi",
    "Research only",
  ]);
  assert.equal(
    applyPreferences(draft, { market: "Memecoin trading", execution: "GMGN" })
      .integration,
    "GMGN",
  );
  assert.equal(
    applyPreferences(draft, {
      market: "Memecoin trading",
      execution: "Polymarket",
    }).integration,
    undefined,
  );
});

test("stock tokens have dedicated evidence and explicit research destinations", async () => {
  const { inferMarket } = await import("../lib/builder-journey");
  const { supportsSwaps } = await import("../lib/integrations");
  const { planSchema } = await import("../lib/agent-plan");
  const { integrationData } = await import("../lib/integration-data");
  assert.equal(
    inferMarket("Trade NVDAx stock tokens around earnings"),
    "Stock token trading",
  );
  assert.ok(nextChoices(0).includes("Stock token trading"));
  assert.ok(
    nextChoices(1, { market: "Stock token trading" }).includes(
      "Both with market-hours checks",
    ),
  );
  assert.deepEqual(nextChoices(4, { market: "Stock token trading" }), [
    "DEX Screener",
    "Research only",
  ]);
  assert.equal(supportsSwaps({ market: "Stock token trading" }), false);
  assert.equal(
    supportsSwaps({ market: "Spot trading", category: "Stock Tokens" }),
    false,
  );
  assert.ok(planSchema.shape.category.safeParse("Stock Tokens").success);
  await assert.rejects(
    integrationData({
      market: "Stock token trading",
      integration: "DEX Screener",
      target: "NVDAx",
    }),
    /issuer-verified/,
  );
});
