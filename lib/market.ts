export const SOL = "So11111111111111111111111111111111111111112";
export const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export async function market() {
  const r = await fetch("https://api.coinbase.com/v2/prices/SOL-USD/spot", {
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!r.ok)
    throw new Error(
      "Live SOL pricing is unavailable. No trading decision was made.",
    );
  const d = await r.json();
  const price = Number(d.data?.amount);
  if (!Number.isFinite(price) || price <= 0)
    throw new Error("Invalid market price");
  return {
    price,
    source: "Coinbase SOL/USD spot",
    observedAt: new Date().toISOString(),
  };
}
