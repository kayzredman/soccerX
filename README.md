# SoccerX

> A 39-day daily-return social game built around the 2026 FIFA World Cup.
> Working title. Not a static bracket — a live-scoring, mini-league, daily-pick companion to the tournament.

Full design: [`docs/PROJECT.md`](./docs/PROJECT.md).

## Tech

- Turborepo + pnpm 9
- Next.js 15 (App Router) — `apps/web`
- NestJS on Fastify — `apps/api`
- BullMQ scoring worker — `workers/scoring`
- PostgreSQL + Drizzle — `packages/db`
- Zod-validated shared env — `packages/config`
- Shared types — `packages/types`
- Shared UI primitives — `packages/ui`

## Quick start

```bash
# 1. Install deps
pnpm install

# 2. Copy env
cp .env.example .env

# 3. Bring up Postgres + Redis (your way — docker, brew, etc.)
#    Default DSNs assume localhost.

# 4. Generate + run DB migrations
pnpm db:generate
pnpm db:migrate

# 5. Run everything
pnpm dev
```

| Service | Port |
|---|---|
| web    | 3000 |
| api    | 4000 |
| worker | n/a (daemon) |

## Repo

```
apps/
  web/        Next.js 15 App Router, Tailwind, Tremor
  api/        NestJS on Fastify
workers/
  scoring/    BullMQ live-scoring worker
packages/
  db/         Drizzle schema + migrations
  types/      Shared Zod schemas + TS types
  config/     Shared env validation
  ui/         Shared React primitives
docs/
  PROJECT.md  Full design doc
```

## License

Private — not for distribution.
