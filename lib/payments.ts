import type { ParsedTransactionWithMeta } from "@solana/web3.js";
export function verifyRentalPayment(
  tx: ParsedTransactionWithMeta | null,
  rental: {
    id: string;
    payer: string;
    wallet: string;
    lamports: string;
    created_at: Date | string;
  },
) {
  if (!tx || tx.meta?.err)
    throw new Error("Payment not yet confirmed. Retry verification.");
  const instructions = tx.transaction.message.instructions;
  const paid = instructions.some(
    (i) =>
      "parsed" in i &&
      i.program === "system" &&
      i.parsed.type === "transfer" &&
      i.parsed.info.source === rental.payer &&
      i.parsed.info.destination === rental.wallet &&
      Number(i.parsed.info.lamports) === Number(rental.lamports),
  );
  const memo = instructions.some(
    (i) =>
      "parsed" in i &&
      i.program === "spl-memo" &&
      i.parsed === `gpt-tek:rental:${rental.id}`,
  );
  const signed = tx.transaction.message.accountKeys.some(
    (k) => k.signer && k.pubkey.toBase58() === rental.payer,
  );
  if (
    !paid ||
    !memo ||
    !signed ||
    !tx.blockTime ||
    tx.blockTime * 1000 < new Date(rental.created_at).getTime() - 30000
  )
    throw new Error("Transaction does not match this rental.");
  return true;
}
