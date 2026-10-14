import { test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { proxy } from "../proxy";

test("subdomain routes preserve queries and avoid redirect loops", () => {
  const route = (url: string) => proxy(new NextRequest(url));
  assert.equal(
    route("https://app.agentrouter.trade/").headers.get("x-middleware-rewrite"),
    "https://app.agentrouter.trade/app",
  );
  assert.equal(
    route("https://docs.agentrouter.trade/stock-tokens?q=issuer").headers.get(
      "x-middleware-rewrite",
    ),
    "https://docs.agentrouter.trade/docs/stock-tokens?q=issuer",
  );
  assert.equal(
    route("https://docs.agentrouter.trade/docs/quickstart").headers.get(
      "location",
    ),
    "https://docs.agentrouter.trade/quickstart",
  );
  assert.equal(
    route("https://agentrouter.trade/app?view=build").headers.get("location"),
    "https://app.agentrouter.trade/?view=build",
  );
  assert.equal(
    route("https://agentrouter.trade/docs/quickstart").headers.get("location"),
    "https://docs.agentrouter.trade/quickstart",
  );
  assert.equal(
    route("https://www.agentrouter.trade/").headers.get("location"),
    "https://agentrouter.trade/",
  );
  for (const url of [
    "https://app.agentrouter.trade/api/auth/session",
    "https://docs.agentrouter.trade/avelis-logo.png",
    "http://localhost:3000/app",
  ]) {
    assert.equal(route(url).headers.get("x-middleware-next"), "1");
  }
});
