-- Multi-account upgrade (idempotent)

CREATE TABLE IF NOT EXISTS ig_accounts (
  id            SERIAL PRIMARY KEY,
  ig_user_id    TEXT UNIQUE NOT NULL,
  username      TEXT,
  access_token  TEXT        NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  connected_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Carry over the legacy single-account token if it has an IG user id
INSERT INTO ig_accounts (ig_user_id, username, access_token, expires_at)
SELECT t.ig_user_id, t.username, t.access_token, t.expires_at
FROM ig_tokens t
WHERE t.ig_user_id IS NOT NULL
ON CONFLICT (ig_user_id) DO NOTHING;

ALTER TABLE posts             ADD COLUMN IF NOT EXISTS account_id INTEGER REFERENCES ig_accounts(id);
ALTER TABLE account_snapshots ADD COLUMN IF NOT EXISTS account_id INTEGER REFERENCES ig_accounts(id);

-- Backfill legacy rows to the first known account
UPDATE posts             SET account_id = (SELECT MIN(id) FROM ig_accounts) WHERE account_id IS NULL;
UPDATE account_snapshots SET account_id = (SELECT MIN(id) FROM ig_accounts) WHERE account_id IS NULL;

DROP TABLE IF EXISTS ig_tokens;
