CREATE TABLE IF NOT EXISTS challenges (id uuid PRIMARY KEY, message text NOT NULL, expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS agents (id uuid PRIMARY KEY, owner text NOT NULL, wallet text NOT NULL, name text NOT NULL, description text NOT NULL, strategy text NOT NULL, category text NOT NULL, hourly_lamports bigint NOT NULL CHECK(hourly_lamports > 0), listed boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS rentals (id uuid PRIMARY KEY, agent_id uuid NOT NULL REFERENCES agents(id), renter text NOT NULL, payer text NOT NULL, hours integer NOT NULL CHECK(hours BETWEEN 1 AND 168), lamports bigint NOT NULL, signature text UNIQUE, status text NOT NULL DEFAULT 'pending', created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz);
CREATE INDEX IF NOT EXISTS agents_owner ON agents(owner);
CREATE INDEX IF NOT EXISTS rentals_renter ON rentals(renter);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS mint_address text UNIQUE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS mint_signature text UNIQUE;
CREATE TABLE IF NOT EXISTS usage_limits (id text PRIMARY KEY, count integer NOT NULL, resets_at timestamptz NOT NULL);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS mint_prepared_at timestamptz;
