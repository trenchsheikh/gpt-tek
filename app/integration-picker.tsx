"use client";
import { useState } from "react";
import {
  integrationNames,
  integrationInfo,
  platformsForMarket,
  type Integration,
} from "@/lib/integrations";
export default function IntegrationPicker({
  market,
  integration,
  target,
  onChange,
  disabled = false,
  onOpenTerminal,
}: {
  market?: string;
  integration?: Integration;
  target?: string;
  onChange: (integration: Integration, target: string) => void;
  disabled?: boolean;
  onOpenTerminal?: (
    event: React.MouseEvent<HTMLAnchorElement>,
    url: string,
  ) => void;
}) {
  const name = integration;
  const info = name ? integrationInfo(name) : null;
  const choices = platformsForMarket(market);
  const stock = market === "Stock token trading";
  const query =
    target || (stock ? "" : name === "Polymarket" ? "esports" : "SOL");
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
          value={name || ""}
          disabled={disabled || loading}
          onChange={(e) => {
            setState("");
            onChange(
              e.target.value as Integration,
              stock ? "" : e.target.value === "Polymarket" ? "esports" : "SOL",
            );
          }}
        >
          <option value="" disabled>
            Choose your platform
          </option>
          {(integration && !choices.includes(integration)
            ? [integration, ...choices]
            : choices
          ).map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
      </label>
      <label>
        {stock
          ? "Issuer-verified Solana token mint"
          : name === "Polymarket"
            ? "Event keyword"
            : name === "Hyperliquid"
              ? "Perp symbol"
              : "Token symbol or address"}
        <input
          value={query}
          maxLength={80}
          disabled={disabled || loading || !name}
          onChange={(e) => {
            setState("");
            if (name) onChange(name, e.target.value);
          }}
        />
      </label>
      {stock && (
        <p>
          Paste the exact token mint from the issuer. This feed checks public
          pair liquidity, not backing, earnings or eligibility. Live stock-token
          order execution is unavailable.
        </p>
      )}
      <div className="ar-integration-status">
        <span className="ar-status-dot" />
        {info?.mode || "Choose a platform to see connection capabilities"}
      </div>
      <p>
        {info?.data
          ? `Evidence source: ${info.data}. Public research access does not connect your trading account.`
          : name
            ? "This destination opens its terminal. Direct order execution needs an authorized platform adapter."
            : "You choose the destination; the builder does not pick it for you."}
      </p>
      <div className="at-actions">
        <button
          type="button"
          className="at-outline"
          onClick={check}
          disabled={disabled || loading || !info?.data || !query.trim()}
        >
          {loading ? "Checking feed…" : "Check live feed"}
        </button>
        {info && (
          <a
            className="at-outline"
            href={info.url}
            onClick={(event) => onOpenTerminal?.(event, info.url)}
            target="_blank"
            rel="noreferrer"
          >
            Open terminal ↗
          </a>
        )}
      </div>
      {state && <small role="status">{state}</small>}
    </div>
  );
}
