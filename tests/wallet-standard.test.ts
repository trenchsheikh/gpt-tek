import { test } from "node:test";
import assert from "node:assert/strict";
import type { Wallet } from "@wallet-standard/base";
import {
  compatibleSolanaWallet,
  standardProvider,
} from "../lib/wallet-standard";
test("standard wallets select Solana account and sign the exact challenge", async () => {
  const message = new TextEncoder().encode("AgentRouter one-time challenge");
  const account = {
    address: "11111111111111111111111111111111",
    publicKey: new Uint8Array(32),
    chains: ["solana:mainnet"],
    features: ["solana:signMessage"],
  };
  const wallet = {
    name: "Compatible wallet",
    chains: ["solana:mainnet"],
    accounts: [],
    features: {
      "standard:connect": {
        connect: async () => ({
          accounts: [{ ...account, chains: ["eip155:1"] }, account],
        }),
      },
      "solana:signMessage": {
        signMessage: async (input: any) => {
          assert.equal(input.account, account);
          assert.deepEqual(input.message, message);
          return [{ signature: new Uint8Array(64) }];
        },
      },
    },
  } as unknown as Wallet;
  assert.equal(compatibleSolanaWallet(wallet), true);
  const provider = standardProvider(wallet);
  assert.equal(
    (await provider.connect()).publicKey.toString(),
    account.address,
  );
  assert.equal((await provider.signMessage(message)).signature.length, 64);
  assert.equal(
    compatibleSolanaWallet({ ...wallet, chains: ["eip155:1"] }),
    false,
  );
  await assert.rejects(provider.signTransaction({} as any), /does not support/);
});
