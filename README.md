# AgentRouter

Multi-model Solana trading-agent studio and timed rental marketplace. Public landing page: `/`. App: `/app`. Existing GitHub and Vercel project identifiers remain `gpt-tek` so deployed links stay valid.

## Implemented

- Live model catalogue with searchable model-selection dialogs, provider logos, capability labels and per-million-token pricing.
- AI architect conversation using the selected model, with structured strategy proposals and recommendations for research, reasoning, decision and execution-planning roles.
- Draft editing and browser-local draft persistence. API keys are never persisted in browser storage or the database.
- Signed Phantom wallet authentication, private drafts, database-backed listings, owner publication controls, and SOL hourly rental payments verified on-chain.
- Four-model analysis pipeline with live SOL/USD spot data, concise stage rationale, schema-validated decisions and deterministic maximum trade limits.
- Forward paper tests starting at $10,000 cash, recorded balances and decisions, and explicit 10bps simulated fees. No fabricated historical results. Five owner forward samples are required to publish new multi-model agents. Samples are not proof of profitability.
- Live SOL/USDC Jupiter Swap V2 order and execute integration. Each swap requires the user to sign in Phantom. Server verifies that the signed message exactly matches the stored quote and that the intended wallet signed it. Orders expire after 60 seconds. Atomic submission claims prevent duplicate execution. Ambiguous network outcomes are marked unknown and must be reconciled against wallet history before another trade.
- Active rental/owner access is checked again at each AI, paper-test and live-swap request, including before submission.

## What is not implemented

Unattended signing/delegated session wallets, automatic background main-wallet trading, on-chain stop orders, project-token rental billing, escrow/refunds, arbitrary-token trading, and historical backtesting. Live trades are wallet-approved and on mainnet; local rental payments default to devnet; the production environment is configured for mainnet. Paper loss limits apply to paper buys, not live stop orders. A strategy can be rented, but a creator's AI credentials are never rented or shared.

## Required service configuration

```sh
npm ci
cp .env.example .env.local
# Configure AUTH_SECRET and DATABASE_URL.
node --env-file=.env.local scripts/migrate.mjs
npm run dev
```

Production variables:

- `AUTH_SECRET`: cryptographically random session secret, server only.
- `AUTH_URL`: canonical site origin, currently https://gpt-tek.vercel.app.
- `DATABASE_URL`: dedicated PostgreSQL connection. Run the schema before serving authenticated requests. Do not use another project's database.
- `OPENROUTER_API_KEY`: server-only OpenRouter credential with available credits. Alternatively each user can enter their own key into the app's Settings; it is held only in page memory and sent when making an AI request. Backend routing uses OpenRouter; the customer interface presents individual models rather than infrastructure branding.
- `JUPITER_API_KEY`: server-only key provisioned through https://portal.jup.ag for Swap V2.
- `MAINNET_RPC_URL`: mainnet Solana RPC for live-wallet balances. Use a suitable production RPC provider.
- `SOLANA_RPC_URL` and `NEXT_PUBLIC_SOLANA_RPC_URL`: same cluster for rental/mint payments. Local default is devnet. Production currently uses mainnet RPC and `NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta`.

No account credentials or API keys can be manufactured by the source code. New provider accounts, paid credits and database provisioning require owner setup/approval. Public model names and Coinbase spot prices can load without these paid/private credentials.

When migrating to Supabase, use a dedicated project and keep these tables server-only. Enable RLS and revoke anon/authenticated access; the app uses its server PostgreSQL connection and Auth.js authorization, not Supabase client authentication.

## Verification

```sh
npm run test
npm run typecheck
npm run build
node scripts/smoke.mjs
```

Tests cover payment spoofing/replay, rental expiry, owner access, mint instruction encoding, patched RPC transport, risk bounds and paper accounting. The smoke test checks both routes, provider-free public catalogue, live market data, session and private endpoint rejection. Real model completions, funded rentals and real swaps require configured credentials and user wallet approval; they have not been financially transacted by the coding agent.

## Sources and assets

- Models/completions: https://openrouter.ai/docs
- Swap order/execute: https://developers.jup.ag/docs/swap/order-and-execute
- Spot market data: Coinbase SOL/USD spot API; this reference price is not an executable Jupiter quote.
- Provider icons: `@lobehub/icons-static-svg`, MIT-licensed icon package. Provider marks belong to their respective owners; inclusion does not imply partnership. AgentRouter logo is an original pixel robot asset.

## AgentRouter rental launch configuration

The AgentRouter organisation must contain a Supabase **project** before database-backed sign-in, drafts, and rentals can run. Run `lib/schema.sql` against that project's Postgres database and set `DATABASE_URL` in Vercel to its transaction-pooler connection string. Use the dashboard-provided host; do not guess it. Keep credentials server-only. All application tables have RLS enabled with no public API policies: Auth.js authenticates wallet sessions and server routes enforce ownership using the server database connection.

Set `AGENT_TOKEN_MINT` to the verified official standard SPL token mint after launch. The rental checkout reads decimals from that mint, computes exact base units, builds a checked token transfer to the creator's associated token account, and verifies the mint, recipient, signer, amount, timestamp, and checkout memo before activating timed access. SOL is needed only for transaction fees and any recipient account creation. Token-2022 mints require a separate extension-aware implementation before activation.

Demo marketplace agents are illustrative, have no performance claims, and cannot be rented. Avatar selection and colour are validated and saved with real drafts. Trading platform logos link out to their sites; direct account/trading integrations are planned and are not enabled.
