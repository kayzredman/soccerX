// Dev-only: enqueue a score-match job for every FINISHED match in a tournament.
// Usage: pnpm --filter @soccerx/scoring tsx scripts/score-all.ts [tournamentSlug]
import "reflect-metadata";
import { Queue, type ConnectionOptions } from "bullmq";
import { eq } from "drizzle-orm";
import { getEnv } from "@soccerx/config";
import { getDb, tournaments, matches } from "@soccerx/db";

async function main() {
  const slug = process.argv[2] ?? "wc2026";
  const env = getEnv();
  const db = getDb(env.DATABASE_URL);
  const connection: ConnectionOptions = {
    url: env.REDIS_URL,
    maxRetriesPerRequest: null,
  };

  const [t] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.slug, slug));
  if (!t) throw new Error(`Tournament ${slug} not found`);

  const finished = await db
    .select({ id: matches.id })
    .from(matches)
    .where(eq(matches.tournamentId, t.id));

  const q = new Queue("scoring-score-match", { connection });
  let enq = 0;
  for (const m of finished) {
    await q.add(
      "score",
      { matchId: m.id },
      { removeOnComplete: true, removeOnFail: false, attempts: 3 },
    );
    enq++;
  }
  console.log(`Enqueued ${enq} score-match jobs for ${slug}`);
  await q.close();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
