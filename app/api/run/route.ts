import { limit } from "@/lib/limit";
import { db } from "@/lib/db";
import { user, fail, sameOrigin } from "@/lib/http";
export async function POST(r: Request) {
  try {
    sameOrigin(r);
    const uid = await user();
    await limit(`run:${uid}`, 20, 3600);
    const { agentId, prompt, apiKey } = await r.json();
    if (typeof prompt !== "string" || prompt.length < 1 || prompt.length > 4000)
      throw new Error("Enter a prompt up to 4,000 characters");
    const result = await db().query(
      "SELECT a.* FROM agents a WHERE a.id=$1 AND (a.owner=$2 OR EXISTS(SELECT 1 FROM rentals WHERE agent_id=a.id AND renter=$2 AND status='active' AND expires_at>now()))",
      [agentId, uid],
    );
    if (!result.rows[0])
      throw new Error("An active rental or agent ownership is required");
    const key =
      typeof apiKey === "string" && apiKey.startsWith("sk-")
        ? apiKey
        : process.env.OPENAI_API_KEY;
    if (!key)
      throw new Error(
        "Add your OpenAI API key in Settings to run an agent. ChatGPT identity sign-in alone does not grant AI access.",
      );
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        instructions: `You are a Solana trading research agent. Follow this strategy: ${result.rows[0].strategy}\nDo not invent live prices, returns, trades or on-chain access. You have no trading execution tools. Give research and risk analysis only.`,
        input: prompt,
        max_output_tokens: 1200,
        store: false,
      }),
      signal: AbortSignal.timeout(60000),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(
        response.status === 429
          ? "AI usage limit reached. Try later."
          : "AI request failed. Check your API key and model access.",
      );
    const output = data.output
      ?.flatMap((o: { content?: { text?: string }[] }) => o.content || [])
      .map((c: { text?: string }) => c.text || "")
      .join("\n");
    return Response.json({
      output: output || "No text response was returned.",
    });
  } catch (e) {
    return fail(e);
  }
}
