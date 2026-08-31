# Root page & Feed page — plan

Split of the public site into two surfaces:

| Surface | Purpose |
| --- | --- |
| **Root `/`** | The community engine — what the audience *does* together |
| **Feed `/`** (may be renamed `/lokesh`, `/connect`, `/me`) | Lokesh's identity + curation |
| Social `/social` | Instagram / YouTube / X content (separate, already built) |

---

## Root `/` — community engine

A single canvas over the Framer dot‑grid background, laid out in thirds.

```
            [ auth pill / profile ]           (top‑centre, hangs from the edge)

  ┌── left third ──────┐   ┌── centre ──────┐   ┌── right third ─────┐
  │  Idea Board chip   │   │  Matrix Score  │   │  Community Pulse   │
  │        │           │   │   (brand "M")  │   │  (poll carousel)   │
  │  Weekly Challenge  │   │                │   │                   │
  │  pendant (hangs)   │   │                │   │                   │
  └───────────────────┘   └────────────────┘   └───────────────────┘
```

### Components

**Community Pulse — poll carousel**
- Auto‑rotating carousel of live polls (~9 s), curved/coverflow style; ghost cards peek at the sides.
- Framed as *public opinion*, not a quiz: always‑visible stacked sentiment bar ("N people weighed in"),
  `your vote` + `majority` markers, per‑option result bars.
- Progress dots fill over the timer and grey out on pause. Pauses on hover and for a beat after voting.
- Swipe / arrow keys / dot tap to change polls. "Change vote" resets.
- **Data:** wire to `GET/POST /api/community/polls` once migrations run.

**Idea Board**
- Collapsed = a glass launcher chip: a small pile of "notes" that fans on hover; cycles one idea + its
  top two builders every 8 s with a rotation progress bar.
- Tap → the chip's surface **morphs open** (shared `layoutId`) into the board.
- Board = a 2‑column **grid** of idea tiles (vote count + title + `@by · tag · building`).
- Tap a tile → it **expands in place** into detail: description, **Building this** (builders as
  GitHub‑linked pills + "I'm building this" claim flow), **Enhancements** (community suggestions list +
  an input to add one). Back returns to the grid.
- `+ Suggest` posts a new idea instantly (report‑to‑hide moderation). `Top` / `New` sort.
- `★ PICK` badge = Lokesh‑endorsed community idea (distinct from the curated product catalog on Feed).
- **Data:** `/api/community/ideas`, `/api/community/ideas/:id/enhancements`, builders/claims.

**Weekly Build Challenge — hanging pendant**
- A weighted bob on an **elastic cord** dangling from the Idea Board chip.
- Real drag physics: the bob follows the pointer 1:1 with rubber‑band resistance past a soft limit;
  release → underdamped elastic spring (overshoot + wobble back). Gentle idle bob otherwise.
- Bob shows a short countdown. Clean tap (no drag) → morphs open.
- Panel: challenge prompt, live **"Ends in"** countdown, **Building now** list where each enrollee shows a
  live timer counting from *their* enrollment, and **Enroll & start building** (adds you with your own
  running timer).
- **Data:** `/api/community/challenge` (current), `/api/community/challenge/enroll`.

**Matrix Score — centerpiece**
- The **actual Men of Matrix logomark** (its own 687‑dot pointillist "M", `/brand/menofmatrix-mark.svg`).
- An orange level **rises through the mark** to a weekly composite score; ghost‑grey above the line.
- Score = `votes×1 + ideas×25 + builders×40 + challengeProgress`; weekly goal 1000; resets Monday.
- Tap → breakdown panel: the mark again + per‑contributor rows + how it's scored.
- **Data:** `/api/community/score` (aggregate of the above).

**Tool Usage Rankings — reserved, not built**
- DB schema + empty API + stub UI only. Wire real data when the tracked tool exists.

### Design rules (site‑wide)

- **One continuous surface.** Every expand is a **morph** (shared `layoutId` / `layout`), never a modal
  that pops in and never a hard grid↔detail swap. The auth pill, Idea Board, pendant and Matrix Score
  all follow this.
- **Palette:** orange accent `#ea580c` (+ `#fdba74` light), neutral text near‑black, Poppins.
- **Glassmorphism:** translucent white + backdrop blur for panels and inline cards; the dot‑grid shows
  through. Poll options are opaque white with a soft drop shadow (must read on the busy grid).
- **Shared motion tokens** — `src/lib/motion.js`: `SPRING` (micro‑interactions), `MORPH` (layout /
  expand), `BOUNCE` (playful settle), `EASE`, `GLASS`, `GLASS_PANEL`, `CARD`.
- **`MotionProvider`** wraps the page: `MotionConfig reducedMotion="user"` (respects OS setting) + one
  `LayoutGroup` so cross‑component morphs don't collide.

### Auth & moderation

- **Visitors:** Google OAuth via NextAuth (`src/auth.js`), creds from `backend/.env`.
- The community backend currently expects a custom `mid` JWT (`/api/auth/google` → app JWT) — this needs
  reconciling with the NextAuth session before community writes go live.
- **Moderation:** submissions post instantly; report‑to‑hide + owner moderation. Owner tooling = the
  existing Vite admin app, extended.

---

## Feed `/` — Lokesh's identity + curation

Currently a bare canvas; content below is planned, not built.

- **Identity:** name, short bio, socials cluster (SocialFab / MeetLokesh), "buy me tokens" support
  button (buymeacoffee), ask‑lokesh, ship‑log, in‑the‑media.
- **Trending topic chips** *(moved here from root)*: chip = topic label + heat metric
  (votes + idea mentions + reactions, last 48 h) + state (`new` / `rising` / `cooling`); tap filters the
  poll carousel + idea board to that topic. Topics are **derived** from poll / idea‑board tags, not
  hand‑authored. Layout: one horizontally‑scrollable row above the fold.
- **Men of Matrix suggested products**: a **curated** catalog of tools / apps / sites the team
  recommends — name, one‑liner, link, tag. Owner‑managed, *not* community‑submitted (that's the Idea
  Board). Distinct from the Idea Board `★ PICK` badge.
- **Latest AI news / news posts:** Feed is "trending + latest news". If news grows beyond a strip it
  gets its own `/news`; otherwise it lives here. Not a blog.

---

## Status & next steps

**Built (root):** `PollCarousel` + `PollCard`, `IdeaChip` + `IdeaBoard`, `WeeklyChallengePendant`,
`MatrixScore`, `FeaturePopout` (morph host), `MotionProvider`, `lib/motion.js`. All on placeholder /
local state.

**Scaffolded (backend, commit `cf026e9`):** community DB migrations (`012`–`020`), `routes/community.js`,
`routes/admin.js`, `middleware/communityAuth.js`, `services/communityService.js`. Not migrated, not wired.

**Pending:**
1. Owner: `cd backend && npm run migrate` against Neon.
2. Add `http://localhost:3000/api/auth/callback/google` to the Google OAuth client redirect URIs.
3. Reconcile NextAuth session ↔ custom community `mid` JWT.
4. Wire poll / idea board / challenge / score to `/api/community/*`.
5. Build the Feed page content (identity, trending chips, suggested products).
6. Tool Usage Rankings — implement when the tracked tool ships.
