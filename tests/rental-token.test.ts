import { test } from "node:test";
import assert from "node:assert/strict";
import {
  Keypair,
  PublicKey,
  type ParsedTransactionWithMeta,
} from "@solana/web3.js";
import { tokenUnits, verifyTokenRentalPayment } from "../lib/rental-token";
import {
  getAssociatedTokenAddressSync,
  createTransferCheckedInstruction,
} from "../lib/token";
const payer = Keypair.generate().publicKey,
  recipient = Keypair.generate().publicKey,
  mint = Keypair.generate().publicKey;
const rental = {
  id: "checkout",
  payer: payer.toBase58(),
  recipient: recipient.toBase58(),
  token_mint: mint.toBase58(),
  token_amount: "12500000",
  token_decimals: 6,
  created_at: new Date(1700000000000),
};
function tx(overrides: Record<string, unknown> = {}) {
  return {
    blockTime: 1700000001,
    meta: { err: null },
    transaction: {
      message: {
        accountKeys: [{ pubkey: payer, signer: true }],
        instructions: [
          {
            programId: new PublicKey(
              "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            ),
            parsed: {
              type: "transferChecked",
              info: {
                source: getAssociatedTokenAddressSync(mint, payer).toBase58(),
                destination: getAssociatedTokenAddressSync(
                  mint,
                  recipient,
                ).toBase58(),
                authority: payer.toBase58(),
                mint: mint.toBase58(),
                tokenAmount: { amount: "12500000", decimals: 6 },
                ...overrides,
              },
            },
          },
          {
            programId: new PublicKey(
              "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
            ),
            parsed: "agentrouter:rental:checkout",
          },
        ],
      },
    },
  } as unknown as ParsedTransactionWithMeta;
}
test("token prices convert exactly without floating point rounding", () => {
  assert.equal(tokenUnits("12.500001", 6), 12500001n);
  assert.equal(tokenUnits("10.000000", 0), 10n);
  for (const value of ["0", "-1", "1e9", "0.000001"])
    assert.throws(() => tokenUnits(value, 0));
});
test("token payment checks mint, destination, authority, amount and memo", () => {
  assert.equal(verifyTokenRentalPayment(tx(), rental), true);
  for (const change of [
    { mint: payer.toBase58() },
    { destination: payer.toBase58() },
    { authority: recipient.toBase58() },
    { tokenAmount: { amount: "1", decimals: 6 } },
  ])
    assert.throws(() => verifyTokenRentalPayment(tx(change), rental));
  const bad = tx();
  (bad.transaction.message.instructions[1] as any).parsed =
    "agentrouter:rental:other";
  assert.throws(() => verifyTokenRentalPayment(bad, rental));
});
test("token payment rejects spoofed programs, failed and stale transactions", () => {
  const spoof = tx();
  (spoof.transaction.message.instructions[0] as any).programId = payer;
  assert.throws(() => verifyTokenRentalPayment(spoof, rental));
  const failed = tx();
  failed.meta!.err = { InstructionError: [0, "failure"] };
  assert.throws(() => verifyTokenRentalPayment(failed, rental));
  const stale = tx();
  stale.blockTime = 1600000000;
  assert.throws(() => verifyTokenRentalPayment(stale, rental));
  assert.throws(() => verifyTokenRentalPayment(null, rental));
});
test("checked transfer encodes uint64 token amount and signer", () => {
  const i = createTransferCheckedInstruction(
    getAssociatedTokenAddressSync(mint, payer),
    mint,
    getAssociatedTokenAddressSync(mint, recipient),
    payer,
    12500000n,
    6,
  );
  assert.equal(i.data[0], 12);
  assert.equal(i.data.readBigUInt64LE(1), 12500000n);
  assert.equal(i.data[9], 6);
  assert.ok(i.keys.some((k) => k.pubkey.equals(payer) && k.isSigner));
});
