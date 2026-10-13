"use client";
import { useEffect, useState } from "react";
import type { Model } from "@/lib/models";
export default function ModelStrip() {
  const [items, setItems] = useState<Model[]>([]);
  useEffect(() => {
    fetch("/api/models")
      .then((r) => (r.ok ? r.json() : []))
      .then((m: Model[]) =>
        setItems(
          ["openai", "anthropic", "google", "deepseek", "qwen", "x-ai"].flatMap(
            (p) => {
              const item = m.find(
                (x) => x.provider === p && !x.id.includes(":"),
              );
              return item ? [item] : [];
            },
          ),
        ),
      )
      .catch(() => {});
  }, []);
  return (
    <div className="av-model-strip">
      {items.length ? (
        items.map((m) => (
          <div key={m.id}>
            <img src={`/providers/${m.provider}.svg`} alt="" />
            <span>{m.name.replace(/^[^:]+:\s*/, "")}</span>
          </div>
        ))
      ) : (
        <span className="av-muted">Loading the live model catalogue…</span>
      )}
    </div>
  );
}
