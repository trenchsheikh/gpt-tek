import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generateBlueprint,
  DEFAULT_BUILDER_MODEL,
} from "../lib/builder-provider";
test("uses cheap Flash-Lite and retries inaccessible model with available Flash-Lite", async () => {
  const urls: string[] = [];
  const request = (async (url, options) => {
    urls.push(String(url));
    assert.equal(
      new Headers(options?.headers).get("x-goog-api-key"),
      "test-key",
    );
    return new Response("{}", { status: urls.length === 1 ? 404 : 200 });
  }) as typeof fetch;
  const response = await generateBlueprint(
    "test-key",
    { contents: [] },
    undefined,
    request,
  );
  assert.equal(response.status, 200);
  assert.ok(urls[0].includes(DEFAULT_BUILDER_MODEL));
  assert.ok(urls[1].includes("gemini-3.5-flash-lite"));
});
test("does not amplify quota failures or override explicit model configuration", async () => {
  let calls = 0;
  const request = (async () => {
    calls++;
    return new Response("{}", { status: 429 });
  }) as typeof fetch;
  assert.equal(
    (await generateBlueprint("test-key", {}, undefined, request)).status,
    429,
  );
  assert.equal(calls, 1);
  const unavailable = (async () => {
    calls++;
    return new Response("{}", { status: 404 });
  }) as typeof fetch;
  await generateBlueprint("test-key", {}, "gemini-custom", unavailable);
  assert.equal(calls, 2);
});
