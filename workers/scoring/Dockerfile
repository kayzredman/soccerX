# Dockerfile for @soccerx/scoring worker (BullMQ live-sim + scoring loop, run via tsx).
# Build context = monorepo root.
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/config/package.json packages/config/
COPY packages/db/package.json packages/db/
COPY packages/types/package.json packages/types/
COPY packages/ui/package.json packages/ui/
COPY workers/scoring/package.json workers/scoring/
RUN pnpm install --frozen-lockfile --prod --filter @soccerx/scoring...

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/config/node_modules packages/config/node_modules
COPY --from=deps /app/packages/db/node_modules packages/db/node_modules
COPY --from=deps /app/packages/types/node_modules packages/types/node_modules
COPY --from=deps /app/workers/scoring/node_modules workers/scoring/node_modules
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/config packages/config
COPY packages/db packages/db
COPY packages/types packages/types
COPY workers/scoring workers/scoring

WORKDIR /app/workers/scoring
CMD ["node_modules/.bin/tsx", "src/index.ts"]
