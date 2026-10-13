# GPT Tek

The decentralized intelligence core for Solana. Bring your ChatGPT account, build a trading research agent, publish your strategy, and rent access by the hour for SOL.

A Next.js application with a responsive OpenAI-inspired workspace, the supplied GPT Tek logo and favicon, subtle animation, dark mode, discovery filters, creation templates, creator dashboard, rental history, and an agent research composer. No seeded agents, fabricated performance metrics, or simulated payments.

## Run

Requires Node.js 22 or newer and PostgreSQL.

```sh
npm ci
cp .env.example .env.local
# Fill DATABASE_URL and AUTH_SECRET in .env.local.
node --env-file=.env.local scripts/migrate.mjs
npm run dev
```

Generate AUTH_SECRET with `openssl rand -base64 32`. Use a persistent hosted PostgreSQL database for production. Run the schema migration once before serving requests. On Vercel, add the variables from `.env.example` to the project, run the migration against its database, and deploy this repository using the Next.js preset. Never commit environment files or secrets.

## Functional flows

- **Wallet identity:** Phantom signs a domain-bound nonce; Ed25519 verification creates an Auth.js session. Challenges are stored in PostgreSQL, expire after five minutes, and are consumed once.
- **ChatGPT identity:** Auth.js OpenID Connect with PKCE, state and nonce checks, discovery and ID token verification. Set `OPENAI_CLIENT_ID` and, for confidential clients, `OPENAI_CLIENT_SECRET`. Register the exact callback `https://YOUR_DOMAIN/api/auth/callback/openai`. The button remains visibly unavailable without a registered client.
- **Agent creation:** authenticated owners save private strategy instructions and a payout wallet. Listings can be published or unlisted. Public marketplace responses omit private strategy instructions.
- **Mint:** after creation, owners can approve a 1/1 SPL token mint in Phantom. The transaction creates the mint, initializes its associated token account, issues one token, revokes the mint authority, and writes the agent ID and SHA-256 strategy hash in a Solana memo. Verification checks the mint supply, decimals, revoked authorities, recipient account, creator signature and memo. These are token receipts, not Metaplex artwork NFTs. Database ownership does not transfer when the receipt token transfers.
- **Rent:** select 1–168 hours and approve a direct transfer to the creator. The server verifies exact lamports, sender, recipient, rental-specific memo, signer, confirmation status and transaction age. A unique database constraint prevents reusing a signature. Access begins after verification and expires according to the server clock.
- **Recovery:** if a mint or payment succeeds but verification fails, copy its signature from Phantom and use Verify mint / Verify payment. Do not send a second payment. Checkout expires after ten minutes; contact the operator if a valid payment needs manual reconciliation after that window. There is no escrow or automatic refund system in this version.
- **Inference:** owners and active renters can run agent research through the Responses API. Use your own OpenAI API key in Settings, or configure `OPENAI_API_KEY` on the server. User-supplied keys stay only in page memory and are forwarded for requests, never persisted. Requests have bounded input/output, a timeout and a shared database-backed per-user usage limit. Configure provider budgets when using a shared server key.

## OpenAI availability

Official reference: https://developers.openai.com/siwc

Commercial website Sign in with ChatGPT is offered to selected partners. A registered client is required; identity sign-in alone does not grant Responses API access. Hosted commercial ChatGPT plan usage requires separate approval. The OSS/local registration flow is not used as a workaround for a hosted marketplace.

This app implements identity integration and API-key-backed inference. ChatGPT subscription inference is **not** enabled until approved and integrated under the correct hosted access contract. Creators publish strategy access, never their ChatGPT credentials or subscription tokens. GPT Tek is independent and is not affiliated with OpenAI.

## Solana network

Defaults to **devnet / test SOL**. Keep `SOLANA_RPC_URL`, `NEXT_PUBLIC_SOLANA_RPC_URL` and `NEXT_PUBLIC_SOLANA_NETWORK` aligned. For mainnet use a suitable authenticated RPC service and set the public network label to `mainnet-beta`; do not expose a private RPC credential in the public URL. Minting incurs Solana account rent and network fees paid by the creator. Rentals add wallet network fees to the quoted SOL rental price.

No custodial keys are stored. Every mint and rental transfer requires wallet approval. This is a centralized strategy marketplace with on-chain payment and token receipts, not a fully decentralized protocol. Autonomous trading, continuous scheduled execution, Jupiter swaps, escrow, token-gated ownership transfers and live market-feed tools are not implemented. The research composer explicitly prevents claims of fabricated prices or executed trades.

## Checks

```sh
npm run test
npm run typecheck
npm run build
node scripts/smoke.mjs
```

Tests cover request validation, arithmetic limits, payment spoofing, failed/stale transactions, idempotent PostgreSQL schema setup, payment replay constraints, owner restrictions and rental expiry. The smoke check starts the production server and checks server rendering, favicon, status, session, authenticated endpoint protection and cross-origin rejection.

Real Phantom approval, an approved OpenAI OAuth client, hosted database operations, AI responses and devnet transaction confirmation require configured external services and are not validated by the offline tests.
