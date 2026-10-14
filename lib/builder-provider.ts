// Flash-Lite keeps chat costs low. Retry model access or temporary overload, never quota/key errors.
export const DEFAULT_BUILDER_MODEL = "gemini-3.1-flash-lite";
export async function generateBlueprint(
  key: string,
  body: Record<string, unknown>,
  configuredModel?: string,
  request: typeof fetch = fetch,
) {
  const model = configuredModel || DEFAULT_BUILDER_MODEL;
  const candidates =
    model === DEFAULT_BUILDER_MODEL
      ? [model, "gemini-3.5-flash-lite"]
      : [model];
  const signal = AbortSignal.timeout(55000);
  let response!: Response;
  for (const candidate of candidates) {
    response = await request(
      `https://generativelanguage.googleapis.com/v1beta/models/${candidate}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        signal,
        body: JSON.stringify(body),
      },
    );
    if (![404, 503].includes(response.status)) break;
  }
  return response;
}
