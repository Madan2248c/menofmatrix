-- Poll cluster: one model for topic / prediction / decision / showdown polls
CREATE TABLE IF NOT EXISTS polls (
  id                 BIGSERIAL PRIMARY KEY,
  kind               TEXT NOT NULL,               -- topic | prediction | decision | showdown
  question           TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'draft', -- draft | live | closed
  opens_at           TIMESTAMPTZ,
  closes_at          TIMESTAMPTZ,
  resolved_option_id BIGINT,                      -- prediction: the option that came true
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS polls_status_idx ON polls (status, kind);

CREATE TABLE IF NOT EXISTS poll_options (
  id         BIGSERIAL PRIMARY KEY,
  poll_id    BIGINT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS poll_options_poll_idx ON poll_options (poll_id);

-- One vote per poll per member; a re-vote is an UPDATE of option_id
CREATE TABLE IF NOT EXISTS poll_votes (
  id         BIGSERIAL PRIMARY KEY,
  poll_id    BIGINT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id  BIGINT NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  member_id  BIGINT NOT NULL REFERENCES community_members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (poll_id, member_id)
);

CREATE INDEX IF NOT EXISTS poll_votes_poll_idx ON poll_votes (poll_id, option_id);
