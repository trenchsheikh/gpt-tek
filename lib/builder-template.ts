import { z } from "zod";
import { planSchema } from "./agent-plan";
import type { Model } from "./models";
export const templates = {
  Momentum: {
    name: "Momentum Scout",
    description: "A risk-bounded SOL momentum strategy.",
    strategy:
      "Research SOL momentum and liquidity. Require corroborating evidence before entering. Size each position within the configured USD limit. Hold when data is missing. Review exits and exposure before every wallet-approved swap.",
  },
  Research: {
    name: "Signal Researcher",
    description: "A research-first SOL and USDC strategy.",
    strategy:
      "Compare independent market evidence and liquidity conditions for SOL. Identify contradictions. Hold without reliable evidence. Cap trade sizes and require wallet approval for all execution.",
  },
  "Risk management": {
    name: "Exposure Guardian",
    description: "A conservative SOL and USDC exposure strategy.",
    strategy:
      "Prioritise downside scenarios and exposure limits. Review market evidence, liquidity and portfolio concentration. Reduce exposure only with a supported thesis. Hold if evidence is weak. Every swap requires wallet approval.",
  },
  DeFi: {
    name: "Liquidity Analyst",
    description: "A liquidity-aware Solana strategy.",
    strategy:
      "Research liquidity and market structure before evaluating SOL and USDC entries. Compare transaction costs and slippage. Hold if liquidity is insufficient. Apply configured trade limits and require wallet approval.",
  },
  Trenches: {
    name: "Trenches Scout",
    description: "A discovery and risk-screening strategy for Solana tokens.",
    strategy:
      "Research token liquidity, holder concentration, contract risks and volatility. Reject unsupported claims. Hold without verified live evidence. Token discovery and terminal execution require a supported integration; current live swaps are SOL/USDC only.",
  },
  "Prediction markets": {
    name: "Probability Analyst",
    description: "An evidence-led prediction-market research strategy.",
    strategy:
      "Research event definitions, resolution rules, sources and implied probabilities. Distinguish evidence from opinion. Hold without verified event data. Polymarket and Kalshi execution is unavailable until an authenticated integration is configured.",
  },
};
export const builderResultSchema = z.object({
  inScope: z.boolean(),
  message: z.string().min(1).max(500),
  plan: planSchema.nullable(),
  reasons: z.object({
    research: z.string().max(180),
    reasoning: z.string().max(180),
    decision: z.string().max(180),
    execution: z.string().max(180),
  }),
});
export function validateBuilderResult(raw: unknown, catalogue: Model[]) {
  const result = builderResultSchema.parse(raw);
  if (!result.inScope)
    return {
      ...result,
      message:
        "I can help with agent strategies, model selection and risk limits. What trading agent would you like to build?",
      plan: null,
    };
  if (result.plan) {
    for (const id of Object.values(result.plan.models))
      if (!catalogue.some((m) => m.id === id))
        throw new Error(
          "The architect selected an unavailable model. Please retry.",
        );
  }
  return {
    ...result,
    message: result.message.split(/\s+/).slice(0, 60).join(" "),
  };
}
export function isInjection(text: string) {
  return /ignore (all |the |your )?(previous|system|instructions)|reveal.{0,25}(system prompt|api.?key|secret)|jailbreak|developer mode|pretend.{0,20}(no rules|unrestricted)|bypass.{0,20}(guardrails|instructions)/i.test(
    text,
  );
}
