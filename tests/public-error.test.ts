import { test } from "node:test";
import assert from "node:assert/strict";
import { publicError } from "../lib/public-error";
import { z } from "zod";
test("database and credential details never appear in public errors", () => {
  for (const message of [
    "password authentication failed for user admin",
    "postgresql://admin:secret@private-host/db",
    "ECONNREFUSED internal-host",
    "Bearer secret-value",
    "sk-privatecredential",
  ]) {
    assert.ok(!publicError(new Error(message)).includes(message));
  }
  const e = Object.assign(new Error("private table and column"), {
    code: "42P01",
  });
  assert.ok(!publicError(e).includes("private table"));
});
test("validation errors are concise and actionable", () => {
  try {
    z.string().parse({ apiKey: "private" });
  } catch (e) {
    assert.equal(publicError(e), "Please check the form values and try again.");
  }
  assert.equal(
    publicError(new Error("Choose 1–168 hours.")),
    "Choose 1–168 hours.",
  );
});
