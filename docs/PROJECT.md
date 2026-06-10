# SoccerX — Project Design

> **Working title:** SoccerX
> **Concept:** A 39-day daily-return social game built around the 2026 FIFA World Cup, evolving into AFCON 2027 and future tournaments.
> **NOT:** A static bracket. We are explicitly competing with — and improving on — CNN's, The Guardian's, and The Athletic's static bracket tools.

---

## 1. Vision

> "Stop building a bracket, start building a 39-day game with the bracket as its spine."

The World Cup runs ~39 days (11 June → 19 July 2026). Static brackets ignore 38 of them. SoccerX gives users a reason to open the app every single match-day, makes their predictions personally relevant to every result, and turns the tournament into a shared social experience with the people they care about.

## 2. Why now

- 48-team, 12-group, 104-match format is **new** — incumbents haven't optimised for it
- Africa is hugely underserved by prediction games (this becomes a moat at AFCON 2027)
- We already operate the exact stack (Lotris, TrendX) — engineering cost is minimal
- The brackets that exist (CNN, Guardian, Athletic) are read-only artefacts, not games

## 3. v1 Scope (World Cup 2026)

Ship-fast. Beat the CNN bracket. Do not over-build.

| Priority | Feature | Why |
|---|---|---|
| Must | Full WC2026 bracket entry (groups + knockouts + 8 best-3rd) | Table stakes |
| Must | Live scoring against real match-results API | The unlock |
| Must | Mini-leagues with invite codes | Single biggest retention lever |
| Must | OG share image (clean, brandable) | Free acquisition |
| Must | Daily picks during tournament (1–2 questions/day) | Daily-return hook |
| Should | Personality/archetype reveal post-picks-lock | Memorable shareable moment |
| Should | Champion's Path visualisation | Emotional spine |
| Nice | AI-generated commentary on bracket | Cheap delight |
| Defer to v2 | Power-ups, badges/streaks, knockout reset bracket | Polish |

## 4. v2 Scope (AFCON 2027, Dec 2026 – Jan 2027)

The "real" launch. Build during/after WC2026 using v1 telemetry.

- Power-ups inventory (Double Points, Insurance, Underdog Bonus, Lock-in)
- Knockout reset bracket (the comeback mechanic — fixes round-of-16 cliff)
- Badges + streaks
- AI commentary tuned per region / language
- Push notifications via PWA
- Ghana-specific WhatsApp share path (huge in our market)

## 5. Game Mechanics

### 5.1 Bracket scoring

| Pick | Points |
|---|---|
| Correct group-stage match winner | 10 |
| Correct group-stage scoreline | +15 bonus (total 25) |
| Correct round-of-32 progression | 20 |
| Correct round-of-16 progression | 40 |
| Correct quarter-finalist | 60 |
| Correct semi-finalist | 100 |
| Correct finalist | 150 |
| Correct champion | 200 |
| Correct golden boot top scorer (v2) | 100 |

### 5.2 Daily picks (during tournament)

Each match-day, 1–2 bonus questions worth 5–15 points each:
- "Who scores first in match X?"
- "Over/under 2.5 goals?"
- "Will there be a red card today?"
- "Predict the half-time scoreline."

Locks at kickoff. Settles via the same scoring worker.

### 5.3 Leaderboards

- **Global** — all SoccerX users
- **Country** — derived from user IP/profile
- **Mini-league** — invite-only, group of friends

Updated near-real-time as scoring worker processes new match events.

### 5.4 Lock semantics

- All group-stage picks lock at kickoff of **first** group match
- Knockout picks lock at kickoff of the relevant knockout match
- Daily picks lock at kickoff of the specific match
- Once locked, a pick is **immutable** — only the score event is appended

