export type Model = {
  id: string;
  name: string;
  provider: string;
  context: number;
  inputPrice: number;
  outputPrice: number;
  reasoning: boolean;
  tools: boolean;
  description: string;
};
export async function models(): Promise<Model[]> {
  const r = await fetch("https://openrouter.ai/api/v1/models", {
    next: { revalidate: 900 },
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok)
    throw new Error(
      "The model catalogue is temporarily unavailable. Please retry.",
    );
  const d = await r.json();
  return d.data
    .filter((m: { id: string }) => !m.id.startsWith("openrouter/"))
    .filter((m: { architecture?: { output_modalities?: string[] } }) =>
      m.architecture?.output_modalities?.includes("text"),
    )
    .map(
      (m: {
        id: string;
        name: string;
        description?: string;
        context_length: number;
        pricing: { prompt: string; completion: string };
        supported_parameters?: string[];
      }) => ({
        id: m.id,
        name: m.name,
        provider: m.id.split("/")[0],
        context: m.context_length,
        inputPrice: Number(m.pricing.prompt) * 1e6,
        outputPrice: Number(m.pricing.completion) * 1e6,
        reasoning: !!m.supported_parameters?.includes("reasoning"),
        tools: !!m.supported_parameters?.includes("tools"),
        description: m.description?.slice(0, 500) || "",
      }),
    );
}
export async function complete(
  model: string,
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  key?: string,
  json = false,
) {
  const credential = key || process.env.OPENROUTER_API_KEY;
  if (!credential)
    throw new Error("Add a model access key in Settings to activate AI.");
  const catalogue = await models();
  if (!catalogue.some((m) => m.id === model))
    throw new Error("Choose a currently available model.");
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${credential}`,
      "Content-Type": "application/json",
      "X-Title": "Avelis",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 1800,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: AbortSignal.timeout(60000),
  });
  if (!r.ok)
    throw new Error(
      r.status === 429
        ? "Model usage limit reached. Retry later."
        : r.status === 401
          ? "The model access key was not accepted."
          : "The model request failed. Try another model or check your credits.",
    );
  const d = await r.json();
  return String(d.choices?.[0]?.message?.content || "");
}
