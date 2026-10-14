import { test } from "node:test";
import assert from "node:assert/strict";
import {
  supportsSwaps,
  defaultIntegration,
  integrationInfo,
} from "../lib/integrations";
import { applyPreferences } from "../lib/builder-journey";
test("market selections choose research feeds and never silently enable unsupported orders", () => {
  assert.equal(defaultIntegration("Perp trading"), "Hyperliquid");
  assert.equal(defaultIntegration("Prediction markets"), "Polymarket");
  assert.equal(defaultIntegration("Memecoin trading"), "DEX Screener");
  assert.equal(
    supportsSwaps({ market: "Perp trading", integration: "Hyperliquid" }),
    false,
  );
  assert.equal(
    supportsSwaps({ market: "Spot trading", integration: "Axiom" }),
    false,
  );
  assert.equal(
    supportsSwaps({ market: "Spot trading", integration: "Solana swaps" }),
    true,
  );
  assert.equal(integrationInfo("Kalshi").data, null);
  const p = applyPreferences(
    {
      strategy: "Research funding with bounded exposure.",
      maxTradeUsd: 25,
      stopLossPct: 3,
      slippageBps: 30,
    },
    { market: "Perp trading" },
  );
  assert.equal(
    (p as typeof p & { integration: string }).integration,
    undefined,
  );
  assert.equal(
    (
      applyPreferences(p, {
        market: "Perp trading",
        execution: "Hyperliquid",
      }) as typeof p & { integration: string }
    ).integration,
    "Hyperliquid",
  );
});
