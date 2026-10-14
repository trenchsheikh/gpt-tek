export const integrationNames = [
  "Solana swaps",
  "DEX Screener",
  "Hyperliquid",
  "Polymarket",
  "Axiom",
  "GMGN",
  "Pump.fun",
  "Fomo",
  "Kalshi",
] as const;
export type Integration = (typeof integrationNames)[number];
export function defaultIntegration(market?: string): Integration {
  return market === "Perp trading"
    ? "Hyperliquid"
    : market === "Prediction markets"
      ? "Polymarket"
      : !market || market === "Spot trading"
        ? "Solana swaps"
        : "DEX Screener";
}
export function integrationInfo(name: Integration) {
  const data =
    name === "Hyperliquid"
      ? "Hyperliquid public perp feed"
      : name === "Polymarket"
        ? "Polymarket public market feed"
        : name === "Kalshi"
          ? null
          : name === "Solana swaps"
            ? "Coinbase SOL/USD"
            : "DEX Screener Solana pairs";
  return {
    name,
    data,
    mode:
      name === "Solana swaps"
        ? "Wallet-approved swaps"
        : data
          ? "Live research · no order signing"
          : "Terminal handoff · no API adapter",
    url: {
      Axiom: "https://axiom.trade",
      GMGN: "https://gmgn.ai",
      "Pump.fun": "https://pump.fun",
      Fomo: "https://fomo.family",
      Kalshi: "https://kalshi.com",
      Hyperliquid: "https://app.hyperliquid.xyz",
      Polymarket: "https://polymarket.com",
      "DEX Screener": "https://dexscreener.com/solana",
      "Solana swaps": "https://jup.ag",
    }[name],
  };
}
export function supportsSwaps(plan: {
  market?: string;
  category?: string;
  integration?: Integration;
}) {
  return (
    (!plan.market || plan.market === "Spot trading") &&
    !["Trenches", "Prediction markets"].includes(plan.category || "") &&
    (!plan.integration || plan.integration === "Solana swaps")
  );
}
