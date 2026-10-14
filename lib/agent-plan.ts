import { z } from "zod";
import { integrationNames } from "./integrations";
import { markets } from "./builder-journey";
export const stages = [
  "research",
  "reasoning",
  "decision",
  "execution",
] as const;
export const planSchema = z.object({
  market: z.enum(markets).optional(),
  integration: z.enum(integrationNames).optional(),
  target: z.string().min(1).max(80).optional(),
  name: z.string().min(3).max(60),
  description: z.string().min(10).max(300),
  strategy: z.string().min(30).max(8000),
  category: z.enum([
    "Research",
    "Momentum",
    "DeFi",
    "Risk management",
    "Trenches",
    "Prediction markets",
    "Stock Tokens",
    "Arbitrage",
  ]),
  models: z.object({
    research: z.string().min(1),
    reasoning: z.string().min(1),
    decision: z.string().min(1),
    execution: z.string().min(1),
  }),
  maxTradeUsd: z.number().min(1).max(10000),
  slippageBps: z.number().int().min(10).max(100),
  stopLossPct: z.number().min(1).max(30),
});
export const decisionSchema = z.object({
  action: z.enum(["buy", "sell", "hold"]),
  amountUsd: z.number().min(0).max(10000),
  reason: z.string().max(3000),
});
export function guardDecision(
  d: z.infer<typeof decisionSchema>,
  maxTradeUsd: number,
  availableUsd: number,
) {
  if (d.action === "hold") return { ...d, amountUsd: 0 };
  if (
    d.amountUsd <= 0 ||
    d.amountUsd > maxTradeUsd ||
    d.amountUsd > availableUsd
  )
    throw new Error("The model’s trade exceeds your configured limits.");
  return d;
}
export function paperTrade(
  state: { usd: number; sol: number },
  action: "buy" | "sell" | "hold",
  amountUsd: number,
  price: number,
) {
  if (
    !Number.isFinite(price) ||
    price <= 0 ||
    !Number.isFinite(amountUsd) ||
    amountUsd < 0
  )
    throw new Error("Invalid paper trade");
  if (action === "hold") return state;
  const fee = amountUsd * 0.001;
  if (action === "buy") {
    if (amountUsd + fee > state.usd)
      throw new Error("Insufficient paper USD balance");
    return {
      usd: state.usd - amountUsd - fee,
      sol: state.sol + amountUsd / price,
    };
  }
  if (amountUsd / price > state.sol)
    throw new Error("Insufficient paper SOL balance");
  return {
    usd: state.usd + amountUsd - fee,
    sol: state.sol - amountUsd / price,
  };
}
