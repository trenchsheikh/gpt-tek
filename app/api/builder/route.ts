import { z } from "zod";
import { complete, models } from "@/lib/models";
import { auth } from "@/lib/auth";
import { limit } from "@/lib/limit";
import { fail, sameOrigin } from "@/lib/http";
const input = z.object({
  model: z.string(),
  apiKey: z.string().max(200).optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(6000),
      }),
    )
    .min(1)
    .max(20),
});
export const maxDuration = 60;
export async function POST(r: Request) {
  try {
    sameOrigin(r);
    const b = input.parse(await r.json());
    if (!b.apiKey) {
      const s = await auth();
      if (!s?.user?.id)
        throw new Error("Sign in or add your model access key in Settings.");
      await limit(`builder:${s.user.id}`, 30, 3600);
    }
    const catalogue = await models();
    const choices = catalogue
      .filter((m) =>
        ["openai", "anthropic", "google", "deepseek", "qwen", "x-ai"].includes(
          m.provider,
        ),
      )
      .sort((a, b) => b.context - a.context)
      .slice(0, 45);
    const output = await complete(
      b.model,
      [
        {
          role: "system",
          content: `You are the AgentRouter trading-agent architect. Help users develop a SOL/USDC strategy by asking about timeframe, trading rules, risk tolerance and budget. Recommend a model for research, reasoning, decision, execution planning using ONLY this live model catalogue: ${JSON.stringify(choices)}. Explain tradeoffs honestly, never claim a model guarantees returns. Execution is a deterministic risk-checked wallet-approved swap, never an LLM signing money. Do not reveal infrastructure provider names. Once enough information is gathered, include one fenced JSON object matching {name,description,strategy,category,models:{research,reasoning,decision,execution},maxTradeUsd,slippageBps,stopLossPct}. Category is Research, Momentum, DeFi or Risk management. maxTradeUsd 1–10000, slippageBps 10–100, stopLossPct 1–30. Keep conversation concise.`,
        },
        ...b.messages,
      ],
      b.apiKey,
    );
    return Response.json({ output });
  } catch (e) {
    return fail(e);
  }
}
