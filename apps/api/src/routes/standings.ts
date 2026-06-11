import type { FastifyInstance } from "fastify";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "../db";

const { tournaments, groups, teams, matches } = schema;

type Row = {
  teamId: string;
  teamName: string;
  teamCode: string;
  teamFlag: string | null;
  mp: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
  form: ("W" | "D" | "L")[];
};

type GroupBlock = {
  id: string;
  letter: string;
  rows: Row[];
  /** Next scheduled fixture in this group, if any */
  next: {
    homeCode: string;
    homeFlag: string | null;
    awayCode: string;
    awayFlag: string | null;
    kickoffAt: string;
  } | null;
  hasLive: boolean;
};

async function getTournamentBySlug(slug: string) {
  const [t] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.slug, slug))
    .limit(1);
  return t ?? null;
}

async function buildStandings(
  tournamentId: string,
  letterFilter?: string,
): Promise<GroupBlock[]> {
  // load groups + teams
  const groupRows = await db
    .select()
    .from(groups)
    .where(eq(groups.tournamentId, tournamentId))
    .orderBy(asc(groups.letter));

  const filteredGroups = letterFilter
    ? groupRows.filter((g) => g.letter === letterFilter)
    : groupRows;

  if (filteredGroups.length === 0) return [];

  const teamRows = await db
    .select()
    .from(teams)
    .where(eq(teams.tournamentId, tournamentId));
  const teamById = new Map(teamRows.map((t) => [t.id, t]));
  const teamsByGroup = new Map<string, typeof teamRows>();
  for (const t of teamRows) {
    if (!t.groupId) continue;
    const arr = teamsByGroup.get(t.groupId) ?? [];
    arr.push(t);
    teamsByGroup.set(t.groupId, arr);
  }

  // load matches for this tournament (cheap — 72 group-stage)
  const matchRows = await db
    .select()
    .from(matches)
    .where(eq(matches.tournamentId, tournamentId))
    .orderBy(asc(matches.kickoffAt));

  const matchesByGroup = new Map<string, typeof matchRows>();
  for (const m of matchRows) {
    if (!m.groupId) continue;
    const arr = matchesByGroup.get(m.groupId) ?? [];
    arr.push(m);
    matchesByGroup.set(m.groupId, arr);
  }

  const blocks: GroupBlock[] = [];

  for (const g of filteredGroups) {
    const groupTeams = teamsByGroup.get(g.id) ?? [];
    const groupMatches = matchesByGroup.get(g.id) ?? [];

    // init standings rows for every team
    const rowsById = new Map<string, Row>();
    for (const t of groupTeams) {
      rowsById.set(t.id, {
        teamId: t.id,
        teamName: t.name,
        teamCode: t.code,
        teamFlag: t.flagEmoji ?? null,
        mp: 0,
        w: 0,
        d: 0,
        l: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        pts: 0,
        form: [],
      });
    }

    let hasLive = false;
    let next: GroupBlock["next"] = null;

    for (const m of groupMatches) {
      if (!m.homeTeamId || !m.awayTeamId) continue;
      const home = rowsById.get(m.homeTeamId);
      const away = rowsById.get(m.awayTeamId);
      if (!home || !away) continue;

      if (m.status === "LIVE") hasLive = true;

      // Apply GF/GA for any match with a known score (LIVE or FINISHED)
      if (m.homeScore != null && m.awayScore != null) {
        home.gf += m.homeScore;
        home.ga += m.awayScore;
        away.gf += m.awayScore;
        away.ga += m.homeScore;

        if (m.status === "FINISHED") {
          home.mp += 1;
          away.mp += 1;
          if (m.homeScore > m.awayScore) {
            home.w += 1; home.pts += 3; home.form.push("W");
            away.l += 1; away.form.push("L");
          } else if (m.homeScore < m.awayScore) {
            away.w += 1; away.pts += 3; away.form.push("W");
            home.l += 1; home.form.push("L");
          } else {
            home.d += 1; home.pts += 1; home.form.push("D");
            away.d += 1; away.pts += 1; away.form.push("D");
          }
        }
      }

      // First scheduled match becomes "next"
      if (!next && m.status === "SCHEDULED") {
        const hTeam = teamById.get(m.homeTeamId);
        const aTeam = teamById.get(m.awayTeamId);
        next = {
          homeCode: hTeam?.code ?? "",
          homeFlag: hTeam?.flagEmoji ?? null,
          awayCode: aTeam?.code ?? "",
          awayFlag: aTeam?.flagEmoji ?? null,
          kickoffAt: m.kickoffAt.toISOString(),
        };
      }
    }

    for (const r of rowsById.values()) {
      r.gd = r.gf - r.ga;
    }

    const sorted = Array.from(rowsById.values()).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.teamName.localeCompare(b.teamName);
    });

    blocks.push({
      id: g.id,
      letter: g.letter,
      rows: sorted,
      next,
      hasLive,
    });
  }

  return blocks;
}

export async function standingsRoutes(app: FastifyInstance) {
  app.get<{ Params: { slug: string } }>(
    "/tournaments/:slug/standings",
    async (req, reply) => {
      const t = await getTournamentBySlug(req.params.slug);
      if (!t) return reply.code(404).send({ error: "Not found" });
      const blocks = await buildStandings(t.id);
      return { groups: blocks };
    },
  );

  app.get<{ Params: { slug: string; letter: string } }>(
    "/tournaments/:slug/standings/:letter",
    async (req, reply) => {
      const t = await getTournamentBySlug(req.params.slug);
      if (!t) return reply.code(404).send({ error: "Not found" });
      const letter = req.params.letter.toUpperCase();
      const [block] = await buildStandings(t.id, letter);
      if (!block) return reply.code(404).send({ error: "Group not found" });
      return block;
    },
  );
}
