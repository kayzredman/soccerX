# Decisions Log

Append-only record of significant technical and product decisions. Each entry: date, decision, alternatives considered, why.

---

## 2026-06-10 — Monorepo with Turborepo + pnpm

- **Decision:** Single Turborepo monorepo with apps/, workers/, packages/.
- **Alternatives:** Polyrepo (one repo per service); Nx.
- **Why:** Matches Lotris & TrendX patterns; same team, same deploy story (Railway). Zero new tooling.

## 2026-06-10 — Postgres + Drizzle (single DB, schema-scoped)

- **Decision:** PostgreSQL, Drizzle ORM. All SoccerX tables in `soccerx` schema.
- **Alternatives:** Prisma; MongoDB; planetscale-style MySQL.
- **Why:** Same as Lotris/TrendX. Strong consistency matters for picks & score events. Drizzle = least magic.

## 2026-06-10 — Score events as immutable ledger

- **Decision:** Points are never mutated. Each scoring action inserts a `score_events` row. Total = SUM.
- **Alternatives:** Mutable `user_scores` row updated in place.
- **Why:** Idempotency, debuggability, easy correction (append reversing event), audit trail.

## 2026-06-10 — BullMQ worker for live scoring (NOT in-API)

- **Decision:** Match-result ingestion + scoring runs in a separate worker process.
- **Alternatives:** Inline in the NestJS API; serverless cron.
- **Why:** API stays response-time bound. Worker can be scaled independently. Mirrors Lotris pattern.

## 2026-06-10 — Lock semantics enforced server-side

- **Decision:** A pick's `lockedAt` is set by the API at write time based on match.kickoffAt. Client clock is never trusted.
- **Alternatives:** Client-side lock + best-effort server check.
- **Why:** Cheating prevention; correctness over UX shortcuts.

## 2026-06-10 — Football data API: api-football.com

- **Decision:** api-football.com (RapidAPI v3) for fixtures, live scores, events.
- **Alternatives:** football-data.org (rate-limited free tier, no events), sportmonks (paid).
- **Why:** Free tier (100 req/day) is enough for v1 with 5-min polling + Redis caching. Has WC2026 + AFCON. Single adapter behind `packages/integrations/football` if we swap later.

## 2026-06-10 — Auth: email magic-link only (no Clerk for v1)

- **Decision:** Self-rolled magic-link auth. JWT (jose, HS256) in httpOnly cookie + Authorization header. Resend for delivery.
- **Alternatives:** Clerk (matches Lotris/TrendX), Auth.js, anonymous + claim-later.
- **Why:** Zero account-creation friction during a live tournament. Removes a half-day integration and an $25/mo dependency we don't need. Clerk upgrade path stays open via `users.clerkUserId` column.

## 2026-06-10 — v1 scope cut: groups-only bracket at launch

- **Decision:** v1 ships with group_winner + group_runner_up picks only. Knockout picks (best_third, r32, r16, qf, sf, final, champion) ship as a second wave before group stage ends (June 27).
- **Alternatives:** Delay launch by 1–2 days to ship full bracket.
- **Why:** WC2026 kicks off June 11. Cutting knockout UI removes ~60% of v1 surface and lets us launch day-of-tournament. Knockouts unlock progressively in the real tournament anyway, so this maps to user expectation.

## OPEN — Hosting target for v1

- Candidates: Railway (matches our other projects), Vercel + Railway split, fly.io.
- Leaning: Railway monorepo (see `~/.../memories/railway-monorepo.md` for known gotchas).
