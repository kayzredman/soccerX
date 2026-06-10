import "reflect-metadata";
import IORedis from "ioredis";
import { Queue, Worker } from "bullmq";
import { getEnv } from "@soccerx/config";

const env = getEnv();
const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });

// Queues
export const ingestQueue = new Queue("scoring:ingest-results", { connection });
export const scoreMatchQueue = new Queue("scoring:score-match", { connection });
export const leaderboardQueue = new Queue("scoring:refresh-leaderboards", {
  connection,
});

// Repeatable: pull results every N ms
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

// Workers (stubs — implement in Phase 2)
new Worker(
  "scoring:ingest-results",
  async () => {
    // TODO: pull matches from football data API; for finished+unscored matches,
    // enqueue scoring:score-match jobs.
    // eslint-disable-next-line no-console
    console.log("[scoring] ingest tick");
  },
  { connection },
);

new Worker(
  "scoring:score-match",
  async (job) => {
    // TODO: load match + picks; insert idempotent score_events rows.
    // eslint-disable-next-line no-console
    console.log("[scoring] score-match", job.data);
  },
  { connection, concurrency: 4 },
);

new Worker(
  "scoring:refresh-leaderboards",
  async () => {
    // TODO: recompute leaderboard_cache for active tournaments.
    // eslint-disable-next-line no-console
    console.log("[scoring] refresh-leaderboards tick");
  },
  { connection },
);

// eslint-disable-next-line no-console
console.log("[scoring] worker up");
