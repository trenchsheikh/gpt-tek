import { z } from "zod";
export const simulationRules = z.object({
  approach: z.enum([
    "momentum",
    "mean-reversion",
    "breakout",
    "event",
    "yield",
    "arbitrage",
  ]),
  lookback: z.number().int().min(3).max(30),
  threshold: z.number().min(0.001).max(0.08),
  exposure: z.number().min(0.05).max(0.5),
  holdingBars: z.number().int().min(2).max(40),
  takeProfit: z.number().min(0.01).max(0.3),
  explanation: z.string().min(10).max(600),
});
export type SimulationRules = z.infer<typeof simulationRules>;
type Limits = {
  maxTradeUsd: number;
  stopLossPct: number;
  slippageBps: number;
  market?: string;
};
export function simulate(rules: SimulationRules, plan: Limits, seed: number) {
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return (state + 1) / 4294967297;
  };
  const market = plan.market || "Spot trading";
  // Mix nearby replay seeds before selecting a stress regime.
  for (let i = 0; i < 8; i++) random();
  const scenario =
    market === "Memecoin trading"
      ? ["Momentum mania", "Liquidity collapse", "Volatile chop"][
          Math.floor(random() * 3)
        ]
      : market === "Stock token trading"
        ? "Tokenized equity proxy"
        : "Mixed market";
  const volatility =
    market === "Memecoin trading"
      ? 0.085
      : market === "Stock token trading"
        ? 0.009
        : market === "Perp trading"
          ? 0.022
          : market === "Prediction markets"
            ? 0.017
            : market === "DeFi and yield"
              ? 0.005
              : 0.012;
  const bars = 1200;
  let price = 100,
    cash = 100,
    peak = 100,
    drawdown = 0,
    fees = 0;
  let position: { entry: number; size: number; bar: number } | null = null;
  const prices: number[] = [],
    curve: { bar: number; equity: number; trades: number }[] = [];
  const trades: {
    entry: number;
    exit: number;
    size: number;
    pnl: number;
    fee: number;
    bar: number;
    reason: string;
  }[] = [];
  const feeRate = 0.001 + plan.slippageBps / 10000;
  let regime = 0;
  for (let bar = 0; bar < bars; bar++) {
    if (bar % 100 === 0) regime = (random() - 0.5) * volatility * 0.35;
    const noise = (random() + random() + random() - 1.5) * volatility;
    const bias =
      scenario === "Momentum mania"
        ? 0.017
        : scenario === "Liquidity collapse"
          ? -0.014
          : 0;
    const jump =
      market === "Memecoin trading" && random() < 0.018
        ? random() < 0.45
          ? -(0.3 + random() * 1.5)
          : 0.25 + random() * 0.9
        : 0;
    // Synthetic path is generated independently of the strategy: no future data in entry signals.
    price = Math.max(
      0.000001,
      price *
        Math.exp(noise + regime + bias + jump - (volatility * volatility) / 2),
    );
    prices.push(price);
    const history = prices.slice(Math.max(0, bar - rules.lookback), bar);
    const average = history.reduce((a, b) => a + b, 0) / (history.length || 1);
    const change = history.length ? price / history[0] - 1 : 0;
    if (position) {
      const move = price / position.entry - 1;
      const reason =
        move <= -plan.stopLossPct / 100
          ? "Stop loss"
          : move >= rules.takeProfit
            ? "Take profit"
            : bar - position.bar >= rules.holdingBars || bar === bars - 1
              ? "Time exit"
              : "";
      if (reason) {
        const gross = position.size * move;
        const fee = position.size * feeRate * (1 + price / position.entry);
        const pnl = Math.max(-position.size, gross - fee);
        cash += pnl;
        fees += fee;
        trades.push({
          entry: position.entry,
          exit: price,
          size: position.size,
          pnl,
          fee,
          bar,
          reason,
        });
        position = null;
      }
    } else if (bar > rules.lookback && bar < bars - 1 && cash > 1) {
      const enter =
        rules.approach === "mean-reversion"
          ? price < average * (1 - rules.threshold)
          : rules.approach === "breakout"
            ? price > Math.max(...history) * (1 + rules.threshold / 3)
            : rules.approach === "event"
              ? Math.abs(change) > rules.threshold && change > 0
              : rules.approach === "yield"
                ? Math.abs(change) < rules.threshold
                : rules.approach === "arbitrage"
                  ? Math.abs(price / average - 1) > rules.threshold &&
                    price < average
                  : change > rules.threshold;
      if (enter)
        position = {
          entry: price,
          size: Math.min(plan.maxTradeUsd, cash * rules.exposure),
          bar,
        };
    }
    const equity =
      cash +
      (position
        ? Math.max(
            -position.size,
            position.size * (price / position.entry - 1) -
              position.size * feeRate,
          )
        : 0);
    peak = Math.max(peak, equity);
    drawdown = Math.max(drawdown, ((peak - equity) / peak) * 100);
    if (bar % 10 === 0 || bar === bars - 1)
      curve.push({ bar, equity, trades: trades.length });
  }
  const profit = cash - 100,
    returnPct = profit,
    wins = trades.filter((t) => t.pnl > 0).length;
  const totalWins = trades.reduce((n, t) => n + Math.max(0, t.pnl), 0),
    totalLosses = trades.reduce((n, t) => n + Math.max(0, -t.pnl), 0);
  const profitFactor = totalLosses
    ? totalWins / totalLosses
    : totalWins
      ? null
      : 0;
  const sampleScore = Math.min(20, trades.length / 5);
  const riskScore = Math.max(0, 40 - drawdown * 2);
  const performanceScore = Math.max(0, Math.min(40, 20 + returnPct));
  return {
    mode: "synthetic" as const,
    seed,
    market,
    scenario,
    initialCapital: 100,
    endingEquity: cash,
    profit,
    returnPct,
    fees,
    drawdown,
    tradeCount: trades.length,
    winRate: trades.length ? (wins / trades.length) * 100 : 0,
    profitFactor,
    score: Math.round(
      trades.length ? sampleScore + riskScore + performanceScore : 0,
    ),
    scoreBreakdown: {
      sample: sampleScore,
      risk: riskScore,
      performance: performanceScore,
    },
    bars,
    rules,
    curve,
    trades,
    assumptions: [
      "Synthetic prices; 1,200 abstract time steps, not historical market data. Memecoin stress scenarios add extreme upward and downward jumps, mania and liquidity-collapse regimes.",
      ...(market === "Stock token trading"
        ? [
            "Stock-token proxy only: no earnings calendar, underlying equity feed, market closures, issuer backing or corporate actions are simulated.",
          ]
        : []),
      "Long-only proxy for the chosen market; no real order book, funding, yields, event resolution or venue execution.",
      "$100 starting capital; no leverage. Position sizing is capped by your blueprint and available capital.",
      "Costs include 10 bps per side plus configured slippage. Stops fill at observed prices and may gap.",
      "Score: sample size (20), drawdown control (40), net return (40). This is a scenario score, not a forecast.",
    ],
  };
}
export type SimulationResult = ReturnType<typeof simulate> & {
  engine: string;
  configuredModels: Record<string, string>;
};
