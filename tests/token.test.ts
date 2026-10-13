import { test } from "node:test";
import assert from "node:assert/strict";
import { Keypair, Transaction } from "@solana/web3.js";
import {
  createMintToInstruction,
  createSetAuthorityInstruction,
  AuthorityType,
  createInitializeMint2Instruction,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
} from "../lib/token";
import {
  getMintToInstructionDataDecoder,
  getSetAuthorityInstructionDataDecoder,
} from "@solana-program/token";
test("mint transaction keeps owner approval and encodes a fixed 1/1 supply", () => {
  const owner = Keypair.generate().publicKey,
    mint = Keypair.generate().publicKey;
  const ata = getAssociatedTokenAddressSync(mint, owner);
  const mintTo = createMintToInstruction(mint, ata, owner, 1);
  assert.equal(
    getMintToInstructionDataDecoder().decode(mintTo.data).amount,
    BigInt(1),
  );
  assert.equal(mintTo.keys[2].isSigner, true);
  assert.equal(mintTo.keys[2].pubkey.toBase58(), owner.toBase58());
  const revoke = createSetAuthorityInstruction(
    mint,
    owner,
    AuthorityType.MintTokens,
    null,
  );
  assert.equal(
    getSetAuthorityInstructionDataDecoder().decode(revoke.data).newAuthority
      .__option,
    "None",
  );
  assert.equal(revoke.keys[1].isSigner, true);
  const tx = new Transaction({
    feePayer: owner,
    recentBlockhash: Keypair.generate().publicKey.toBase58(),
  }).add(
    createInitializeMint2Instruction(mint, 0, owner, null),
    createAssociatedTokenAccountInstruction(owner, ata, owner, mint),
    mintTo,
    revoke,
  );
  assert.ok(tx.serialize({ requireAllSignatures: false }).length < 1232);
});
