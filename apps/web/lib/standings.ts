/**
 * Standings helpers — bridge between the live-feed (current matches) and
 * the base group tables (results that already happened).
 *
 * The contract: take the static MOCK_STANDINGS (MD1+MD2 in the books) and
 * fold in whatever the live matches are showing right now. A live match is
 * treated as a *provisional* MD3 — its GF/GA contribute immediately, but
 * W/D/L only flips when the match goes FT.
 */

import {
  MOCK_GROUPS,
  MOCK_STANDINGS,
  type MockStanding,
  type MockGroup,
  type MockTeam,
} from "@/lib/mock";
import type { Match } from "@/lib/live-feed";

/** Map live-feed team CODE (uppercase) → mock team id (lowercase). */
const CODE_TO_TEAM_ID: Record<string, string> = {
  ARG: "arg", MEX: "mex", RSA: "rsa", KOR: "kor", CZE: "cze",
  FRA: "fra", GER: "ger", BRA: "bra", ESP: "esp", ENG: "eng",
  POR: "por", NED: "ned", USA: "usa", CAN: "can", JPN: "jpn",
  BEL: "bel", URU: "uru", SEN: "sen", COL: "col", GHA: "gha",
  SUI: "sui", MAR: "mar", AUS: "aus", CIV: "civ", IRN: "irn",
  CRO: "cro",
};

/** Reverse: team id → group id. Built once. */
const TEAM_ID_TO_GROUP: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const g of MOCK_GROUPS) {
    for (const t of g.teams) m.set(t.id, g.id);
  }
  return m;
})();

export function groupForTeamId(teamId: string): MockGroup | undefined {
  const gid = TEAM_ID_TO_GROUP.get(teamId);
  return MOCK_GROUPS.find((g) => g.id === gid);
}

export function groupForTeamCode(code: string): MockGroup | undefined {
  const id = CODE_TO_TEAM_ID[code];
  if (!id) return undefined;
  return groupForTeamId(id);
}

/** Resort by Pts → GD → GF (FIFA tiebreaker, simplified). */
function sortStandings(rows: MockStanding[]): MockStanding[] {
  return [...rows].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });
}

export type AppliedStandings = {
  rows: MockStanding[];
  /** team ids whose row just changed because of a live event */
  flashed: Set<string>;
};

/**
 * Apply live-match deltas to the base standings for a single group.
 * Returns updated rows + the set of team ids that have a live contribution
 * (so the UI can pulse them).
 */
export function applyLiveToGroup(
  group: MockGroup,
  liveMatches: Match[],
): AppliedStandings {
  const base = MOCK_STANDINGS[group.id] ?? [];
  const byId = new Map<string, MockStanding>(
    base.map((s) => [s.teamId, { ...s, form: [...s.form] }]),
  );
  const flashed = new Set<string>();

  // Only live or FT matches whose BOTH teams sit in this group
  for (const m of liveMatches) {
    if (m.status === "scheduled") continue;
    const homeId = CODE_TO_TEAM_ID[m.home.code];
    const awayId = CODE_TO_TEAM_ID[m.away.code];
    if (!homeId || !awayId) continue;
    const homeGid = TEAM_ID_TO_GROUP.get(homeId);
    const awayGid = TEAM_ID_TO_GROUP.get(awayId);
    if (homeGid !== group.id || awayGid !== group.id) continue;

    const home = byId.get(homeId);
    const away = byId.get(awayId);
    if (!home || !away) continue;

    // GF/GA always reflect current scoreline immediately
    home.gf += m.homeScore;
    home.ga += m.awayScore;
    home.gd = home.gf - home.ga;
    away.gf += m.awayScore;
    away.ga += m.homeScore;
    away.gd = away.gf - away.ga;

    // MP / W/D/L only when FT
    if (m.status === "ft") {
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

    // Anything past kickoff with any contribution flashes briefly
    if (m.pulse > 0 || m.status === "ft" || m.homeScore > 0 || m.awayScore > 0) {
      flashed.add(homeId);
      flashed.add(awayId);
    }
  }

  return { rows: sortStandings([...byId.values()]), flashed };
}

/** Quick summary for the home mini-strip: leader of each group. */
export type GroupSnapshot = {
  group: MockGroup;
  leader: MockTeam;
  leaderPts: number;
  leaderGd: number;
  hasLive: boolean;
};

export function groupSnapshots(liveMatches: Match[]): GroupSnapshot[] {
  return MOCK_GROUPS.map((group) => {
    const { rows } = applyLiveToGroup(group, liveMatches);
    const top = rows[0];
    const leaderTeam = group.teams.find((t) => t.id === top?.teamId) ?? group.teams[0]!;
    const hasLive = liveMatches.some((m) => {
      const hid = CODE_TO_TEAM_ID[m.home.code];
      const aid = CODE_TO_TEAM_ID[m.away.code];
      return (
        m.status === "live" &&
        ((hid && TEAM_ID_TO_GROUP.get(hid) === group.id) ||
          (aid && TEAM_ID_TO_GROUP.get(aid) === group.id))
      );
    });
    return {
      group,
      leader: leaderTeam,
      leaderPts: top?.pts ?? 0,
      leaderGd: top?.gd ?? 0,
      hasLive,
    };
  });
}
