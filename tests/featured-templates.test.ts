import { test } from "node:test";
import assert from "node:assert/strict";
import { featuredTemplates } from "../lib/featured-templates";
import { planSchema } from "../lib/agent-plan";
import { platformsForMarket, supportsSwaps } from "../lib/integrations";
test("seven free templates have valid plans, varied risk and safe market destinations", () => {
  assert.equal(featuredTemplates.length, 7);
  assert.equal(new Set(featuredTemplates.map((t) => t.id)).size, 7);
  assert.equal(new Set(featuredTemplates.map((t) => t.riskLevel)).size, 3);
  for (const t of featuredTemplates) {
    assert.equal(t.creator, "AgentRouter");
    assert.equal(t.hourly_agent, 0);
    assert.ok(planSchema.safeParse(t.plan).success, t.name);
    assert.ok(platformsForMarket(t.plan.market).length);
    if (t.plan.market !== "Spot trading")
      assert.equal(supportsSwaps(t.plan), false);
  }
});
