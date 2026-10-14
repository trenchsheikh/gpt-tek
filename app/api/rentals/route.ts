import { verifyTokenRentalPayment, tokenUnits } from "@/lib/rental-token";
import {
  getMint,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
} from "@/lib/token";
import { limit } from "@/lib/limit";
import { randomUUID } from "crypto";
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { db } from "@/lib/db";
import { rentalInput } from "@/lib/validation";
import { user, fail, sameOrigin } from "@/lib/http";
const rpc = () =>
  new Connection(
    process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
    "confirmed",
  );
export async function GET() {
  try {
    return Response.json(
      (
        await db().query(
          "SELECT r.*,a.name,a.description FROM rentals r JOIN agents a ON a.id=r.agent_id WHERE renter=$1 ORDER BY created_at DESC",
          [await user()],
        )
      ).rows,
    );
  } catch (e) {
    return fail(e);
  }
}
export async function POST(r: Request) {
  try {
    sameOrigin(r);
    const renter = await user();
    const body = await r.json();
    if (body.signature) {
      const result = await db().query(
        "SELECT r.*,a.wallet FROM rentals r JOIN agents a ON a.id=r.agent_id WHERE r.id=$1 AND renter=$2",
        [body.id, renter],
      );
      const rental = result.rows[0];
      if (!rental) throw new Error("Rental not found");
      if (rental.status === "active") return Response.json(rental);
      if (Date.now() - new Date(rental.created_at).getTime() > 10 * 60e3)
        throw new Error("Checkout expired. Start a new rental.");
      const tx = await rpc().getParsedTransaction(String(body.signature), {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      });
      if (!rental.token_mint)
        throw new Error(
          "This checkout predates token rentals. Start a new rental.",
        );
      verifyTokenRentalPayment(tx, rental);
      const updated = await db().query(
        "UPDATE rentals SET status='active',signature=$1,expires_at=now()+($2::int*interval '1 hour') WHERE id=$3 AND status='pending' RETURNING *",
        [body.signature, rental.hours, rental.id],
      );
      return Response.json(updated.rows[0] || rental);
    }
    await limit(`checkout:${renter}`, 30, 3600);
    if (!process.env.AGENT_TOKEN_MINT)
      throw new Error("$AGENT rentals open after the official token launch.");
    const a = rentalInput.parse(body);
    if (renter !== `wallet:${a.payer}`)
      throw new Error("Use your signed-in wallet for payment");
    const agent = (
      await db().query("SELECT * FROM agents WHERE id=$1 AND listed=true", [
        a.agentId,
      ])
    ).rows[0];
    if (!agent) throw new Error("This agent is not available");
    if (agent.owner === renter) throw new Error("You already own this agent");
    const payer = new PublicKey(a.payer);
    const id = randomUUID();
    const connection = rpc();
    const mint = new PublicKey(process.env.AGENT_TOKEN_MINT);
    const mintInfo = await getMint(connection, mint);
    const decimals = mintInfo.decimals;
    const amount =
      tokenUnits(String(agent.hourly_agent), decimals) * BigInt(a.hours);
    if (amount > 18446744073709551615n)
      throw new Error("Rental total is too large");
    const recipient = new PublicKey(agent.wallet);
    const source = getAssociatedTokenAddressSync(mint, payer);
    const destination = getAssociatedTokenAddressSync(mint, recipient);
    const balance = await connection.getTokenAccountBalance(source);
    if (BigInt(balance.value.amount) < amount)
      throw new Error("Insufficient $AGENT balance");
    const latest = await connection.getLatestBlockhash();
    const tx = new Transaction({ feePayer: payer, ...latest });
    if (!(await connection.getAccountInfo(destination)))
      tx.add(
        createAssociatedTokenAccountInstruction(
          payer,
          destination,
          recipient,
          mint,
        ),
      );
    tx.add(
      createTransferCheckedInstruction(
        source,
        mint,
        destination,
        payer,
        amount,
        decimals,
      ),
      new TransactionInstruction({
        programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
        keys: [],
        data: Buffer.from(`agentrouter:rental:${id}`),
      }),
    );
    await db().query(
      "INSERT INTO rentals(id,agent_id,renter,payer,hours,lamports,token_mint,token_amount,token_decimals,recipient) VALUES($1,$2,$3,$4,$5,0,$6,$7,$8,$9)",
      [
        id,
        a.agentId,
        renter,
        a.payer,
        a.hours,
        mint.toBase58(),
        amount.toString(),
        decimals,
        recipient.toBase58(),
      ],
    );
    return Response.json({
      id,
      transaction: tx
        .serialize({ requireAllSignatures: false })
        .toString("base64"),
      amount: amount.toString(),
      currency: "$AGENT",
      network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet",
    });
  } catch (e) {
    return fail(e);
  }
}
