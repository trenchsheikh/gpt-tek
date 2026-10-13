// Bridge maintained Solana Kit token builders to Phantom's web3 transaction format.
import {
  PublicKey,
  TransactionInstruction,
  type Connection,
} from "@solana/web3.js";
import {
  address,
  createNoopSigner,
  isSome,
  type Instruction,
} from "@solana/kit";
import {
  TOKEN_PROGRAM_ADDRESS,
  ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
  getMintSize,
  getMintDecoder,
  getInitializeMint2Instruction,
  getCreateAssociatedTokenInstruction,
  getMintToInstruction,
  getSetAuthorityInstruction,
  AuthorityType,
} from "@solana-program/token";
export { AuthorityType };
export const MINT_SIZE = getMintSize();
export const TOKEN_PROGRAM_ID = new PublicKey(TOKEN_PROGRAM_ADDRESS);
export function web3Instruction(i: Instruction) {
  return new TransactionInstruction({
    programId: new PublicKey(i.programAddress),
    keys: (i.accounts || []).map((k) => ({
      pubkey: new PublicKey(k.address),
      isSigner: (k.role & 2) !== 0,
      isWritable: (k.role & 1) !== 0,
    })),
    data: Buffer.from(i.data || []),
  });
}
export function getAssociatedTokenAddressSync(
  mint: PublicKey,
  owner: PublicKey,
) {
  return PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    new PublicKey(ASSOCIATED_TOKEN_PROGRAM_ADDRESS),
  )[0];
}
export function createInitializeMint2Instruction(
  mint: PublicKey,
  decimals: number,
  owner: PublicKey,
  freeze: null,
) {
  return web3Instruction(
    getInitializeMint2Instruction({
      mint: address(mint.toBase58()),
      decimals,
      mintAuthority: address(owner.toBase58()),
      freezeAuthority: freeze,
    }),
  );
}
export function createAssociatedTokenAccountInstruction(
  payer: PublicKey,
  ata: PublicKey,
  owner: PublicKey,
  mint: PublicKey,
) {
  return web3Instruction(
    getCreateAssociatedTokenInstruction({
      payer: createNoopSigner(address(payer.toBase58())),
      ata: address(ata.toBase58()),
      owner: address(owner.toBase58()),
      mint: address(mint.toBase58()),
    }),
  );
}
export function createMintToInstruction(
  mint: PublicKey,
  ata: PublicKey,
  owner: PublicKey,
  amount: number,
) {
  return web3Instruction(
    getMintToInstruction({
      mint: address(mint.toBase58()),
      token: address(ata.toBase58()),
      mintAuthority: createNoopSigner(address(owner.toBase58())),
      amount,
    }),
  );
}
export function createSetAuthorityInstruction(
  mint: PublicKey,
  owner: PublicKey,
  authorityType: AuthorityType,
  newAuthority: null,
) {
  return web3Instruction(
    getSetAuthorityInstruction({
      owned: address(mint.toBase58()),
      owner: createNoopSigner(address(owner.toBase58())),
      authorityType,
      newAuthority,
    }),
  );
}
export async function getMint(c: Connection, mint: PublicKey) {
  const info = await c.getAccountInfo(mint);
  if (
    !info ||
    !info.owner.equals(TOKEN_PROGRAM_ID) ||
    info.data.length !== MINT_SIZE
  )
    throw new Error("Invalid mint account");
  const data = getMintDecoder().decode(info.data);
  if (!data.isInitialized) throw new Error("Mint is not initialized");
  return {
    ...data,
    mintAuthority: isSome(data.mintAuthority) ? data.mintAuthority.value : null,
    freezeAuthority: isSome(data.freezeAuthority)
      ? data.freezeAuthority.value
      : null,
  };
}
