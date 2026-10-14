export async function GET() {
  return Response.json({
    database: !!process.env.DATABASE_URL,
    tokenPayments: !!process.env.AGENT_TOKEN_MINT,
    inference: !!process.env.OPENROUTER_API_KEY,
    trading: !!process.env.JUPITER_API_KEY,
    network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet",
    liveNetwork: "mainnet-beta",
  });
}
