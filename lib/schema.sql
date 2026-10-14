CREATE TABLE IF NOT EXISTS challenges (id uuid PRIMARY KEY, message text NOT NULL, expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS agents (id uuid PRIMARY KEY, owner text NOT NULL, wallet text NOT NULL, name text NOT NULL, description text NOT NULL, strategy text NOT NULL, category text NOT NULL, hourly_lamports bigint NOT NULL CHECK(hourly_lamports > 0), listed boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS rentals (id uuid PRIMARY KEY, agent_id uuid NOT NULL REFERENCES agents(id), renter text NOT NULL, payer text NOT NULL, hours integer NOT NULL CHECK(hours BETWEEN 1 AND 168), lamports bigint NOT NULL, signature text UNIQUE, status text NOT NULL DEFAULT 'pending', created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz);
CREATE INDEX IF NOT EXISTS agents_owner ON agents(owner);
CREATE INDEX IF NOT EXISTS rentals_renter ON rentals(renter);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS mint_address text UNIQUE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS mint_signature text UNIQUE;
CREATE TABLE IF NOT EXISTS usage_limits (id text PRIMARY KEY, count integer NOT NULL, resets_at timestamptz NOT NULL);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS mint_prepared_at timestamptz;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS plan jsonb;
CREATE TABLE IF NOT EXISTS paper_runs (id uuid PRIMARY KEY,agent_id uuid NOT NULL REFERENCES agents(id),owner text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),price numeric NOT NULL,action text NOT NULL,amount_usd numeric NOT NULL,usd numeric NOT NULL,sol numeric NOT NULL,equity numeric NOT NULL,report jsonb NOT NULL);
CREATE INDEX IF NOT EXISTS paper_agent_owner ON paper_runs(agent_id,owner,created_at DESC);
CREATE TABLE IF NOT EXISTS trade_intents (id uuid PRIMARY KEY,agent_id uuid NOT NULL REFERENCES agents(id),owner text NOT NULL,wallet text NOT NULL,request_id text NOT NULL,transaction text NOT NULL,status text NOT NULL DEFAULT 'pending',signature text,created_at timestamptz NOT NULL DEFAULT now(),expires_at timestamptz NOT NULL DEFAULT now()+interval '60 seconds',details jsonb NOT NULL);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS avatar integer NOT NULL DEFAULT 0 CHECK(avatar BETWEEN 0 AND 5);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS avatar_color text NOT NULL DEFAULT '#bba7f5';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS hourly_agent numeric(18,6) NOT NULL DEFAULT 10 CHECK(hourly_agent > 0);
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS token_mint text;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS token_amount text;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS token_decimals integer;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS recipient text;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_intents ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS rentals_agent ON rentals(agent_id);
CREATE INDEX IF NOT EXISTS trade_intents_agent ON trade_intents(agent_id);
CREATE TABLE IF NOT EXISTS builder_chats (
 id uuid PRIMARY KEY, owner text NOT NULL, title text NOT NULL,
 messages jsonb NOT NULL DEFAULT '[]', plan jsonb,
 reasons jsonb NOT NULL DEFAULT '{}', preferences jsonb NOT NULL DEFAULT '{}',
 step integer NOT NULL DEFAULT 0 CHECK(step BETWEEN 0 AND 6),
 revision integer NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS builder_chats_owner_updated ON builder_chats(owner,updated_at DESC,id);
ALTER TABLE builder_chats ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON builder_chats FROM anon,authenticated;
