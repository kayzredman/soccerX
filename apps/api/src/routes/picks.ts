import type { FastifyInstance } from "fastify";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db";
import { requireSession } from "../auth";

const { tournaments, groups, teams, picks } = schema;

const GroupPickItem = z.object({
  groupId: z.string().uuid(),
  pickType: z.enum(["group_winner", "group_runner_up"]),
  teamId: z.string().uuid(),
});
const GroupPicksBody = z.object({
  picks: z.array(GroupPickItem).max(24),
});

async function getTournamentBySlug(slug: string) {
  const [t] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.slug, slug))
    .limit(1);
  return t ?? null;
}

export async function picksRoutes(app: FastifyInstance) {
  app.get<{ Params: { slug: string } }>(
    "/tournaments/:slug/picks/groups",
    async (req, reply) => {
      const session = await requireSession(req, reply);
      if (!session) return;

      const t = await getTournamentBySlug(req.params.slug);
      if (!t) return reply.code(404).send({ error: "Tournament not found" });

      const rows = await db
        .select({
          id: picks.id,
          pickType: picks.pickType,
          teamId: picks.teamId,
          groupId: teams.groupId,
          lockedAt: picks.lockedAt,
        })
        .from(picks)
        .leftJoin(teams, eq(teams.id, picks.teamId))
        .where(
          and(
            eq(picks.userId, session.sub),
            eq(picks.tournamentId, t.id),
            inArray(picks.pickType, ["group_winner", "group_runner_up"]),
          ),
        );

      return { picks: rows };
    },
  );

  app.post<{ Params: { slug: string } }>(
    "/tournaments/:slug/picks/groups",
    async (req, reply) => {
      const session = await requireSession(req, reply);
      if (!session) return;

      const parsed = GroupPicksBody.safeParse(req.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ error: "Invalid body", issues: parsed.error.issues });
      }

      const t = await getTournamentBySlug(req.params.slug);
      if (!t) return reply.code(404).send({ error: "Tournament not found" });

      const now = new Date();
      if (now >= t.bracketLockAt) {
        return reply.code(403).send({ error: "Bracket is locked" });
      }

      const inputs = parsed.data.picks;
      const groupIds = Array.from(new Set(inputs.map((p) => p.groupId)));
      const teamIds = Array.from(new Set(inputs.map((p) => p.teamId)));

      if (inputs.length > 0) {
        const validTeams = await db
          .select({ id: teams.id, groupId: teams.groupId })
          .from(teams)
          .where(and(eq(teams.tournamentId, t.id), inArray(teams.id, teamIds)));
        const teamGroup = new Map(validTeams.map((r) => [r.id, r.groupId]));

        const validGroups = await db
          .select({ id: groups.id })
          .from(groups)
          .where(
            and(eq(groups.tournamentId, t.id), inArray(groups.id, groupIds)),
          );
        const validGroupIds = new Set(validGroups.map((g) => g.id));

        for (const p of inputs) {
          if (!validGroupIds.has(p.groupId)) {
            return reply.code(400).send({ error: `Invalid group ${p.groupId}` });
          }
          if (teamGroup.get(p.teamId) !== p.groupId) {
            return reply
              .code(400)
              .send({ error: `Team ${p.teamId} not in group ${p.groupId}` });
          }
        }
      }

      const saved = await db.transaction(async (tx) => {
        await tx
          .delete(picks)
          .where(
            and(
              eq(picks.userId, session.sub),
              eq(picks.tournamentId, t.id),
              inArray(picks.pickType, ["group_winner", "group_runner_up"]),
            ),
          );
        if (inputs.length === 0) return [];
        return await tx
          .insert(picks)
          .values(
            inputs.map((p) => ({
              userId: session.sub,
              tournamentId: t.id,
              pickType: p.pickType,
              teamId: p.teamId,
              lockedAt: t.bracketLockAt,
            })),
          )
          .returning();
      });

      return { count: saved.length, picks: saved };
    },
  );
}
