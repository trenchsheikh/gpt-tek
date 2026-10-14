// Gemini's native Schema format differs from general JSON Schema.
export function geminiSchema(value: any): any {
  if (Array.isArray(value)) return value.map(geminiSchema);
  if (!value || typeof value !== "object") return value;
  if (value.anyOf) {
    const types = value.anyOf.filter((x: any) => x.type !== "null");
    if (types.length === 1)
      return { ...geminiSchema(types[0]), nullable: true };
  }
  const result: any = {};
  for (const [key, item] of Object.entries(value)) {
    if (
      [
        "$schema",
        "additionalProperties",
        "minLength",
        "maxLength",
        "minimum",
        "maximum",
        "default",
      ].includes(key)
    )
      continue;
    result[key] =
      key === "type" && typeof item === "string"
        ? item.toUpperCase()
        : geminiSchema(item);
  }
  return result;
}
