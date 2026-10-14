import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { geminiSchema } from "../lib/gemini-schema";
import { builderResultSchema } from "../lib/builder-template";
test("builder uses Gemini native schema with nullable plan and retained required fields", () => {
  const schema = geminiSchema(z.toJSONSchema(builderResultSchema));
  assert.equal(schema.type, "OBJECT");
  assert.equal(schema.properties.plan.nullable, true);
  assert.equal(schema.properties.plan.type, "OBJECT");
  assert.equal(
    schema.properties.plan.properties.models.properties.research.type,
    "STRING",
  );
  assert.ok(schema.required.includes("plan"));
  assert.ok(!JSON.stringify(schema).includes("additionalProperties"));
});
