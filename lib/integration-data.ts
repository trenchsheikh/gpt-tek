import { z } from "zod";
import { market } from "./market";
import {
  defaultIntegration,
  integrationInfo,
  type Integration,
} from "./integrations";
const requestOptions = { cache: "no-store" as const };
async function read(url: string, body?: unknown) {
  const r = await fetch(url, {
    ...requestOptions,
    signal: AbortSignal.timeout(15000),
    ...(body
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
  });
  if (!r.ok)
    throw new Error(
      "The selected market-data feed is temporarily unavailable. Retry shortly.",
    );
  return r.json();
}
export async function integrationData(plan: {
  market?: string;
  integration?: Integration;
  target?: string;
}) {
  const name = plan.integration || defaultIntegration(plan.market);
  const query = z
    .string()
    .trim()
    .min(1)
    .max(80)
    .parse(
      plan.target ||
        (name === "Polymarket"
          ? "esports"
          : name === "Hyperliquid"
            ? "SOL"
            : "SOL"),
    );
  const info = integrationInfo(name);
  if (!info.data)
    throw new Error(
      "Kalshi is a terminal handoff. Choose Polymarket for connected prediction-market research.",
    );
  if (name === "Solana swaps") {
    if (plan.market && plan.market !== "Spot trading")
      throw new Error(
        "Solana swaps supports SOL/USDC spot only. Select the research feed for your market.",
      );
    return { ...(await market()), integration: name, records: [] };
  }
  let records: unknown[] = [];
  if (name === "Hyperliquid") {
    const d = await read("https://api.hyperliquid.xyz/info", {
      type: "metaAndAssetCtxs",
    });
    const universe = z
      .array(z.object({ name: z.string() }))
      .parse(d[0]?.universe);
    records = universe
      .map((asset, i) => ({ asset: asset.name, ...d[1]?.[i] }))
      .filter((x) => x.asset === query.toUpperCase())
      .slice(0, 10);
  } else if (name === "Polymarket") {
    const d = await read(
      "https://gamma-api.polymarket.com/public-search?q=" +
        encodeURIComponent(query) +
        "&limit_per_type=5",
    );
    records = (d.events || []).slice(0, 5).map((e: any) => ({
      title: e.title,
      description: String(e.description || "").slice(0, 800),
      markets: (e.markets || [])
        .filter((m: any) => m.active && !m.closed)
        .slice(0, 5)
        .map((m: any) => ({
          id: m.id,
          question: m.question,
          outcomes: m.outcomes,
          prices: m.outcomePrices,
          liquidity: m.liquidity,
          volume: m.volume,
          endDate: m.endDate,
        })),
    }));
  } else {
    const d = await read(
      "https://api.dexscreener.com/latest/dex/search?q=" +
        encodeURIComponent(query),
    );
    records = (d.pairs || [])
      .filter((p: any) => p.chainId === "solana")
      .slice(0, 12)
      .map((p: any) => ({
        token: p.baseToken?.symbol,
        address: p.baseToken?.address,
        dex: p.dexId,
        pair: p.pairAddress,
        priceUsd: p.priceUsd,
        liquidity: p.liquidity?.usd,
        volume24h: p.volume?.h24,
        priceChange24h: p.priceChange?.h24,
        createdAt: p.pairCreatedAt,
      }));
  }
  if (!records.length)
    throw new Error(
      "No live results for that target. Try a token address, perp symbol or event keyword.",
    );
  return {
    integration: name,
    source: info.data,
    query,
    observedAt: new Date().toISOString(),
    records,
    limitations:
      "Public market evidence only. No account connection, holder audit, bonding-curve coverage or order signing is implied.",
  };
}
