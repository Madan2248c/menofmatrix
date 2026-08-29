-- Instagram CDN blocks cross-site image embedding (cross-origin-resource-policy:
-- same-origin), so avatars must be cached on our own storage at sync time.
ALTER TABLE ig_followers ADD COLUMN IF NOT EXISTS avatar_url TEXT;