import type { FastifyInstance } from "fastify";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "../db";

const { tournaments, users, scoreEvents, leaderboardCache } = schema;

async function getBySlug(slug: string) {
  const [t] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.slug, slug))
    .limit(1);
  return t ?? null;
}

export async function leaderboardRoutes(app: FastifyInstance) {
  app.get<{
    Params: { slug: string };
    Querystring: { limit?: string };
  }>("/tournaments/:slug/leaderboard", async (req, reply) => {
    const t = await getBySlug(req.params.slug);
    if (!t) return reply.code(404).send({ error: "Not found" });

    const limit = Math.min(
      Math.max(parseInt(req.query.limit ?? "50", 10) || 50, 1),
      500,
    );

    // Prefer cached rows; fall back to a live SUM if the cache is empty.
    const cached = await db
      .select({
        rank: leaderboardCache.rank,
        userId: leaderboardCache.userId,
        handle: users.handle,
        name: users.name,
        image: users.image,
        country: users.country,
        totalPoints: leaderboardCache.totalPoints,
      })
      .from(leaderboardCache)
      .innerJoin(users, eq(users.id, leaderboardCache.userId))
      .where(
        and(
          eq(leaderboardCache.scope, "global"),
          eq(leaderboardCache.tournamentId, t.id),
        ),
      )
      .orderBy(asc(leaderboardCache.rank))
      .limit(limit);

    if (cached.length > 0) {
      return { source: "cache", rows: cached };
    }

    const live = await db
      .select({
        userId: scoreEvents.userId,
        handle: users.handle,
        name: users.name,
        image: users.image,
        country: users.country,
        totalPoints: sql<number>`COALESCE(SUM(${scoreEvents.points}), 0)::int`,
      })
      .from(scoreEvents)
      .innerJoin(users, eq(users.id, scoreEvents.userId))
      .where(eq(scoreEvents.tournamentId, t.id))
      .groupBy(
        scoreEvents.userId,
        users.handle,
        users.name,
        users.image,
        users.country,
      )
      .orderBy(desc(sql`COALESCE(SUM(${scoreEvents.points}), 0)`))
      .limit(limit);

    return {
      source: "live",
      rows: live.map((r, i) => ({ rank: i + 1, ...r })),
    };
  });
}
