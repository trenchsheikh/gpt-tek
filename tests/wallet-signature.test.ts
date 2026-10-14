import { test } from "node:test";
import assert from "node:assert/strict";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { verifyWalletSignature } from "../lib/wallet-signature";
test("wallet sign in accepts only the wallet signature for the issued message", () => {
  const key = nacl.sign.keyPair();
  const other = nacl.sign.keyPair();
  const message =
    "AgentRouter wallet sign-in\nDomain: agentrouter.test\nNonce: unique";
  const signature = bs58.encode(
    nacl.sign.detached(new TextEncoder().encode(message), key.secretKey),
  );
  assert.equal(
    verifyWalletSignature(bs58.encode(key.publicKey), signature, message),
    true,
  );
  assert.equal(
    verifyWalletSignature(bs58.encode(other.publicKey), signature, message),
    false,
  );
  assert.equal(
    verifyWalletSignature(
      bs58.encode(key.publicKey),
      signature,
      message + "altered",
    ),
    false,
  );
  assert.equal(verifyWalletSignature("bad-wallet", signature, message), false);
});
