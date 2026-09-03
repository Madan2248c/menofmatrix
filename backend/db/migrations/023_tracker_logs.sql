CREATE TABLE IF NOT EXISTS tracker_daily_usage (
  id                  BIGSERIAL PRIMARY KEY,
  user_id             TEXT NOT NULL,
  user_email          TEXT,
  agent_id            TEXT NOT NULL,
  agent_name          TEXT NOT NULL,
  date                DATE NOT NULL,
  input_tokens        BIGINT NOT NULL DEFAULT 0,
  output_tokens       BIGINT NOT NULL DEFAULT 0,
  thinking_tokens     BIGINT NOT NULL DEFAULT 0,
  cached_tokens       BIGINT NOT NULL DEFAULT 0,
  total_tokens        BIGINT NOT NULL DEFAULT 0,
  client_timestamp    TIMESTAMPTZ,
  recorded_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, agent_id, date)
);

CREATE INDEX IF NOT EXISTS idx_tracker_usage_user_date ON tracker_daily_usage(user_id, date);
CREATE INDEX IF NOT EXISTS idx_tracker_usage_agent_date ON tracker_daily_usage(agent_id, date);
