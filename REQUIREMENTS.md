# Requirements Document — Personal Instagram Analytics Website

> Feature 1: Display ALL posts & stories from my Instagram account along with their analytics.
>
> Researched Aug 2026 against current Meta documentation (developers.facebook.com/docs/instagram-platform).

---

## 1. Critical Reality Check (read this first)

### 1.1 The old easy way is gone
Instagram's **Basic Display API** (which worked with *personal* accounts) was **deprecated on Dec 4, 2024**. New apps can no longer use it. There is NO official API that works with personal Instagram accounts anymore.

**Consequence:** To get any data via API, the target Instagram account must be converted to a **Professional account** (Business or Creator). This is free, takes 2 minutes in the IG app (Settings → Account type), and does not change how your account looks publicly. Creator is recommended for individuals; Business for brands.

### 1.2 Good news for this project
Since the website will only access **your own** Instagram account:
- ✅ **Meta App Review is NOT required.** Meta explicitly exempts apps that serve only "a business I own or manage" — you operate under **Standard Access** with yourself added as an app role user.
- ✅ Everything is free — Graph API has no charge.
- ⚠️ If you ever want OTHER people to log in with their accounts, App Review + Advanced Access becomes mandatory (2–4 weeks per submission). Out of scope for now.

---

## 2. Prerequisites (one-time setup checklist)

| # | Item | How |
|---|------|-----|
| 1 | Instagram **Professional** account | IG app → Settings → Account type → switch to Creator/Business |
| 2 | Meta developer account | developers.facebook.com → sign up |
| 3 | Meta **Business-type app** | App Dashboard → Create App → type "Business" |
| 4 | Add **Instagram** product | In app: Products → "API setup with Instagram login" |
| 5 | Connect the account | Follow "API setup with Instagram login" flow; generate an access token directly in the dashboard (works without review for your own account) |
| 6 | Public HTTPS webhook URL (optional, phase 2) | Needed only to capture story analytics after stories expire (see §5.3) |

Note: the newer **Instagram API with Instagram Login** does NOT require linking a Facebook Page (the legacy Facebook-Login flavor did). Prefer the Instagram Login flavor — simpler OAuth, web-only, fewer moving parts.

---

## 3. Authentication Requirements

- **OAuth flow:** `https://www.instagram.com/oauth/authorize` with `client_id`, `redirect_uri`, `response_type=code`, `scope=...`
- **Permissions (scopes) needed for this feature:**
  - `instagram_business_basic` — profile info + media (REQUIRED)
  - `instagram_business_manage_insights` — all analytics metrics (REQUIRED)
  - *(not needed now)*: `instagram_business_content_publish`, `instagram_business_manage_comments`, `instagram_business_manage_messages`
- **Token lifecycle (must be handled in backend):**
  - Short-lived token: valid **1 hour**
  - Exchange once for a **long-lived token**: valid **~60 days**
  - Refresh via `graph.instagram.com/refresh_access_token` (allowed when existing token ≥24h old and still valid)
  - Backend must auto-refresh (cron) and store tokens securely (encrypted at rest / env secret)

---

## 4. Data We Can Pull (endpoints)

Base URL: `https://graph.instagram.com/v23.0/`

| Data | Endpoint | Notes |
|------|----------|-------|
| Profile | `GET /me?fields=user_id,username,name,profile_picture_url,followers_count,follows_count,media_count` | snapshot daily for follower trends |
| All posts (feed, carousels, reels) | `GET /me/media?fields=id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp&limit=50` | paginated (`after` cursor); includes history |
| Carousel children | `GET /{media_id}/children` | each image/video in a carousel |
| Active stories | `GET /me/stories` | ONLY live stories (24h); past stories NOT retrievable |
| Per-post analytics | `GET /{media_id}/insights` | metrics vary by type (below) |
| Account analytics | `GET /me/insights?metric=follower_count,reach,views,accounts_engaged&period=day` | some need `metric_type=total_value`; limited history |

### Available per-post metrics
- **Feed posts:** likes, comments, shares, saves, reach, views, total_interactions
- **Reels:** views/plays, reach, likes, comments, saves, shares
- **Stories:** reach, replies, taps_forward, taps_back, exits (+ views)

