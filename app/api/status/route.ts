export async function GET() {
  return Response.json({
    chatgpt: !!process.env.OPENAI_CLIENT_ID,
    database: !!process.env.DATABASE_URL,
    inference: !!process.env.OPENAI_API_KEY,
    network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet",
  });
}
