import { Transaction, VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import type { Wallet, WalletAccount } from "@wallet-standard/base";
export function compatibleSolanaWallet(wallet: Wallet) {
  return (
    wallet.chains.includes("solana:mainnet") &&
    !!wallet.features["standard:connect"] &&
    !!wallet.features["solana:signMessage"]
  );
}
export function standardProvider(wallet: Wallet) {
  let account: WalletAccount | undefined = wallet.accounts.find(
    (a) =>
      a.chains.includes("solana:mainnet") &&
      a.features.includes("solana:signMessage"),
  );
  function feature(name: `${string}:${string}`) {
    const f = wallet.features[name] as
      Record<string, (...args: any[]) => Promise<any>> | undefined;
    if (!f)
      throw new Error(`${wallet.name} does not support this Solana operation.`);
    return f;
  }
  function connected(name: `${string}:${string}`) {
    if (!account || !account.features.includes(name))
      throw new Error("Connect a compatible Solana account before continuing.");
    return account;
  }
  return {
    async connect() {
      const { accounts } = await feature("standard:connect").connect();
      account = accounts.find(
        (a: WalletAccount) =>
          a.chains.includes("solana:mainnet") &&
          a.features.includes("solana:signMessage"),
      );
      if (!account)
        throw new Error(
          "Choose a Solana account with message signing enabled.",
        );
      return { publicKey: { toString: () => account!.address } };
    },
    async signMessage(message: Uint8Array) {
      const [output] = await feature("solana:signMessage").signMessage({
        account: connected("solana:signMessage"),
        message,
      });
      if (!output?.signature)
        throw new Error("Wallet did not return a message signature.");
      return { signature: output.signature as Uint8Array };
    },
    async signTransaction(transaction: VersionedTransaction) {
      const [output] = await feature("solana:signTransaction").signTransaction({
        account: connected("solana:signTransaction"),
        transaction: transaction.serialize(),
        chain: "solana:mainnet",
      });
      return VersionedTransaction.deserialize(output.signedTransaction);
    },
    async signAndSendTransaction(transaction: Transaction) {
      const [output] = await feature(
        "solana:signAndSendTransaction",
      ).signAndSendTransaction({
        account: connected("solana:signAndSendTransaction"),
        transaction: transaction.serialize({
          requireAllSignatures: false,
          verifySignatures: false,
        }),
        chain: "solana:mainnet",
      });
      return { signature: bs58.encode(output.signature) };
    },
  };
}
