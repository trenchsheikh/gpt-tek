import type { z } from "zod";
import type { planSchema } from "./agent-plan";
type Plan = z.infer<typeof planSchema>;
const models = {
  research: "openrouter/auto",
  reasoning: "openrouter/auto",
  decision: "openrouter/auto",
  execution: "openrouter/auto",
};
const entries = [
  [
    "Bonding Curve Scout",
    "Memecoin trading",
    "Trenches",
    "Aggressive",
    100,
    12,
    "Scout pump.fun bonding-curve momentum. Require verified graduation progress, minimum liquidity and holder concentration checks. Reject suspicious supply or missing evidence. Enter only on confirmed momentum, avoid averaging down and exit on weakening volume or a 12% loss. Public research only until a supported token execution adapter is connected.",
  ],
  [
    "Fresh Pair Sentinel",
    "Memecoin trading",
    "Trenches",
    "Balanced",
    50,
    7,
    "Research new Solana pairs after a liquidity floor and sustained volume confirmation. Screen holder concentration, contract risks and spread. Wait for a pullback rather than chasing the first candle. Cap positions at $50 and hold when holder or liquidity evidence is missing. No unattended orders.",
  ],
  [
    "Equity Catalyst",
    "Stock token trading",
    "Stock Tokens",
    "Balanced",
    50,
    5,
    "Research stock-token momentum around earnings and company catalysts. Ask the user for the underlying stock and issuer-verified Solana token mint. Compare token liquidity with fresh underlying-price evidence, corporate actions and market hours. Hold when backing, eligibility or earnings evidence cannot be verified. Stock-token execution is not connected.",
  ],
  [
    "Event Odds Analyst",
    "Prediction markets",
    "Prediction markets",
    "Conservative",
    25,
    3,
    "Research event probabilities against market-implied odds. Verify resolution rules, source freshness and contradictory evidence. Require multiple independent sources and a clear edge after costs. Cap event exposure at $25 and skip ambiguous settlement conditions. Prediction-market order signing requires an authorized adapter.",
  ],
  [
    "Funding Fade",
    "Perp trading",
    "Momentum",
    "Aggressive",
    100,
    10,
    "Research stretched funding, open interest and trend exhaustion for potential mean-reversion setups. Review volatility, liquidation distance and exchange margin requirements. Reject trades without verified risk evidence. No automatic leverage or live perp order signing. Synthetic tests use a long-only proxy and do not simulate funding or liquidation.",
  ],
  [
    "Spread Watcher",
    "Arbitrage",
    "Arbitrage",
    "Conservative",
    25,
    3,
    "Compare the same verified asset across venues. Require the spread to exceed all fees, slippage and a latency buffer. Check available depth on both legs and reject stale quotes. Hold unless both legs and settlement constraints are verified. Research-only arbitrage; synthetic tests do not model two-leg fills or guaranteed spreads.",
  ],
  [
    "SOL Trend Keeper",
    "Spot trading",
    "Risk management",
    "Conservative",
    25,
    3,
    "Research SOL/USDC trend and liquidity. Enter only after corroborated trend confirmation, cap positions at $25, keep cash reserves and exit when the thesis breaks or loss reaches 3%. Avoid overtrading in chop. Every supported live swap requires wallet approval.",
  ],
] as const;
export const featuredTemplates = entries.map(
  ([name, market, category, riskLevel, cap, stop, strategy], i) => {
    const description = `${riskLevel} ${market.toLowerCase()} strategy. ${["Bonding-curve momentum with strict risk screens.", "Pullback entries after liquidity and volume checks.", "Earnings catalysts with issuer and liquidity checks.", "Evidence-led event pricing and resolution checks.", "Funding extremes with liquidation-risk review.", "Cross-venue spread research after costs.", "Patient SOL momentum with tight exposure limits."][i]}`;
    const plan: Plan = {
      name,
      description,
      strategy,
      market,
      category,
      models,
      maxTradeUsd: cap,
      stopLossPct: stop,
      slippageBps: riskLevel === "Aggressive" ? 75 : 30,
    };
    return {
      id: `agentrouter-template-${i + 1}`,
      name,
      description,
      category,
      plan,
      models,
      builtin: true,
      creator: "AgentRouter",
      riskLevel,
      hourly_lamports: "0",
      hourly_agent: 0,
      wallet: "",
      avatar: i % 6,
      avatar_color: [
        "#bba7f5",
        "#c5de87",
        "#aabff5",
        "#edc397",
        "#c8a5d9",
        "#9bd4bd",
        "#bba7f5",
      ][i],
    };
  },
);
