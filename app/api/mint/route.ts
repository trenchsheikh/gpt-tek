import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  AuthorityType,
  createInitializeMint2Instruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
  createMintToInstruction,
  createSetAuthorityInstruction,
  getMint,
} from "@/lib/token";
import { createHash } from "crypto";
import { db } from "@/lib/db";
import { user, fail, sameOrigin } from "@/lib/http";
import { limit } from "@/lib/limit";
export async function POST(r: Request) {
  try {
    sameOrigin(r);
    const uid = await user();
    await limit(`mint:${uid}`, 20, 3600);
    const { agentId, signature } = await r.json();
    const a = (
      await db().query("SELECT * FROM agents WHERE id=$1 AND owner=$2", [
        agentId,
        uid,
      ])
    ).rows[0];
    if (!a) throw new Error("Agent not found");
    if (a.mint_signature)
      return Response.json({
        mint: a.mint_address,
        signature: a.mint_signature,
      });
    const c = new Connection(
      process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
      "confirmed",
    );
    const owner = new PublicKey(a.wallet);
    const hash = createHash("sha256").update(a.strategy).digest("hex");
    const memo = `gpt-tek:agent:${a.id}:${hash}`;
    if (signature) {
      if (!a.mint_address) throw new Error("Prepare a mint first");
      const tx = await c.getParsedTransaction(String(signature), {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      });
      if (!tx || tx.meta?.err)
        throw new Error("Mint not yet confirmed. Retry verification.");
      const matched = tx.transaction.message.instructions.some(
        (i) => "parsed" in i && i.program === "spl-memo" && i.parsed === memo,
      );
      const signed = tx.transaction.message.accountKeys.some(
        (k) => k.signer && k.pubkey.equals(owner),
      );
      const issued = tx.transaction.message.instructions.some(
        (i) =>
          "parsed" in i &&
          i.program === "spl-token" &&
          i.parsed.type === "mintTo" &&
          i.parsed.info.mint === a.mint_address &&
          i.parsed.info.account ===
            getAssociatedTokenAddressSync(
              new PublicKey(a.mint_address),
              owner,
            ).toBase58() &&
          i.parsed.info.amount === "1",
      );
      const mint = await getMint(c, new PublicKey(a.mint_address));
      if (
        !matched ||
        !signed ||
        !issued ||
        mint.decimals !== 0 ||
        mint.supply !== BigInt(1) ||
        mint.mintAuthority ||
        mint.freezeAuthority
      )
        throw new Error("Mint proof does not match this agent");
      await db().query("UPDATE agents SET mint_signature=$1 WHERE id=$2", [
        signature,
        a.id,
      ]);
      return Response.json({ mint: a.mint_address, signature });
    }
    if (a.mint_address) {
      if (
        a.mint_prepared_at &&
        Date.now() - new Date(a.mint_prepared_at).getTime() < 10 * 60e3
      )
        throw new Error(
          "A mint is already prepared. If payment was sent, use Verify mint. Otherwise wait 10 minutes before retrying.",
        );
      const existing = await c.getAccountInfo(new PublicKey(a.mint_address));
      if (existing)
        throw new Error(
          "This mint exists. Verify its transaction signature before minting again.",
        );
    }
    const mint = Keypair.generate();
    const ata = getAssociatedTokenAddressSync(mint.publicKey, owner);
    const latest = await c.getLatestBlockhash();
    const tx = new Transaction({ feePayer: owner, ...latest }).add(
      SystemProgram.createAccount({
        fromPubkey: owner,
        newAccountPubkey: mint.publicKey,
        space: MINT_SIZE,
        lamports: await c.getMinimumBalanceForRentExemption(MINT_SIZE),
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMint2Instruction(mint.publicKey, 0, owner, null),
      createAssociatedTokenAccountInstruction(
        owner,
        ata,
        owner,
        mint.publicKey,
      ),
      createMintToInstruction(mint.publicKey, ata, owner, 1),
      createSetAuthorityInstruction(
        mint.publicKey,
        owner,
        AuthorityType.MintTokens,
        null,
      ),
      new TransactionInstruction({
        programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
        keys: [],
        data: Buffer.from(memo),
      }),
    );
    tx.partialSign(mint);
    const reserved = await db().query(
      "UPDATE agents SET mint_address=$1,mint_prepared_at=now() WHERE id=$2 AND mint_signature IS NULL AND (mint_prepared_at IS NULL OR mint_prepared_at<now()-interval '10 minutes') RETURNING id",
      [mint.publicKey.toBase58(), a.id],
    );
    if (!reserved.rowCount) throw new Error("A mint is already in progress.");
    return Response.json({
      transaction: tx
        .serialize({ requireAllSignatures: false })
        .toString("base64"),
      mint: mint.publicKey.toBase58(),
    });
  } catch (e) {
    return fail(e);
  }
}
