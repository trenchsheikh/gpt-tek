import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyRentalPayment } from "../lib/payments";
import { PublicKey, type ParsedTransactionWithMeta } from "@solana/web3.js";
const payer = "11111111111111111111111111111111";
const rental = {
  id: "rental-one",
  payer,
  wallet: "recipient",
  lamports: "40000000",
  created_at: new Date(1700000000000),
};
function transaction(
  opts: {
    amount?: number;
    recipient?: string;
    sender?: string;
    memo?: string;
    signer?: boolean;
    failed?: boolean;
    time?: number;
  } = {},
) {
  return {
    meta: { err: opts.failed ? { InstructionError: [0, "error"] } : null },
    blockTime: opts.time ?? 1700000001,
    transaction: {
      message: {
        accountKeys: [
          { pubkey: new PublicKey(payer), signer: opts.signer ?? true },
        ],
        instructions: [
          {
            program: "system",
            parsed: {
              type: "transfer",
              info: {
                source: opts.sender ?? payer,
                destination: opts.recipient ?? "recipient",
                lamports: opts.amount ?? 40000000,
              },
            },
          },
          {
            program: "spl-memo",
            parsed: opts.memo ?? "gpt-tek:rental:rental-one",
          },
        ],
      },
    },
  } as unknown as ParsedTransactionWithMeta;
}
test("matching signed payment activates access", () =>
  assert.equal(verifyRentalPayment(transaction(), rental), true));
test("reject mismatched amount, recipient, sender, memo and signer", () => {
  for (const options of [
    { amount: 1 },
    { recipient: "attacker" },
    { sender: "other-wallet" },
    { memo: "gpt-tek:rental:other" },
    { signer: false },
  ])
    assert.throws(() => verifyRentalPayment(transaction(options), rental));
});
test("reject failed, unavailable or stale payment", () => {
  assert.throws(() => verifyRentalPayment(null, rental));
  assert.throws(() =>
    verifyRentalPayment(transaction({ failed: true }), rental),
  );
  assert.throws(() =>
    verifyRentalPayment(transaction({ time: 1699990000 }), rental),
  );
});
