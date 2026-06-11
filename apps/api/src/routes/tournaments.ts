import type { FastifyInstance } from "fastify";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "../db";

const { tournaments, groups, teams, matches } = schema;

async function getBySlug(slug: string) {
  const [t] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.slug, slug))
    .limit(1);
  return t ?? null;
}

export async function tournamentRoutes(app: FastifyInstance) {
  app.get<{ Params: { slug: string } }>("/tournaments/:slug", async (req, reply) => {
    const t = await getBySlug(req.params.slug);
    if (!t) return reply.code(404).send({ error: "Not found" });
    return t;
  });

  app.get<{ Params: { slug: string } }>(
    "/tournaments/:slug/groups",
    async (req, reply) => {
      const t = await getBySlug(req.params.slug);
      if (!t) return reply.code(404).send({ error: "Not found" });

      const rows = await db
        .select({
          groupId: groups.id,
          letter: groups.letter,
          teamId: teams.id,
          teamName: teams.name,
          teamCode: teams.code,
          teamFlag: teams.flagEmoji,
        })
        .from(groups)
        .leftJoin(teams, eq(teams.groupId, groups.id))
        .where(eq(groups.tournamentId, t.id))
        .orderBy(asc(groups.letter), asc(teams.name));

      const byLetter = new Map<
        string,
        {
          id: string;
          letter: string;
          teams: { id: string; name: string; code: string; flag: string | null }[];
        }
      >();

      for (const row of rows) {
        let entry = byLetter.get(row.letter);
        if (!entry) {
          entry = { id: row.groupId, letter: row.letter, teams: [] };
          byLetter.set(row.letter, entry);
        }
        if (row.teamId && row.teamName && row.teamCode) {
          entry.teams.push({
            id: row.teamId,
            name: row.teamName,
            code: row.teamCode,
            flag: row.teamFlag,
          });
        }
      }

      return {
        groups: Array.from(byLetter.values()).sort((a, b) =>
          a.letter.localeCompare(b.letter),
        ),
      };
    },
  );

  app.get<{ Params: { slug: string } }>(
    "/tournaments/:slug/matches",
    async (req, reply) => {
      const t = await getBySlug(req.params.slug);
      if (!t) return reply.code(404).send({ error: "Not found" });

      const rows = await db
        .select()
        .from(matches)
        .where(eq(matches.tournamentId, t.id))
        .orderBy(asc(matches.kickoffAt));

      return { matches: rows };
    },
  );
}
