# MenOfMatrix Frontend — Replication Spec

Source of truth for rebuilding the existing Vite/React frontend (`frontend/`) inside the
new Next.js app (`menofmatrix_fe/`). Captures every page/section and every backend API call
currently made by the site, so behavior can be replicated 1:1.

Backend is untouched — `menofmatrix_fe` should call the same Express API in `backend/`.

## Stack notes (current frontend, for reference)

- Vite + React 18 + React Router v6 (client-side routed SPA)
- Global CSS design system in `src/index.css` (CSS custom properties — not Tailwind utility
  classes, aside from the shadcn/radix primitives in `src/components/ui/*`)
- Recharts for all charts
- Two React contexts: `AuthContext` (owner JWT), `AccountContext` (connected IG accounts +
  currently selected account)
- `localStorage` keys used: `token` (JWT), `accountId` (selected IG account id)

## Routes / Pages

| Path | Component | Auth | Purpose |
|---|---|---|---|
| `/` | Home | public | Landing page: hero, newsletter signup, live IG post feed preview, feature cards, follow CTA |
| `/news` | News | public | Rolling AI news feed |
| `/login` | Login | public | Owner password login |
| `/dashboard` | Dashboard | owner | Post grid (filter by type) + Sync Now + Connect Instagram |
| `/posts/:id` | PostDetail | owner | Single post detail + metric history chart |
| `/stories` | Stories | owner | Live Instagram stories (24h) |
| `/analytics` | Analytics | owner | KPIs, follower trend chart, top-posts bar chart, content breakdown table |
| `/newsletters` | Newsletters | owner | Subscriber count/list, SMTP status, compose + send newsletter |
| `/automation` | Automation | owner | Comment-to-DM automation rules: create/list/delete, run now |

"owner" routes are wrapped in `ProtectedRoute`, which redirects to `/login` if no JWT is present
in `AuthContext`. There is no per-role distinction beyond owner vs. public.

## Global layout (`Layout.jsx`)

Persistent header + footer wrapping all routes (via a React Router layout route):

- **Header**: brand logo + "MenOfMatrix" → Home link. Nav links: Home, News (always visible).
  When logged in (token present): account-switcher `<select>` (only shown if >1 connected
  account; switching triggers `AccountContext.select()` + navigate to `/dashboard`), then
  Dashboard, Stories, Analytics, Newsletter, Automation links, a "＋ Connect" button
  (kicks off Instagram OAuth), and a Logout button.
- **Footer**: copyright + "Analytics served from our own cache · not affiliated with Meta".

## Section-by-section breakdown

### Home (`/`)
1. **Hero** — H1 "MenOfMatrix", intro paragraph, `Newsletter` subscribe form (email input +
   submit; posts to `/api/newsletter/subscribe`; shows success/already-subscribed/error inline).
2. **Signature band (coral)** — "Live from Instagram" heading + subtext.
3. **Live feed** — heading "Latest posts" + `LiveFeed`: fetches 6 most recent posts
   (`GET /api/posts?limit=6`), renders as a tile grid (thumbnail/video, media-type badge,
   caption snippet, post date). Loading and empty states.
4. **Demo grid** — 3 static feature cards (Newsletter / Live feed / Community), decorative.
5. **Signature band (dark)** — logo + "Follow the matrix." copy + "Follow @menofmatrix.ai"
   button linking to the Instagram profile (external, `target=_blank`).

### News (`/news`)
- Hero header ("Live AI news" + description).
- Fetches `GET /api/news?limit=50`, renders a list of items (source badge, relative time via
  `timeAgo()`, title, summary snippet truncated to 180 chars), each linking out externally.
- Loading / error / empty states.

### Login (`/login`)
- shadcn Card with password input + submit. Calls `AuthContext.login(password)` →
  `POST /api/auth/login`; stores JWT in `localStorage['token']`; navigates to `/dashboard`
  on success; shows error message on failure.

### Dashboard (`/dashboard`) — owner
- Toolbar: type filter chips (`all`/`FEED`/`REELS`/`CAROUSEL_ALBUM`) + "⟳ Sync now" button.
- If no IG account connected: card with "Connect Instagram" button (starts OAuth via
  `GET /api/auth/instagram/url`, then `window.location.href = url`).
