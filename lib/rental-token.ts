import { PublicKey, type ParsedTransactionWithMeta } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "./token";
export function tokenUnits(price: string | number, decimals: number) {
  const value = String(price);
  if (
    !Number.isInteger(decimals) ||
    decimals < 0 ||
    decimals > 9 ||
    !/^\d+(\.\d{1,6})?$/.test(value)
  )
    throw new Error("Invalid token price");
  const [whole, fraction = ""] = value.split(".");
  if (fraction.length > decimals && /[1-9]/.test(fraction.slice(decimals)))
    throw new Error("Price exceeds token precision");
  const amount =
    BigInt(whole) * 10n ** BigInt(decimals) +
    BigInt(fraction.slice(0, decimals).padEnd(decimals, "0") || "0");
  if (amount <= 0n || amount > 18446744073709551615n)
    throw new Error("Invalid token amount");
  return amount;
}
export function verifyTokenRentalPayment(
  tx: ParsedTransactionWithMeta | null,
  rental: {
    id: string;
    payer: string;
    recipient: string;
    token_mint: string;
    token_amount: string;
    token_decimals: number;
    created_at: Date | string;
  },
) {
  if (!tx || !tx.meta || tx.meta.err || !tx.blockTime)
    throw new Error("Payment not yet confirmed");
  const source = getAssociatedTokenAddressSync(
    new PublicKey(rental.token_mint),
    new PublicKey(rental.payer),
  ).toBase58();
  const destination = getAssociatedTokenAddressSync(
    new PublicKey(rental.token_mint),
    new PublicKey(rental.recipient),
  ).toBase58();
  const instructions = [
    ...tx.transaction.message.instructions,
    ...(tx.meta.innerInstructions || []).flatMap((i) => i.instructions),
  ];
  const paid = instructions.some(
    (i) =>
      "parsed" in i &&
      i.programId.toBase58() ===
        "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" &&
      i.parsed?.type === "transferChecked" &&
      i.parsed.info.source === source &&
      i.parsed.info.destination === destination &&
      i.parsed.info.mint === rental.token_mint &&
      i.parsed.info.authority === rental.payer &&
      i.parsed.info.tokenAmount.amount === rental.token_amount &&
      i.parsed.info.tokenAmount.decimals === rental.token_decimals,
  );
  const memo = instructions.some(
    (i) =>
      "parsed" in i &&
      i.programId.toBase58() ===
        "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr" &&
      i.parsed === `agentrouter:rental:${rental.id}`,
  );
  const signer = tx.transaction.message.accountKeys.some(
    (k) => k.signer && k.pubkey.toBase58() === rental.payer,
  );
  if (
    !paid ||
    !memo ||
    !signer ||
    tx.blockTime * 1000 < new Date(rental.created_at).getTime() - 30000
  )
    throw new Error("Transaction does not match this rental");
  return true;
}
