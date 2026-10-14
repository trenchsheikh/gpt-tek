import { defaultIntegration } from "./integrations";
export const markets = [
  "Memecoin trading",
  "Perp trading",
  "Spot trading",
  "Prediction markets",
  "DeFi and yield",
  "Arbitrage",
  "Portfolio management",
  "Market research",
] as const;
export const marketNotes: Record<string, string> = {
  "Memecoin trading":
    "Liquidity, holders and rug-risk checks before chasing momentum. Token execution needs a supported integration.",
  "Perp trading":
    "Funding, open interest, liquidation distance and leverage limits come first. Perp execution isn’t connected yet.",
  "Spot trading":
    "Trend, liquidity and entry/exit rules. Live wallet-approved execution currently supports SOL/USDC only.",
  "Prediction markets":
    "Event evidence, resolution rules and implied odds. Market execution isn’t connected yet.",
  "DeFi and yield":
    "Protocol risk, yield sustainability and exit liquidity. Protocol execution isn’t connected yet.",
  Arbitrage:
    "Check the spread after fees, slippage and latency. Multi-venue execution isn’t connected yet.",
  "Portfolio management":
    "Exposure, concentration and rebalancing rules. Portfolio-wide execution isn’t connected yet.",
  "Market research":
    "Cross-check sources and flag missing evidence. This is a research blueprint, not live execution.",
};
export const journey = [
  {
    key: "market",
    question:
      "First, what arena are we building for? Memecoins, perps, spot, prediction markets, or another setup?",
    options: markets,
  },
  {
    key: "risk",
    question:
      "What’s your risk appetite? Keep it chill, balanced, or more aggressive?",
    options: ["Conservative", "Balanced", "Growth"],
  },
  {
    key: "research",
    question: "What should it research before making a decision?",
    options: [
      "Price and liquidity",
      "News and sentiment",
      "Both with cross-checks",
    ],
  },
  {
    key: "timeframe",
    question: "What’s the play: intraday moves, a few days, or a longer hold?",
    options: ["Intraday", "Several days", "Longer-term"],
  },
  {
    key: "size",
    question:
      "How much can the agent put into a single trade? This is a hard cap, not a target.",
    options: ["$25 per trade", "$100 per trade", "$250 per trade"],
  },
  {
    key: "execution",
    question: "How do you want to run the first version?",
    options: ["Research only", "Paper testing first", "Wallet-approved swaps"],
  },
  {
    key: "review",
    question:
      "Setup locked in. Ready for the full playbook and the model picks, with a reason for each?",
    options: ["Finish blueprint", "Adjust strategy"],
  },
] as const;
export type Preferences = Record<string, string>;
export const flowSteps = journey.length - 1;
export function displayStep(step: number, preferences: Preferences) {
  return preferences.market ? step + 1 : 0;
}
export function inferMarket(text: string) {
  const t = text.toLowerCase();
  if (/memecoin|meme coin|trenches/.test(t)) return "Memecoin trading";
  if (/perp|futures/.test(t)) return "Perp trading";
  if (/prediction|polymarket|kalshi/.test(t)) return "Prediction markets";
  if (/defi|yield|lend|staking/.test(t)) return "DeFi and yield";
  if (/arbitrage|arb bot/.test(t)) return "Arbitrage";
  if (/portfolio|rebalance/.test(t)) return "Portfolio management";
  if (/spot/.test(t)) return "Spot trading";
  if (/market research|research only/.test(t)) return "Market research";
  return null;
}
export function stageFor(step: number, preferences: Preferences = {}) {
  const stage = journey[preferences.market ? step + 1 : 0];
  if (stage?.key === "execution" && preferences.market !== "Spot trading")
    return {
      ...stage,
      question:
        "Execution for this market isn’t connected yet. Start with research or map the paper-test workflow?",
      options: ["Research only", "Plan a paper-test workflow"],
    };
  if (!stage || stage.key !== "research") return stage;
  const options: Record<string, readonly string[]> = {
    "Memecoin trading": [
      "Liquidity and holder scans",
      "Social momentum and narratives",
      "Both with rug-risk checks",
    ],
    "Perp trading": [
      "Funding and open interest",
      "Trend and volatility",
      "Both with liquidation checks",
    ],
    "Prediction markets": [
      "Event evidence and sources",
      "Odds and resolution rules",
      "Both with source cross-checks",
    ],
    "DeFi and yield": [
      "Protocol and contract risk",
      "Yield and exit liquidity",
      "Both with exposure checks",
    ],
    Arbitrage: [
      "Venue spreads and liquidity",
      "Fees, slippage and latency",
      "Both with net-edge checks",
    ],
    "Portfolio management": [
      "Exposure and concentration",
      "Trend and rebalance signals",
      "Both with downside checks",
    ],
  };
  return {
    ...stage,
    question:
      "What should the agent scan before it makes a call? Pick its main evidence stack.",
    options: options[preferences.market] || stage.options,
  };
}
export function nextChoices(
  step: number,
  preferences: Preferences = {},
): readonly string[] {
  return stageFor(step, preferences)?.options || [];
}
export function applyPreferences<
  T extends {
    strategy: string;
    integration?: import("./integrations").Integration;
    maxTradeUsd: number;
    stopLossPct: number;
    slippageBps: number;
  },
>(plan: T, preferences: Preferences): T {
  const risk = preferences.risk;
  const max = {
    "$25 per trade": 25,
    "$100 per trade": 100,
    "$250 per trade": 250,
  }[preferences.size];
  const base = plan.strategy.split("\nUser preferences:")[0];
  return {
    ...plan,
    ...(preferences.market
      ? {
          market: preferences.market,
          integration:
            plan.integration || defaultIntegration(preferences.market),
        }
      : {}),
    maxTradeUsd: max || plan.maxTradeUsd,
    stopLossPct:
      risk === "Conservative"
        ? 3
        : risk === "Balanced"
          ? 7
          : risk === "Growth"
            ? 12
            : plan.stopLossPct,
    slippageBps:
      risk === "Conservative"
        ? 30
        : risk === "Balanced"
          ? 50
          : risk === "Growth"
            ? 75
            : plan.slippageBps,
    strategy:
      base +
      (Object.keys(preferences).length
        ? "\nUser preferences: " +
          Object.entries(preferences)
            .filter(([k]) => k !== "review")
            .map(([k, v]) => `${k}: ${v}`)
            .join("; ") +
          ". These preferences do not enable unsupported integrations or unattended signing. Hold when required evidence is unavailable. Every live swap requires wallet approval."
        : ""),
  };
}