- Post grid: `GET /api/posts?type=&account_id=` — each tile links to `/posts/:id`, shows
  thumbnail/video, media-type badge, caption, like/comment/reach counts, post date.
- Sync Now: `POST /api/sync` with the selected account id; shows a success/error notice and
  reloads the grid.

### Post detail (`/posts/:id`) — owner
- Back link to dashboard.
- `GET /api/posts/:id` → media (image or video), caption, permalink (external link), a metric
  card grid (likes, comments, reach, views, saves, shares, interactions — only non-null ones
  shown), and (if snapshot history exists) a multi-line Recharts `LineChart` of
  likes/comments/reach/views over time built from the `snapshots` array.

### Stories (`/stories`) — owner
- `GET /api/stories/live?account_id=` for the selected account. Renders a horizontal row of
  story cards (image or muted video with controls + timestamp). Notes when data is falling
  back to cache (`source: 'cache'`) because live Instagram fetch failed. Empty/loading/error
  states. No-op (nothing fetched) if no account is selected.

### Analytics (`/analytics`) — owner
- `GET /api/analytics/summary?account_id=` for the selected account.
- KPI card grid: Followers, Total posts, Total likes, Total comments, Total reach,
  Avg reach/post. "Last synced" note.
- Follower growth: Recharts `AreaChart` of `followerTrend` (only rendered if ≥2 snapshot
  points; otherwise a "gathering data" note).
- Top posts by engagement: Recharts grouped `BarChart` (Likes vs Comments) built from
  `topPosts` (top 5 by interactions).
- Content breakdown: table of media type → count → avg reach (`breakdown`).
- Best performers: list of top 5 posts linking to `/posts/:id`, with like/comment/reach stats.

### Newsletters (`/newsletters`) — owner
- Metric cards: subscriber count (`GET /api/newsletter/subscribers`) and SMTP connection
  status (`GET /api/newsletter/smtp-status`, ✅/❌).
- Compose form: subject + body textarea → confirm dialog → `POST /api/newsletter/send`;
  shows sent/total/failures result; clears form on full success.
- Subscribers table: email + subscribed-at, only rendered if there are subscribers.

### Automation (`/automation`) — owner
- Toolbar: heading + "⚡ Run now" button (`POST /api/automation/run` for the selected
  account; shows matches/actions/failures summary).