## 6. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  apps/web — Next.js 15 App Router                           │
│   ├── /                       landing + sign-in             │
│   ├── /bracket                bracket entry / view          │
│   ├── /daily                  today's bonus picks           │
│   ├── /leaderboard            global + league filters       │
│   ├── /league/[code]          mini-league view              │
│   ├── /me                     my picks + score              │
│   ├── /og/[userId]            dynamic OG image (edge)       │
│   └── /api/trpc/...           tRPC adapter (optional)       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼ HTTP
┌─────────────────────────────────────────────────────────────┐
│  apps/api — NestJS on Fastify                               │
│   ├── auth                    Clerk JWT guard               │
│   ├── tournaments             read-only fixtures/teams      │
│   ├── picks                   create/update with lock check │
│   ├── leagues                 create/join/leave             │
│   ├── leaderboards            cached top N + my-rank        │
│   └── webhooks                provider callbacks            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼ Drizzle
┌─────────────────────────────────────────────────────────────┐
│  Postgres                                                   │
│   schema: soccerx                                           │
│   ├── users, leagues, league_members                        │
│   ├── tournaments, teams, matches                           │
│   ├── picks (bracket + daily)                               │
│   ├── score_events (immutable ledger of points)             │
│   └── leaderboard_cache (materialised view, refreshed)      │
└──────────────────────▲──────────────────────────────────────┘
                       │
                       │ write score events
┌─────────────────────────────────────────────────────────────┐
│  workers/scoring (BullMQ)                                   │
│   ├── ingest-results-cron     every 5 min during matches    │
│   ├── score-match              idempotent on (user, match)  │
│   ├── refresh-leaderboards     every 1 min during matches   │
│   └── generate-archetypes      once, post group-stage lock  │
└─────────────────────────────────────────────────────────────┘
       ▲                          ▲
       │                          │
       │                          └── Redis (BullMQ)
       │
   Football data API
   (api-football / football-data.org / sportmonks — TBD)
```

## 7. Data Model (Drizzle, Postgres)

### Core tables

```ts
// users
{ id, clerkUserId, handle, country, archetype, createdAt }

// tournaments — extensible for AFCON, future
{ id, slug, name, startsAt, endsAt, format: 'wc2026' | 'afcon2027' | ... }

// teams
{ id, tournamentId, name, code (3-letter), flagEmoji, groupId }

// groups
{ id, tournamentId, letter ('A'..'L') }

// matches
{ id, tournamentId, stage, homeTeamId, awayTeamId,
  kickoffAt, venueId, homeScore, awayScore, status,
  externalRef (provider match id) }

// picks — covers bracket + daily
{ id, userId, tournamentId, pickType: 'group_winner' | 'group_runner_up' |
  'best_third' | 'r32' | 'r16' | 'qf' | 'sf' | 'final' | 'champion' |
  'daily_first_scorer' | 'daily_over_under' | ...,
  matchId (nullable), teamId (nullable),
  scalarValue (nullable, for over/under, goals, etc.),
  createdAt, lockedAt }

// score_events — immutable ledger
{ id, userId, tournamentId, pickId, matchId,
  points, reason, createdAt }

// leagues
{ id, ownerUserId, name, code (8-char), createdAt }

// league_members
{ leagueId, userId, joinedAt }

// leaderboard_cache — refreshed by worker
{ scope ('global' | 'country:GH' | 'league:abc'), userId,
  totalPoints, rank, lastRefreshed }
```

### Why a score_events ledger?

Same reason payments systems use double-entry: an immutable, append-only record of every point awarded makes scoring **idempotent**, **debuggable**, and **explainable**. Total score = `SUM(points) WHERE user_id = ? AND tournament_id = ?`. If we re-process a match (provider correction, red card overturn), we append reversing events; we never mutate history.

## 8. Live Scoring Flow

1. Cron-driven `ingest-results-cron` (every 5 min while any match is live or recently finished) pulls match status from the football data API
2. For each finished match not yet scored, enqueue a `score-match` job
3. `score-match` worker:
   - Loads the match result
   - Loads every pick that references this match (group, knockout, daily)
   - For each pick, computes points and inserts an immutable `score_events` row
   - Idempotent: insert only if no event exists for `(user_id, match_id, pick_id)`
4. `refresh-leaderboards` runs every 1 min while matches are live — UPSERTs into `leaderboard_cache`
5. Next.js dashboard reads `leaderboard_cache` (sub-100ms), shows updated standings

## 9. Tech stack — fixed

| Layer | Choice |
|---|---|
| Monorepo | Turborepo + pnpm 9.x |
| Web | Next.js 15 (App Router), React 19, TypeScript, Tailwind, Tremor |
| API | NestJS on Fastify, TypeScript, Zod |
| ORM | Drizzle (Postgres) |
| Queue | BullMQ on Redis |
| Auth | Clerk (with guest fallback to be decided) |
| Validation | Zod (shared via packages/types) |
| Env | `packages/config/env.ts` (Zod-validated across all services) |
| OG images | `@vercel/og` (edge runtime) |
| Football data | TBD — api-football.com leading candidate |
| Hosting | Railway (Railpack for web; Dockerfile per service for api & worker) |
| Observability | OpenTelemetry → Grafana Cloud (defer to v2 if needed) |

## 10. Repo Layout

```
soccerX/
├── package.json                 # root, pnpm workspaces + turbo
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── .gitignore
├── .env.example
├── README.md
├── docs/
│   ├── PROJECT.md               # this file
│   ├── DECISIONS.md             # log of key technical decisions
│   └── definitions.md           # what counts as "downtime", "win", etc.
├── apps/
│   ├── web/                     # Next.js 15
│   └── api/                     # NestJS on Fastify
├── workers/
│   └── scoring/                 # BullMQ worker
└── packages/
    ├── db/                      # Drizzle schema + migrations
    ├── types/                   # shared Zod schemas + TS types
    ├── config/                  # env validation
    └── ui/                      # shared React primitives
