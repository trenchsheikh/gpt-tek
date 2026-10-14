// Compatibility endpoint for previously saved single-model research agents.
import { agentAccess } from "@/lib/access";
import { complete, models } from "@/lib/models";
import { user, fail, sameOrigin } from "@/lib/http";
import { limit } from "@/lib/limit";
import { z } from "zod";
export const maxDuration = 60;
export async function POST(r: Request) {
  try {
    sameOrigin(r);
    const uid = await user();
    await limit(`run:${uid}`, 20, 3600);
    const b = z
      .object({
        agentId: z.uuid(),
        prompt: z.string().min(1).max(4000),
        apiKey: z.string().max(200).optional(),
      })
      .parse(await r.json());
    const a = await agentAccess(b.agentId, uid);
    const list = await models();
    const model =
      a.plan?.models?.research ||
      list.find((m) => m.provider === "anthropic" && !m.id.includes(":"))?.id ||
      list[0]?.id;
    if (!model) throw new Error("Model catalogue unavailable");
    return Response.json({
      output: await complete(
        model,
        [
          {
            role: "system",
            content: `You are an AgentRouter research agent. Strategy: ${a.strategy}. You have no live market tools in this endpoint. Never invent prices or trades.`,
          },
          { role: "user", content: b.prompt },
        ],
        b.apiKey,
      ),
    });
  } catch (e) {
    return fail(e);
  }
}