- New rule form: name, comma-separated trigger keywords, action type (`dm` / `reply` /
  `both`), target post (dropdown of the account's posts, default "All posts"), message
  template (supports `{username}` placeholder) → `POST /api/automation/rules`.
- Active rules table: name, target post label, keywords, action, template, enabled status,
  delete button (`DELETE /api/automation/rules/:id`, confirm prompt first).
- Rules and the account's posts are loaded together on mount / account change
  (`GET /api/automation/rules?account_id=`, `GET /api/posts?account_id=&limit=100`).

## Auth model

- Owner auth is a single shared password (`ADMIN_PASSWORD` on the backend) → JWT
  (`Authorization: Bearer <token>`), valid 30 days. No per-user accounts/roles.
- Instagram OAuth (per connected creator account) is separate: `GET /api/auth/instagram/url`
  gives the Meta authorize URL; Meta redirects to `GET /api/auth/callback?code=...` which the
  *backend* handles directly (plain HTML response — not part of the SPA).

## Full API reference

Base URL: `${VITE_API_URL || ''}/api` (same-origin `/api` in dev, proxied to the backend).
All requests send `Content-Type: application/json` and, when a JWT is present in
`localStorage['token']`, `Authorization: Bearer <token>`.

`requireOwner` = must send a valid owner JWT, or the endpoint 401s.
`requireCronSecret` = internal scheduler-only endpoints, not called from the frontend.

| Method | Path | Auth | Query / Body | Response | Used by |
|---|---|---|---|---|---|
| GET | `/api/health` | – | – | `{ ok: true }` | – (liveness only) |
| POST | `/api/auth/login` | – | body `{ password }` | `{ token }` | Login |
| GET | `/api/auth/instagram/url` | – | – | `{ url }` | Layout (Connect), Dashboard |
| GET | `/api/auth/callback` | – | query `code` | HTML page (backend-rendered) | Meta OAuth redirect target, not called from React |
| GET | `/api/status` | – | – | `{ connected, accounts[], lastSync }` | not currently called from frontend |
| GET | `/api/accounts` | owner | – | `{ data: Account[] }` | AccountContext |
| DELETE | `/api/accounts/:id` | owner | – | `{ ok: true }` | not currently wired into any page |
| GET | `/api/posts` | – (public) | query `limit, offset, type, account_id` | `{ data: Post[] }` | Home (LiveFeed), Dashboard, Automation (post picker) |
| GET | `/api/posts/:id` | owner | – | `{ post, snapshots: MetricSnapshot[] }` | PostDetail |
| GET | `/api/stories/live` | owner | query `account_id` | `{ source: 'live'|'cache', account_id, data: Story[], note? }` | Stories |
| GET | `/api/analytics/summary` | owner | query `account_id` | `{ account_id, username, followers_count, total_posts, total_likes, total_comments, total_reach, total_views, avg_reach_per_post, last_synced_at, followerTrend[], topPosts[], breakdown[] }` | Analytics |
| POST | `/api/sync` | owner | body `{ account_id? }` | `{ ok, totalMedia, accounts[], ... }` | Dashboard (Sync now) |
| GET | `/api/automation/rules` | owner | query `account_id` | `{ data: AutomationRule[] }` | Automation |
| POST | `/api/automation/rules` | owner | body `{ accountId, name, keywords[], action, messageTemplate, postId }` | `{ data: AutomationRule }` | Automation (new rule form) |
| DELETE | `/api/automation/rules/:id` | owner | – | `{ ok: true }` | Automation (delete rule) |
| POST | `/api/automation/run` | owner | body `{ account_id? }` | `{ ok, matches, actions, failures[] }` | Automation (Run now) |
| POST | `/api/newsletter/subscribe` | – (public) | body `{ email }` | `{ ok: true, alreadySubscribed }` | Home (Newsletter form) |
| GET | `/api/newsletter/subscribers` | owner | – | `{ count, data: Subscriber[] }` | Newsletters |
| GET | `/api/newsletter/smtp-status` | owner | – | `{ ok, error? }` | Newsletters |
| POST | `/api/newsletter/send` | owner | body `{ subject, body }` | `{ ok, sent, total, failures[] }` | Newsletters (Compose/send) |
| GET | `/api/news` | – (public) | query `limit` | `{ data: NewsItem[] }` | News page |
| POST | `/api/news/refresh` | owner | – | `{ ok, inserted, ... }` | not currently wired into any page |
| ALL | `/api/cron/sync` | cron secret | – | `{ ok, totalMedia, automation }` | external scheduler only |
| ALL | `/api/cron/news` | cron secret | – | `{ ok, inserted }` | external scheduler only |

### Key data shapes

**Post** (`posts` table row): `id, account_id, media_type, media_product_type
('FEED'|'REELS'|'CAROUSEL_ALBUM'|'STORY'), caption, media_url, thumbnail_url, permalink,
like_count, comments_count, reach, views, saves, shares, total_interactions, posted_at,
story_expires_at`.

**AutomationRule**: `id, account_id, name, trigger_keywords[], action ('reply'|'dm'|'both'),
message_template, post_id, enabled`.

**Account** (from `/api/accounts`, `tokenStore.listAccounts`): `id, ig_user_id, username,
expires_at, connected_at` (camelCased differently again in `/api/status`).

## Behavior to replicate carefully

- Public vs. owner-gated pages/endpoints — don't expose owner data without the JWT.
- Selected-account state persisted in `localStorage['accountId']`, auto-falls back to the
  first connected account if the stored id is no longer valid.
- Instagram OAuth is a full-page redirect flow (`window.location.href`), not a popup.
- Numbers are abbreviated with a `fmt()` helper (`1200` → `1.2k`) across Dashboard/Analytics/
  PostDetail.
- Charts only render once there's enough data (e.g. follower trend needs ≥2 points); otherwise
  show a "gathering data" note instead of an empty chart.
- Sending a newsletter and deleting an automation rule both require a confirm dialog before
  the API call.
- Stories page fetch is skipped entirely (no request fired) if no account is selected yet.