```

## 11. Build Phases (suggested)

### Phase 0 — Foundations (day 1, today)
- Monorepo scaffolded ✅
- Drizzle schema in place
- Env validation working
- Next.js + NestJS shells boot

### Phase 1 — Bracket + auth (day 2–3)
- Clerk integration
- WC2026 fixtures seeded
- Bracket UI (group entry, best-3rd picker, knockout fill)
- Picks API with lock semantics

### Phase 2 — Live scoring (day 3–4)
- Football API integration
- Scoring worker
- Leaderboard cache + refresh job

### Phase 3 — Social (day 4–5)
- Mini-leagues (create / join via 8-char code)
- League leaderboard view
- OG image endpoint
- Share buttons (WhatsApp / X / Instagram)

### Phase 4 — Daily picks (day 5–6)
- Daily question UI
- Lock at kickoff
- Score on settlement

### Phase 5 — Polish (during tournament)
- Personality archetypes
- AI commentary
- Champion's Path animation
- Bug-fixing as users report

## 12. Open Decisions

| # | Decision | Status |
|---|---|---|
| 1 | Football data API provider | OPEN |
| 2 | Clerk vs guest magic-link for v1 | OPEN |
| 3 | Production hosting target | Leaning Railway |
| 4 | Domain + brand confirmation | OPEN |
| 5 | Mini-league size cap | Leaning 50 |
| 6 | Public/private toggle on leagues | Leaning private-only for v1 |
| 7 | Tie-breaker rule for identical scores | OPEN (suggest: earliest joined wins) |
| 8 | Free vs paid model | OPEN (suggest: free v1, premium leagues v2) |

## 13. UX Principles

- **Mobile-first.** 80%+ of users will be on phone. Test on iPhone SE width first.
- **One screen, one task.** Never put bracket entry, leaderboard, and daily picks on the same screen.
- **Instant feedback.** Every interaction (pick saved, league joined, score updated) shows confirmation in <300ms.
- **Speed > beauty.** Time-to-interactive matters more than animations. Tremor + plain Tailwind first; animations only where they earn it.
- **Share-ready by default.** Every meaningful moment (picks complete, score updated, league joined) has a shareable surface.
- **No dark patterns.** No engagement-maximising notification spam. Daily picks have one notification, sent once.

## 14. Risk Register

| Risk | Mitigation |
|---|---|
| Football data API rate limits | Cache aggressively in Redis; one server-side fetch, broadcast via tRPC subs / SSE |
| Scoring bug after match starts | Score events are immutable + reversible; emergency `recompute-match` admin endpoint |
| Spike on opening match | Pre-render bracket; serve leaderboard from cache; CDN-cache static assets |
| Provider gives wrong score, corrects later | Append reversing events; never mutate; show audit trail in admin |
| Users discover bracket lock loophole | Server-side lock check, never trust client clock |
| GDPR / data localisation | Postgres in EU (or Ghana if local hosting found); minimal PII collected |

## 15. Glossary

- **Pick** — a user's prediction (bracket position, scoreline, daily answer)
- **Lock** — the moment a pick can no longer be edited (kickoff-driven)
- **Score event** — an immutable points-awarded record
- **Mini-league** — a user-created group with shared leaderboard
- **Archetype** — fun personality label assigned from pick patterns (v1.5)
- **Power-up** — single-use scoring boost (v2)
