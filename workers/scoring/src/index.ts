import "reflect-metadata";
import { Queue, Worker, type ConnectionOptions } from "bullmq";
import { and, eq, lt } from "drizzle-orm";
import * as schema from "@soccerx/db";
import { getEnv } from "@soccerx/config";
import { getDb } from "@soccerx/db";

const env = getEnv();
// Pass URL string to BullMQ so it instantiates its own pinned ioredis,
// avoiding type drift when our top-level ioredis floats ahead of BullMQ's.
const connection: ConnectionOptions = {
  url: env.REDIS_URL,
  maxRetriesPerRequest: null,
};
const db = getDb(env.DATABASE_URL);

const { matches } = schema;

// Queues — BullMQ 5 disallows ':' in names; use '-' as namespace separator
export const ingestQueue = new Queue("scoring-ingest-results", { connection });
export const scoreMatchQueue = new Queue("scoring-score-match", { connection });
export const leaderboardQueue = new Queue("scoring-refresh-leaderboards", {
  connection,
});
export const liveSimQueue = new Queue("scoring-live-sim", { connection });

ingestQueue.add(
  "tick",
  {},
  {
    repeat: { every: env.SCORING_POLL_INTERVAL_MS },
    removeOnComplete: true,
    removeOnFail: true,
  },
);

leaderboardQueue.add(
  "tick",
  {},
  {
    repeat: { every: env.LEADERBOARD_REFRESH_INTERVAL_MS },
    removeOnComplete: true,
    removeOnFail: true,
  },
);

if (env.LIVE_SIM_TICK_MS > 0) {
  liveSimQueue.add(
    "tick",
    {},
    {
      repeat: { every: env.LIVE_SIM_TICK_MS },
      removeOnComplete: true,
      removeOnFail: true,
    },
  );
}

// ---- Live simulator -----------------------------------------------------
// Dev-only: walks every LIVE match through a synthetic 90' clock,
// occasionally adds goals, and marks FINISHED at full-time. The API SSE
// stream notices the DB mutations and pushes a pulse to clients.

new Worker(
  "scoring-live-sim",
  async () => {
    const liveRows = await db
      .select()
      .from(matches)
      .where(eq(matches.status, "LIVE"));

    if (liveRows.length === 0) return;

    const now = Date.now();
    for (const m of liveRows) {
      const kickoffMs = m.kickoffAt.getTime();
      // simulated minute since kickoff, capped at 95'
      const realElapsedMin = Math.floor((now - kickoffMs) / 60_000);
      const matchMinute = Math.min(95, Math.max(0, realElapsedMin));

      // Finish a match after the 90' mark (+ stoppage)
      if (matchMinute >= 92) {
        await db
          .update(matches)
          .set({ status: "FINISHED", settledAt: new Date() })
          .where(eq(matches.id, m.id));
        // eslint-disable-next-line no-console
        console.log(
          `[live-sim] FT match=${m.id} ${m.homeScore}-${m.awayScore}`,
        );
        continue;
      }

      // Goal chance: ~1/14 per tick when game is in play
      const roll = Math.random();
      if (roll < 1 / 14) {
        const scoreHome = Math.random() < 0.5;
        const newHome = (m.homeScore ?? 0) + (scoreHome ? 1 : 0);
        const newAway = (m.awayScore ?? 0) + (scoreHome ? 0 : 1);
        await db
          .update(matches)
          .set({ homeScore: newHome, awayScore: newAway })
          .where(eq(matches.id, m.id));
        // eslint-disable-next-line no-console
        console.log(
          `[live-sim] GOAL match=${m.id} ${newHome}-${newAway} @${matchMinute}'`,
        );
      }
    }

    // Optional: auto-promote earliest SCHEDULED past kickoff → LIVE so
    // demo never runs out of action. Cap total live to keep it sane.
    const liveCount = await db
      .select({ id: matches.id })
      .from(matches)
      .where(eq(matches.status, "LIVE"));
    if (liveCount.length < 2) {
      const dueRows = await db
        .select()
        .from(matches)
        .where(
          and(
            eq(matches.status, "SCHEDULED"),
            lt(matches.kickoffAt, new Date()),
          ),
        )
        .limit(1);
      const due = dueRows[0];
      if (due) {
        await db
          .update(matches)
          .set({ status: "LIVE", homeScore: 0, awayScore: 0 })
          .where(eq(matches.id, due.id));
        // eslint-disable-next-line no-console
        console.log(`[live-sim] KICKOFF match=${due.id}`);
      }
    }
  },
  { connection },
);

// ---- Original stubs -----------------------------------------------------
new Worker(
  "scoring-ingest-results",
  async () => {
    // TODO: pull matches from football data API
    // eslint-disable-next-line no-console
    console.log("[scoring] ingest tick");
  },
  { connection },
);

new Worker(
  "scoring-score-match",
  async (job) => {
    // TODO: load match + picks; insert idempotent score_events rows.
    // eslint-disable-next-line no-console
    console.log("[scoring] score-match", job.data);
  },
  { connection, concurrency: 4 },
);

new Worker(
  "scoring-refresh-leaderboards",
  async () => {
    // TODO: recompute leaderboard_cache for active tournaments.
    // eslint-disable-next-line no-console
    console.log("[scoring] refresh-leaderboards tick");
  },
  { connection },
);

// eslint-disable-next-line no-console
console.log(
  `[scoring] worker up · live-sim every ${env.LIVE_SIM_TICK_MS}ms (0 = off)`,
);