---

## 5. Hard Limitations (design around these)

1. **Rate limit ~200 requests/hour per connected IG account.** Fetching insights for N posts ≈ N calls → cache in our DB and sync on schedule; NEVER fetch on page view.
2. **Insight data delayed up to 48 hours** after posting; Meta stores it only **2 years** → snapshot values into our DB regularly.
3. **Story analytics expire after 24h.** Options:
   - Subscribe to the `story_insights` **webhook** (fires ~1h after story expires) and persist numbers — best option;
   - Or poll `/me/stories` frequently while live (crude, wastes quota).
   - Stories with <5 viewers return an error (`code 10`) / `-1` values.
   - Older stories beyond this are simply unavailable from Meta.
4. **Impressions metric deprecated** (July 2024) — use `reach`/`views`.
5. Empty insights are returned as empty arrays instead of zeros — parser must handle that.


---

## 6. Proposed Architecture

```
┌────────────┐      ┌──────────────────────────┐      ┌─────────────┐
│  Frontend   │ HTTP │        Backend           │ HTTPS│ Meta Graph  │
│ React/Vite  │◄────►│ REST API                 │◄────►│ graph.      │
│ Dashboard   │      │ - OAuth callback         │      │ instagram   │
│ (grid,      │      │ - /api/posts             │      │ .com        │
│  charts,    │      │ - /api/analytics         │      └─────────────┘
│  stats)     │      │ - /api/sync (manual/cron)│
└────────────┘      │ - webhook receiver       │
                    │ Token store + auto-refresh│
                    └───────────┬──────────────┘
                                │
                        ┌───────▼────────┐
                        │ SQLite/Postgres │  cached posts, insight
                        │ (cache/history) │  snapshots, tokens
                        └────────────────┘
```

- **Backend:** token exchange/refresh, scheduled sync job (every 1–6 h pull new media + refreshed insights), persist snapshots, serve cached JSON, webhook endpoint for story insights.
- **Frontend:** post grid (thumbnails/captions), post detail with charts (reach/likes/comments/saves/shares), stories section (live + captured-expired), KPI header (followers, reach, avg engagement).
- Suggested stack: Node.js + Express (or Next.js full-stack), SQLite for zero-ops persistence, Recharts for graphs.

---

## 7. Functional Requirements — Feature 1

1. **FR1** One-time "Connect Instagram" OAuth flow; tokens persisted & auto-refreshed.
2. **FR2** Complete post history (images/videos/carousels/reels) with thumbnails, captions, timestamps, permalinks.
3. **FR3** Live stories view; persist expired-story analytics via webhook where possible.
4. **FR4** Per-post analytics panel (likes, comments, shares, saves, reach, views).
5. **FR5** Account dashboard: followers, media count, reach/views trends (daily snapshots).
6. **FR6** Manual "Sync now" button + scheduled background sync respecting 200 req/h.
7. **FR7** Graceful handling of empty/error insight responses (<5-viewer stories, 48h delay).

## 8. Non-Functional Requirements

- **NFR1** Never call Graph API during page render — always serve from local cache.
- **NFR2** Secrets in `.env`: IG app id/secret, redirect URI, token encryption key.
- **NFR3** Single-user (owner-only) dashboard initially; simple password protection optional.
- **NFR4** Extensible design so future features (auto-publishing, multi-account) don't require rewrites.

## 9. Decisions (locked in)

1. **Stack:** separate apps — `frontend/` (Vite + React + Recharts) and `backend/` (Express + pg). Some pages are public, dashboard is owner-only.
2. **Account:** already an Instagram Creator account ✅
3. **Stories:** live-only for now (webhook capture deferred to a future phase).
4. **Database:** Neon-hosted Postgres (`DATABASE_URL` in backend `.env`).

## 10. Implementation status

Project scaffolded and verified (see root `README.md` for run/setup instructions):
- Backend boots; health/login/OAuth-URL endpoints tested live.
- Frontend production build passes.

Remaining before first real data:
1. Create Meta app & fill backend `.env`.
2. Run `npm run migrate` against Neon.
3. Connect Instagram via the dashboard button, then hit "Sync now".
