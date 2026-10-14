import { supportsSwaps } from "@/lib/integrations";
import { planSchema } from "@/lib/agent-plan";
import { Connection, PublicKey } from "@solana/web3.js";
import { agentAccess } from "@/lib/access";
import { pipeline } from "@/lib/pipeline";
import { market, USDC } from "@/lib/market";
import { user, fail, sameOrigin } from "@/lib/http";
import { limit } from "@/lib/limit";
export const maxDuration = 180;
export async function POST(r: Request) {
  try {
    sameOrigin(r);
    const uid = await user();
    await limit(`decision:${uid}`, 12, 3600);
    const { agentId, wallet, apiKey } = await r.json();
    const a = await agentAccess(agentId, uid);
    if (!supportsSwaps(planSchema.parse(a.plan)))
      throw new Error(
        "Use Run research for this integration. Live decisions require Solana swaps and SOL/USDC spot.",
      );
    const c = new Connection(
      process.env.MAINNET_RPC_URL || "https://api.mainnet-beta.solana.com",
    );
    const owner = new PublicKey(wallet);
    const [lamports, tokens, snapshot] = await Promise.all([
      c.getBalance(owner),
      c.getParsedTokenAccountsByOwner(owner, { mint: new PublicKey(USDC) }),
      market(),
    ]);
    const balance = {
      sol: Math.max(0, lamports / 1e9 - 0.01),
      usd: tokens.value.reduce(
        (v, t) =>
          v + Number(t.account.data.parsed.info.tokenAmount.uiAmount || 0),
        0,
      ),
    };
    return Response.json({
      ...(await pipeline(a, snapshot, balance, apiKey)),
      snapshot,
      balance,
    });
  } catch (e) {
    return fail(e);
  }
}
