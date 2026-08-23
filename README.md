# Instagram Analytics Website

Personal dashboard showing all Instagram posts & stories with analytics.
Frontend and backend are separate apps. See `REQUIREMENTS.md` for the full research/requirements doc.

```
frontend/   Vite + React + React Router + Recharts (public pages + owner dashboard)
backend/    Express + pg (Neon Postgres) + node-cron
```

## 1. One-time Meta setup (no App Review needed for own account)

1. **Meta developer account** → https://developers.facebook.com
2. **Create App** → type **Business**
3. In the app: **Products → Instagram → "API setup with Instagram login"**
4. Note the **Instagram App ID** and **Instagram App Secret** (shown in that product's page)
5. Under the product settings, add `http://localhost:4000/api/auth/callback` as an **OAuth redirect URI** (add your production URL later)
6. Add yourself (the Creator account owner) under **App roles** if prompted

## 2. Backend setup

```bash
cd backend
cp .env.example .env        # fill in: IG_APP_ID, IG_APP_SECRET, DATABASE_URL (Neon), ADMIN_PASSWORD, JWT_SECRET
npm install
npm run migrate             # creates tables in your Neon DB
npm run dev                 # http://localhost:4000
```

## 3. Frontend setup

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173 (proxies /api to :4000)
```

## 4. First run

1. Open http://localhost:5173 → **Login** with `ADMIN_PASSWORD`
2. Go to **Dashboard** → click **Connect Instagram** → authorize on instagram.com
3. Back on Dashboard click **⟳ Sync now** — pulls all posts + insights into Postgres
4. An hourly cron re-syncs automatically; follower counts snapshot daily

## API overview

| Endpoint | Auth | Purpose |
|---|---|---|
| `GET /api/health` | – | liveness |
| `POST /api/auth/login` | – | owner login → JWT |
| `GET /api/auth/instagram/url` | – | OAuth authorize URL |
| `GET /api/auth/callback` | – | OAuth redirect target |
| `GET /api/status` | – | connection & last sync status |
| `GET /api/posts?type=FEED\|REELS\|CAROUSEL_ALBUM&limit&offset` | – | cached posts |
| `GET /api/posts/:id` | – | post detail + metric history |
| `GET /api/stories/live` | – | live stories |
| `GET /api/analytics/summary` | – | KPIs, follower trend, top posts |
| `POST /api/sync` | JWT | force full sync now |

## Notes / limits (from research)

- Graph API rate limit ≈ 200 calls/hour — the app serves from Postgres cache, never live on page render.
- Insight data can lag up to 48h; stories vanish after 24h (live-only view for now).
- Long-lived tokens expire ~60 days but auto-refresh via hourly cron when <7 days remain.
