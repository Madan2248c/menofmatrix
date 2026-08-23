-- Public newsletter signups
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id         BIGSERIAL PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
