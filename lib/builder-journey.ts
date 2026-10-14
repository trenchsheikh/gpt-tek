export const journey = [
  {
    key: "risk",
    question: "How much risk should your agent take?",
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
    question: "What trading horizon suits your strategy?",
    options: ["Intraday", "Several days", "Longer-term"],
  },
  {
    key: "size",
    question: "Set the maximum size of each trade.",
    options: ["$25 per trade", "$100 per trade", "$250 per trade"],
  },
  {
    key: "execution",
    question: "How would you like to start?",
    options: ["Research only", "Paper testing first", "Wallet-approved swaps"],
  },
  {
    key: "review",
    question:
      "Your preferences are set. Shall I finish the strategy and choose a model for each role?",
    options: ["Finish blueprint", "Adjust strategy"],
  },
] as const;
export type Preferences = Record<string, string>;
export function nextChoices(step: number) {
  return journey[step]?.options || [];
}
export function applyPreferences<
  T extends {
    strategy: string;
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
