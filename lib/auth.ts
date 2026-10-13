import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { db } from "./db";
import { PublicKey } from "@solana/web3.js";
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { error: "/sign-in" },
  providers: [
    Credentials({
      id: "wallet",
      name: "Solana wallet",
      credentials: { address: {}, signature: {}, challenge: {} },
      async authorize(c) {
        try {
          const address = String(c.address);
          new PublicKey(address);
          const result = await db().query(
            "DELETE FROM challenges WHERE id=$1 AND expires_at>now() RETURNING message",
            [String(c.challenge)],
          );
          if (!result.rows[0]) return null;
          if (
            !nacl.sign.detached.verify(
              new TextEncoder().encode(result.rows[0].message),
              bs58.decode(String(c.signature)),
              bs58.decode(address),
            )
          )
            return null;
          return {
            id: `wallet:${address}`,
            name: `${address.slice(0, 4)}…${address.slice(-4)}`,
          };
        } catch {
          return null;
        }
      },
    }),
    ...(process.env.OPENAI_CLIENT_ID
      ? [
          {
            id: "openai",
            name: "ChatGPT",
            type: "oidc" as const,
            issuer: "https://auth.openai.com",
            clientId: process.env.OPENAI_CLIENT_ID,
            clientSecret: process.env.OPENAI_CLIENT_SECRET,
            authorization: { params: { scope: "openid profile email" } },
            checks: ["pkce", "state", "nonce"] as (
              "pkce" | "state" | "nonce"
            )[],
            client: {
              token_endpoint_auth_method: process.env.OPENAI_CLIENT_SECRET
                ? "client_secret_basic"
                : "none",
            },
            profile(p: {
              sub: string;
              name?: string;
              email?: string;
              picture?: string;
            }) {
              return {
                id: `openai:${p.sub}`,
                name: p.name,
                email: p.email,
                image: p.picture,
              };
            },
          },
        ]
      : []),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.uid = user.id;
      return token;
    },
    session({ session, token }) {
      session.user.id = String(token.uid);
      return session;
    },
  },
});
