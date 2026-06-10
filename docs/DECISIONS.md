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

## OPEN — Football data API provider
- Candidates: api-football.com, football-data.org, sportmonks.com.
- Need: WC2026 fixtures + live scores + goal events. Free or low-cost tier sufficient for v1.
- Action: evaluate before Phase 2.

## OPEN — Auth provider for v1
- Candidates: Clerk (matches Lotris/TrendX), guest magic-link via email-only, anonymous + claim-later.
- Tension: Friction kills viral adoption during a live tournament. But persistent identity = real leaderboards.
- Leaning: Magic-link with optional Clerk upgrade.

## OPEN — Hosting target for v1
- Candidates: Railway (matches our other projects), Vercel + Railway split, fly.io.
- Leaning: Railway monorepo (see `~/.../memories/railway-monorepo.md` for known gotchas).
