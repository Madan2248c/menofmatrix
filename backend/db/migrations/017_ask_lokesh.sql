-- Ask Lokesh: one-line prompts from members, optionally answered by the owner
CREATE TABLE IF NOT EXISTS ask_questions (
  id           BIGSERIAL PRIMARY KEY,
  member_id    BIGINT NOT NULL REFERENCES community_members(id) ON DELETE CASCADE,
  body         TEXT NOT NULL,
  answer       TEXT,
  answered_at  TIMESTAMPTZ,
  is_hidden    BOOLEAN NOT NULL DEFAULT FALSE,
  report_count INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ask_questions_visible_idx ON ask_questions (is_hidden, created_at DESC);

CREATE TABLE IF NOT EXISTS ask_votes (
  question_id BIGINT NOT NULL REFERENCES ask_questions(id) ON DELETE CASCADE,
  member_id   BIGINT NOT NULL REFERENCES community_members(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (question_id, member_id)
);
