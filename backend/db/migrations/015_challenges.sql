-- Weekly Build Challenge: a brief, member submissions, community vote for a winner
CREATE TABLE IF NOT EXISTS challenges (
  id              BIGSERIAL PRIMARY KEY,
  brief           TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'open',   -- open | voting | closed
  linked_idea_id  BIGINT REFERENCES ideas(id) ON DELETE SET NULL,
  opens_at        TIMESTAMPTZ,
  closes_at       TIMESTAMPTZ,
  winner_entry_id BIGINT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS challenges_status_idx ON challenges (status, created_at DESC);

CREATE TABLE IF NOT EXISTS challenge_entries (
  id           BIGSERIAL PRIMARY KEY,
  challenge_id BIGINT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  member_id    BIGINT NOT NULL REFERENCES community_members(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  note         TEXT,
  is_hidden    BOOLEAN NOT NULL DEFAULT FALSE,
  report_count INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS challenge_entries_challenge_idx ON challenge_entries (challenge_id, is_hidden);

CREATE TABLE IF NOT EXISTS challenge_entry_votes (
  entry_id   BIGINT NOT NULL REFERENCES challenge_entries(id) ON DELETE CASCADE,
  member_id  BIGINT NOT NULL REFERENCES community_members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (entry_id, member_id)
);
