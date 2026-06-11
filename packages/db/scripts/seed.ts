/**
 * SoccerX — WC2026 seed
 *
 * Run with:
 *   cd packages/db
 *   DATABASE_URL=postgres://... pnpm exec tsx scripts/seed.ts
 *
 * Idempotent: safe to run multiple times. Uses `slug` / `code` natural keys
 * to upsert without disturbing existing rows.
 *
 * NOTE on group composition: the FIFA 2026 final draw was held 5 Dec 2025.
 * Twelve groups (A–L), four teams each. Update this file if a team is
 * replaced via FIFA's regulations before kickoff.
 */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and } from "drizzle-orm";
import { groups, teams, tournaments, matches } from "../src/schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

// ---- Tournament ---------------------------------------------------------
const TOURNAMENT = {
  slug: "wc2026",
  name: "FIFA World Cup 2026",
  format: "wc2026" as const,
  startsAt: new Date("2026-06-11T20:00:00Z"),
  endsAt: new Date("2026-07-19T22:00:00Z"),
  // Bracket locks at the kickoff of MD3 (so dev can keep editing post-MD2).
  bracketLockAt: new Date("2026-06-21T20:00:00Z"),
};

// ---- Groups (A..L) + their 4 teams in pot order ------------------------
type TeamSeed = { code: string; name: string; flag: string };
const GROUPS: Record<string, TeamSeed[]> = {
  A: [
    { code: "MEX", name: "Mexico", flag: "🇲🇽" },
    { code: "KOR", name: "Korea Republic", flag: "🇰🇷" },
    { code: "JAM", name: "Jamaica", flag: "🇯🇲" },
    { code: "RSA", name: "South Africa", flag: "🇿🇦" },
  ],
  B: [
    { code: "CAN", name: "Canada", flag: "🇨🇦" },
    { code: "AUS", name: "Australia", flag: "🇦🇺" },
    { code: "ECU", name: "Ecuador", flag: "🇪🇨" },
    { code: "TUN", name: "Tunisia", flag: "🇹🇳" },
  ],
  C: [
    { code: "USA", name: "United States", flag: "🇺🇸" },
    { code: "JPN", name: "Japan", flag: "🇯🇵" },
    { code: "EGY", name: "Egypt", flag: "🇪🇬" },
    { code: "UZB", name: "Uzbekistan", flag: "🇺🇿" },
  ],
  D: [
    { code: "ARG", name: "Argentina", flag: "🇦🇷" },
    { code: "CRO", name: "Croatia", flag: "🇭🇷" },
    { code: "PAR", name: "Paraguay", flag: "🇵🇾" },
    { code: "GHA", name: "Ghana", flag: "🇬🇭" },
  ],
  E: [
    { code: "ESP", name: "Spain", flag: "🇪🇸" },
    { code: "MAR", name: "Morocco", flag: "🇲🇦" },
    { code: "PAN", name: "Panama", flag: "🇵🇦" },
    { code: "JOR", name: "Jordan", flag: "🇯🇴" },
  ],
  F: [
    { code: "FRA", name: "France", flag: "🇫🇷" },
    { code: "POR", name: "Portugal", flag: "🇵🇹" },
    { code: "SEN", name: "Senegal", flag: "🇸🇳" },
    { code: "QAT", name: "Qatar", flag: "🇶🇦" },
  ],
  G: [
    { code: "BRA", name: "Brazil", flag: "🇧🇷" },
    { code: "SUI", name: "Switzerland", flag: "🇨🇭" },
    { code: "CIV", name: "Côte d'Ivoire", flag: "🇨🇮" },
    { code: "CRC", name: "Costa Rica", flag: "🇨🇷" },
  ],
  H: [
    { code: "ENG", name: "England", flag: "🇬🇧" },
    { code: "COL", name: "Colombia", flag: "🇨🇴" },
    { code: "ALG", name: "Algeria", flag: "🇩🇿" },
    { code: "NZL", name: "New Zealand", flag: "🇳🇿" },
  ],
  I: [
    { code: "NED", name: "Netherlands", flag: "🇳🇱" },
    { code: "URU", name: "Uruguay", flag: "🇺🇾" },
    { code: "NGA", name: "Nigeria", flag: "🇳🇬" },
    { code: "HAI", name: "Haiti", flag: "🇭🇹" },
  ],
  J: [
    { code: "BEL", name: "Belgium", flag: "🇧🇪" },
    { code: "SCO", name: "Scotland", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
    { code: "PER", name: "Peru", flag: "🇵🇪" },
    { code: "CPV", name: "Cape Verde", flag: "🇨🇻" },
  ],
  K: [
    { code: "GER", name: "Germany", flag: "🇩🇪" },
    { code: "ITA", name: "Italy", flag: "🇮🇹" },
    { code: "CHI", name: "Chile", flag: "🇨🇱" },
    { code: "UAE", name: "United Arab Emirates", flag: "🇦🇪" },
  ],
  L: [
    { code: "NOR", name: "Norway", flag: "🇳🇴" },
    { code: "AUT", name: "Austria", flag: "🇦🇹" },
    { code: "VEN", name: "Venezuela", flag: "🇻🇪" },
    { code: "IRQ", name: "Iraq", flag: "🇮🇶" },
  ],
};

async function main() {
  const sql = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(sql);

  console.log("→ tournament");
  const existing = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.slug, TOURNAMENT.slug));

  let tournamentId: string;
  if (existing.length > 0) {
    tournamentId = existing[0].id;
    console.log(`  found existing ${TOURNAMENT.slug} → ${tournamentId}`);
    // Always refresh the lock/dates so dev re-seeds keep picks editable.
    await db
      .update(tournaments)
      .set({
        startsAt: TOURNAMENT.startsAt,
        endsAt: TOURNAMENT.endsAt,
        bracketLockAt: TOURNAMENT.bracketLockAt,
      })
      .where(eq(tournaments.id, tournamentId));
  } else {
    const [row] = await db.insert(tournaments).values(TOURNAMENT).returning();
    tournamentId = row.id;
    console.log(`  inserted ${TOURNAMENT.slug} → ${tournamentId}`);
  }

  console.log("→ groups & teams");
  let groupsInserted = 0;
  let teamsInserted = 0;

  for (const [letter, members] of Object.entries(GROUPS)) {
    let groupId: string;
    const existingGroup = await db
      .select()
      .from(groups)
      .where(
        and(eq(groups.tournamentId, tournamentId), eq(groups.letter, letter)),
      );

    if (existingGroup.length > 0) {
      groupId = existingGroup[0].id;
    } else {
      const [g] = await db
        .insert(groups)
        .values({ tournamentId, letter })
        .returning();
      groupId = g.id;
      groupsInserted++;
    }

    for (const t of members) {
      const existingTeam = await db
        .select()
        .from(teams)
        .where(
          and(eq(teams.tournamentId, tournamentId), eq(teams.code, t.code)),
        );

      if (existingTeam.length === 0) {
        await db.insert(teams).values({
          tournamentId,
          groupId,
          code: t.code,
          name: t.name,
          flagEmoji: t.flag,
        });
        teamsInserted++;
      }
    }
  }

  console.log(`  groups inserted: ${groupsInserted}`);
  console.log(`  teams  inserted: ${teamsInserted}`);

  // ---- Matches ----------------------------------------------------------
  // Seed MD1 + MD2 results plus an MD3 scheduled fixture per group so
  // the standings derive endpoint has real data. Idempotent on (group, MD).
  console.log("→ matches (MD1, MD2 finished + MD3 scheduled)");

  // Result template: [pot1-vs-pot4, pot2-vs-pot3] per matchday.
  // (homeIdx, awayIdx, homeScore, awayScore) where indices are 0..3 in GROUPS order.
  type Fx = [number, number, number, number];
  const RESULTS: Record<string, { md1: [Fx, Fx]; md2: [Fx, Fx] }> = {
    A: { md1: [[0, 3, 2, 0], [1, 2, 2, 1]], md2: [[0, 2, 2, 1], [3, 1, 0, 1]] },
    B: { md1: [[0, 3, 1, 1], [1, 2, 2, 0]], md2: [[0, 1, 1, 1], [2, 3, 1, 1]] },
    C: { md1: [[0, 3, 2, 1], [1, 2, 2, 0]], md2: [[0, 2, 1, 1], [3, 1, 0, 2]] },
    D: { md1: [[0, 3, 3, 1], [1, 2, 1, 0]], md2: [[0, 2, 2, 1], [3, 1, 1, 2]] },
    E: { md1: [[0, 3, 3, 0], [1, 2, 1, 1]], md2: [[0, 2, 2, 0], [3, 1, 0, 2]] },
    F: { md1: [[0, 3, 2, 0], [1, 2, 1, 1]], md2: [[0, 1, 1, 1], [3, 2, 0, 2]] },
    G: { md1: [[0, 3, 4, 1], [1, 2, 1, 1]], md2: [[0, 2, 2, 1], [3, 1, 0, 2]] },
    H: { md1: [[0, 3, 2, 0], [1, 2, 1, 0]], md2: [[0, 1, 2, 1], [2, 3, 1, 1]] },
    I: { md1: [[0, 3, 1, 0], [1, 2, 2, 1]], md2: [[0, 1, 1, 1], [3, 2, 0, 2]] },
    J: { md1: [[0, 3, 3, 0], [1, 2, 2, 1]], md2: [[0, 2, 1, 1], [3, 1, 0, 2]] },
    K: { md1: [[0, 3, 2, 0], [1, 2, 1, 1]], md2: [[0, 2, 2, 1], [3, 1, 0, 2]] },
    L: { md1: [[0, 3, 2, 1], [1, 2, 1, 1]], md2: [[0, 2, 2, 0], [3, 1, 0, 2]] },
  };

  // kickoff times: MD1 = day 0..3, MD2 = day 4..7, MD3 = day 8..11
  const KICK_BASE = TOURNAMENT.startsAt.getTime();
  const HOUR = 3_600_000;

  let matchesInserted = 0;
  let matchIdx = 0;
  for (const [letter, members] of Object.entries(GROUPS)) {
    const groupRow = await db
      .select()
      .from(groups)
      .where(
        and(eq(groups.tournamentId, tournamentId), eq(groups.letter, letter)),
      );
    const groupId = groupRow[0]?.id;
    if (!groupId) continue;

    const teamRows = await db
      .select()
      .from(teams)
      .where(eq(teams.tournamentId, tournamentId));
    const teamByCode = new Map(teamRows.map((t) => [t.code, t]));
    const codes = members.map((m) => m.code);
    const indexed = codes.map((c) => teamByCode.get(c));

    const fixtures: Array<{
      home: (typeof teamRows)[number];
      away: (typeof teamRows)[number];
      hs: number | null;
      as: number | null;
      status: "FINISHED" | "SCHEDULED";
      md: number;
    }> = [];

    const r = RESULTS[letter];
    if (r) {
      for (let md = 0; md < 2; md++) {
        for (const fx of md === 0 ? r.md1 : r.md2) {
          const [hi, ai, hs, as] = fx;
          const h = indexed[hi];
          const a = indexed[ai];
          if (!h || !a) continue;
          fixtures.push({ home: h, away: a, hs, as, status: "FINISHED", md });
        }
      }
      // MD3 scheduled: pot1 vs pot2 + pot3 vs pot4 (true tournament structure)
      const md3: Array<[number, number]> = [
        [0, 1],
        [2, 3],
      ];
      for (const [hi, ai] of md3) {
        const h = indexed[hi];
        const a = indexed[ai];
        if (!h || !a) continue;
        fixtures.push({ home: h, away: a, hs: null, as: null, status: "SCHEDULED", md: 2 });
      }
    }

    for (const fx of fixtures) {
      const externalRef = `wc2026:G${letter}:MD${fx.md + 1}:${fx.home.code}v${fx.away.code}`;
      const existing = await db
        .select()
        .from(matches)
        .where(eq(matches.externalRef, externalRef));
      if (existing.length > 0) continue;

      await db.insert(matches).values({
        tournamentId,
        stage: "GROUP",
        groupId,
        homeTeamId: fx.home.id,
        awayTeamId: fx.away.id,
        kickoffAt: new Date(KICK_BASE + matchIdx * HOUR * 6),
        venue: null,
        homeScore: fx.hs,
        awayScore: fx.as,
        status: fx.status,
        externalRef,
        settledAt: fx.status === "FINISHED" ? new Date() : null,
      });
      matchesInserted++;
      matchIdx++;
    }
  }

  console.log(`  matches inserted: ${matchesInserted}`);

  // ---- Live demo: flip two MD3 fixtures to LIVE with partial scores -----
  // Idempotent: re-running just re-sets the same state.
  console.log("→ live demo (Group A MD3 + Group G MD3)");
  const LIVE_TARGETS: Array<{
    group: string;
    homeIdx: number;
    awayIdx: number;
    hs: number;
    as: number;
  }> = [
    { group: "A", homeIdx: 0, awayIdx: 1, hs: 1, as: 0 },
    { group: "G", homeIdx: 0, awayIdx: 1, hs: 2, as: 1 },
  ];
  let liveUpdated = 0;
  for (const t of LIVE_TARGETS) {
    const codes = GROUPS[t.group];
    if (!codes) continue;
    const homeCode = codes[t.homeIdx]?.code;
    const awayCode = codes[t.awayIdx]?.code;
    if (!homeCode || !awayCode) continue;
    const externalRef = `wc2026:G${t.group}:MD3:${homeCode}v${awayCode}`;
    const updated = await db
      .update(matches)
      .set({
        status: "LIVE",
        homeScore: t.hs,
        awayScore: t.as,
        kickoffAt: new Date(Date.now() - 30 * 60_000),
      })
      .where(eq(matches.externalRef, externalRef))
      .returning({ id: matches.id });
    liveUpdated += updated.length;
  }
  console.log(`  live fixtures: ${liveUpdated}`);

  console.log("✓ seed complete");

  await sql.end();
}

main().catch((err) => {
  console.error("seed failed:", err);
  process.exit(1);
});
