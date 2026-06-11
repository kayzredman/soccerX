import type { FastifyInstance } from "fastify";
import { and, desc, eq, sql } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { db, schema } from "../db";
import { requireSession } from "../auth";

const { leagues, leagueMembers, users, scoreEvents } = schema;

const codeAlphabet = customAlphabet("ABCDEFGHJKMNPQRSTUVWXYZ23456789", 8);

const CreateBody = z.object({ name: z.string().min(2).max(40) });
const JoinBody = z.object({ code: z.string().length(8) });

export async function leaguesRoutes(app: FastifyInstance) {
  app.post("/leagues", async (req, reply) => {
    const session = await requireSession(req, reply);
    if (!session) return;

    const parsed = CreateBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid body" });
    }

    let code = codeAlphabet();
    for (let i = 0; i < 3; i++) {
      const [exists] = await db
        .select({ id: leagues.id })
        .from(leagues)
        .where(eq(leagues.code, code))
        .limit(1);
      if (!exists) break;
      code = codeAlphabet();
    }

    const league = await db.transaction(async (tx) => {
      const [l] = await tx
        .insert(leagues)
        .values({ ownerUserId: session.sub, name: parsed.data.name.trim(), code })
        .returning();
      if (!l) throw new Error("Failed to create league");
      await tx
        .insert(leagueMembers)
        .values({ leagueId: l.id, userId: session.sub });
      return l;
    });

    return { league };
  });

  app.post("/leagues/join", async (req, reply) => {
    const session = await requireSession(req, reply);
    if (!session) return;

    const parsed = JoinBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid body" });
    }

    const code = parsed.data.code.trim().toUpperCase();
    const [league] = await db
      .select()
      .from(leagues)
      .where(eq(leagues.code, code))
      .limit(1);
    if (!league) return reply.code(404).send({ error: "League not found" });

    const [existing] = await db
      .select()
      .from(leagueMembers)
      .where(
        and(
          eq(leagueMembers.leagueId, league.id),
          eq(leagueMembers.userId, session.sub),
        ),
      )
      .limit(1);
    if (existing) return reply.code(409).send({ error: "Already a member" });

    await db
      .insert(leagueMembers)
      .values({ leagueId: league.id, userId: session.sub });

    return { league };
  });

  app.get("/leagues/mine", async (req, reply) => {
    const session = await requireSession(req, reply);
    if (!session) return;

    const rows = await db
      .select({
        id: leagues.id,
        name: leagues.name,
        code: leagues.code,
        joinedAt: leagueMembers.joinedAt,
      })
      .from(leagueMembers)
      .innerJoin(leagues, eq(leagues.id, leagueMembers.leagueId))
      .where(eq(leagueMembers.userId, session.sub))
      .orderBy(desc(leagueMembers.joinedAt));

    return { leagues: rows };
  });

  app.get<{
    Params: { code: string };
    Querystring: { tournament?: string };
  }>("/leagues/:code/leaderboard", async (req, reply) => {
    const code = req.params.code.toUpperCase();
    const [league] = await db
      .select()
      .from(leagues)
      .where(eq(leagues.code, code))
      .limit(1);
    if (!league) return reply.code(404).send({ error: "League not found" });

    const tournamentSlug = req.query.tournament;
    if (!tournamentSlug) {
      return reply.code(400).send({ error: "tournament query required" });
    }

    const [t] = await db
      .select()
      .from(schema.tournaments)
      .where(eq(schema.tournaments.slug, tournamentSlug))
      .limit(1);
    if (!t) return reply.code(404).send({ error: "Tournament not found" });

    const rows = await db
      .select({
        userId: users.id,
        handle: users.handle,
        totalPoints: sql<number>`COALESCE(SUM(${scoreEvents.points}), 0)::int`,
      })
      .from(leagueMembers)
      .innerJoin(users, eq(users.id, leagueMembers.userId))
      .leftJoin(
        scoreEvents,
        and(
          eq(scoreEvents.userId, users.id),
          eq(scoreEvents.tournamentId, t.id),
        ),
      )
      .where(eq(leagueMembers.leagueId, league.id))
      .groupBy(users.id, users.handle)
      .orderBy(desc(sql`COALESCE(SUM(${scoreEvents.points}), 0)`));

    return {
      leaderboard: rows.map((r, i) => ({ rank: i + 1, ...r })),
    };
  });
}
