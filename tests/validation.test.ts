import { test } from "node:test";
import assert from "node:assert/strict";
import { agentInput, rentalAmount, rentalInput } from "../lib/validation";
test("reject fractional and excessive rental durations", () => {
  for (const hours of [0, 1.5, 169, -1])
    assert.throws(() => rentalAmount(1000000, hours));
  assert.equal(rentalAmount(10000000, 4), 40000000);
});
test("reject unsafe and zero rates", () => {
  assert.throws(() => rentalAmount(0, 1));
  assert.throws(() => rentalAmount(Number.MAX_SAFE_INTEGER, 168));
});
test("agent validation enforces complete private strategy and positive price", () => {
  const input = {
    name: "My agent",
    description: "A research agent",
    strategy: "Research liquidity and downside scenarios from provided data.",
    category: "Research",
    hourlySol: 0.01,
    wallet: "11111111111111111111111111111111",
    listed: true,
  };
  assert.equal(agentInput.parse(input).name, "My agent");
  assert.equal(agentInput.safeParse({ ...input, hourlySol: 0 }).success, false);
  assert.equal(
    agentInput.safeParse({ ...input, strategy: "short" }).success,
    false,
  );
});
test("checkout rejects arbitrary IDs", () => {
  assert.equal(
    rentalInput.safeParse({
      agentId: "not-an-id",
      payer: "11111111111111111111111111111111",
      hours: 4,
    }).success,
    false,
  );
});
