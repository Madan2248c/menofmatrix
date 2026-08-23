-- Comment-to-DM automation
CREATE TABLE IF NOT EXISTS comments (
  id          TEXT PRIMARY KEY,
  account_id  INTEGER REFERENCES ig_accounts(id),
  post_id     TEXT REFERENCES posts(id) ON DELETE CASCADE,
  text        TEXT,
  username    TEXT,
  like_count  INTEGER,
  timestamp   TIMESTAMPTZ,
  synced_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS comments_account_time_idx
  ON comments (account_id, timestamp DESC);

CREATE TABLE IF NOT EXISTS automation_rules (
  id               BIGSERIAL PRIMARY KEY,
  account_id       INTEGER NOT NULL REFERENCES ig_accounts(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  trigger_keywords TEXT[] NOT NULL DEFAULT '{}',
  action           TEXT NOT NULL DEFAULT 'reply' CHECK (action IN ('reply','dm','both')),
  message_template TEXT NOT NULL DEFAULT '',
  enabled          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS automation_actions (
  id         BIGSERIAL PRIMARY KEY,
  rule_id    INTEGER NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  comment_id TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  action     TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'ok',
  message    TEXT,
  UNIQUE (rule_id, comment_id, action),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);