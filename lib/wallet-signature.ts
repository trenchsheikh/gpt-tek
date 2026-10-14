import nacl from "tweetnacl";
import bs58 from "bs58";
import { PublicKey } from "@solana/web3.js";
export function verifyWalletSignature(
  address: string,
  signature: string,
  message: string,
) {
  try {
    new PublicKey(address);
    return nacl.sign.detached.verify(
      new TextEncoder().encode(message),
      bs58.decode(signature),
      bs58.decode(address),
    );
  } catch {
    return false;
  }
}
