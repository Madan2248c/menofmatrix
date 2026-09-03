-- Production Performance Indexes & Rollups for MOM Tracker

-- 1. Optimized compound indexes for fast user and agent date-range queries
CREATE INDEX IF NOT EXISTS idx_tracker_usage_user_agent_date 
  ON tracker_daily_usage(user_id, agent_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_tracker_usage_date_agent 
  ON tracker_daily_usage(date DESC, agent_id);

-- 2. Pre-aggregated weekly/monthly rollups table for instant homepage leaderboard rendering (< 1ms)
CREATE TABLE IF NOT EXISTS tracker_summary_rollups (
  agent_id        TEXT PRIMARY KEY,
  agent_name      TEXT NOT NULL,
  total_members   INT NOT NULL DEFAULT 0,
  total_tokens    BIGINT NOT NULL DEFAULT 0,
  share_percent   NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  rank_position   INT NOT NULL DEFAULT 0,
  last_updated    TIMESTAMPTZ NOT NULL DEFAULT now()
);
