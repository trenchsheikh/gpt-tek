"use client";
import { useState } from "react";
import {
  integrationNames,
  integrationInfo,
  defaultIntegration,
  type Integration,
} from "@/lib/integrations";
export default function IntegrationPicker({
  market,
  integration,
  target,
  onChange,
  disabled = false,
}: {
  market?: string;
  integration?: Integration;
  target?: string;
  onChange: (integration: Integration, target: string) => void;
  disabled?: boolean;
}) {
  const name = integration || defaultIntegration(market);
  const info = integrationInfo(name);
  const query = target || (name === "Polymarket" ? "esports" : "SOL");
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(false);
  async function check() {
    setLoading(true);
    setState("");
    try {
      const r = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ market, integration: name, target: query }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setState(
        `Live feed checked · ${d.records?.length || 1} results · ${new Date(d.observedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      );
    } catch (e) {
      setState(e instanceof Error ? e.message : "Feed unavailable.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="ar-integration-picker">
      <label>
        Platform / data feed
        <select
          value={name}
          disabled={disabled || loading}
          onChange={(e) => {
            setState("");
            onChange(
              e.target.value as Integration,
              e.target.value === "Polymarket" ? "esports" : "SOL",
            );
          }}
        >
          {integrationNames.map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
      </label>
      <label>
        {name === "Polymarket"
          ? "Event keyword"
          : name === "Hyperliquid"
            ? "Perp symbol"
            : "Token symbol or address"}
        <input
          value={query}
          maxLength={80}
          disabled={disabled || loading}
          onChange={(e) => {
            setState("");
            onChange(name, e.target.value);
          }}
        />
      </label>
      <div className="ar-integration-status">
        <span className="ar-status-dot" />
        {info.mode}
      </div>
      <p>
        {info.data
          ? `Evidence source: ${info.data}. Public research access does not connect your trading account.`
          : "Select Polymarket for live prediction research. This destination currently opens its terminal."}
      </p>
      <div className="at-actions">
        <button
          type="button"
          className="at-outline"
          onClick={check}
          disabled={disabled || loading || !info.data || !query.trim()}
        >
          {loading ? "Checking feed…" : "Check live feed"}
        </button>
        <a
          className="at-outline"
          href={info.url}
          target="_blank"
          rel="noreferrer"
        >
          Open terminal ↗
        </a>
      </div>
      {state && <small role="status">{state}</small>}
    </div>
  );
}
