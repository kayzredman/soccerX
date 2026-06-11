import "reflect-metadata";
import { Queue, Worker, type ConnectionOptions } from "bullmq";
import { and, asc, desc, eq, inArray, lt, sql } from "drizzle-orm";
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

const {
  matches,
  groups,
  teams,
  picks,
  scoreEvents,
  users,
  leagues,
  leagueMembers,
  leaderboardCache,
  tournaments,
} = schema;

// Point values — keep in sync with docs/PROJECT.md §5.1
const POINTS = {
  group_winner: 30,
  group_runner_up: 20,
  best_third: 25,
  match_winner: 10,
  match_scoreline_bonus: 15,
} as const;

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
        // Trigger scoring for picks tied to this match (and group settlement
        // if this was the last match in the group).
        await scoreMatchQueue.add(
          "score",
          { matchId: m.id },
          { removeOnComplete: true, removeOnFail: false, attempts: 3 },
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

// ---- Helpers ------------------------------------------------------------

type StandingRow = { teamId: string; pts: number; gd: number; gf: number };

// Compute final group table from FINISHED matches only. Sort: pts → gd → gf → teamId.
async function computeGroupTable(groupId: string): Promise<StandingRow[]> {
  const groupTeams = await db
    .select({ id: teams.id })
    .from(teams)
    .where(eq(teams.groupId, groupId));
  const rows = new Map<string, StandingRow>(
    groupTeams.map((t) => [t.id, { teamId: t.id, pts: 0, gd: 0, gf: 0 }]),
  );

  const groupMatches = await db
    .select()
    .from(matches)
    .where(and(eq(matches.groupId, groupId), eq(matches.status, "FINISHED")));

  for (const m of groupMatches) {
    if (
      !m.homeTeamId ||
      !m.awayTeamId ||
      m.homeScore == null ||
      m.awayScore == null
    )
      continue;
    const h = rows.get(m.homeTeamId);
    const a = rows.get(m.awayTeamId);
    if (!h || !a) continue;
    h.gf += m.homeScore; h.gd += m.homeScore - m.awayScore;
    a.gf += m.awayScore; a.gd += m.awayScore - m.homeScore;
    if (m.homeScore > m.awayScore) h.pts += 3;
    else if (m.homeScore < m.awayScore) a.pts += 3;
    else { h.pts += 1; a.pts += 1; }
  }

  return Array.from(rows.values()).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.teamId.localeCompare(b.teamId);
  });
}

// Score group_winner / group_runner_up picks for a settled group.
// Deterministic anchorMatchId (MIN match.id in the group) lets us rely on
// the unique(pickId, matchId) index for idempotency regardless of which
// FT trigger fires this path.
async function scoreGroupSettled(groupId: string, tournamentId: string) {
  const [anchor] = await db
    .select({ id: matches.id })
    .from(matches)
    .where(eq(matches.groupId, groupId))
    .orderBy(asc(matches.id))
    .limit(1);
  if (!anchor) return;

  const table = await computeGroupTable(groupId);
  const [winnerRow, runnerUpRow] = table;
  if (!winnerRow || !runnerUpRow) return;
  const winnerTeamId = winnerRow.teamId;
  const runnerUpTeamId = runnerUpRow.teamId;

  const teamIds = table.map((r) => r.teamId);
  const allPicks = await db
    .select()
    .from(picks)
    .where(
      and(
        eq(picks.tournamentId, tournamentId),
        inArray(picks.pickType, ["group_winner", "group_runner_up"]),
        inArray(picks.teamId, teamIds),
      ),
    );

  const events: (typeof scoreEvents.$inferInsert)[] = [];
  for (const p of allPicks) {
    let points = 0;
    let reason = "";
    if (p.pickType === "group_winner" && p.teamId === winnerTeamId) {
      points = POINTS.group_winner;
      reason = "group_winner_correct";
    } else if (
      p.pickType === "group_runner_up" &&
      p.teamId === runnerUpTeamId
    ) {
      points = POINTS.group_runner_up;
      reason = "group_runner_up_correct";
    } else {
      continue;
    }
    events.push({
      userId: p.userId,
      tournamentId: p.tournamentId,
      pickId: p.id,
      matchId: anchor.id,
      points,
      reason,
    });
  }
  if (events.length === 0) return;
  const inserted = await db
    .insert(scoreEvents)
    .values(events)
    .onConflictDoNothing()
    .returning({ id: scoreEvents.id });
  // eslint-disable-next-line no-console
  console.log(
    `[score-match] group=${groupId} settled · ${inserted.length} new score events`,
  );
}

// Score match_scoreline picks for a single finished match.
async function scoreMatchScoreline(matchId: string) {
  const [m] = await db.select().from(matches).where(eq(matches.id, matchId));
  if (!m || m.homeScore == null || m.awayScore == null || !m.homeTeamId)
    return;
  const winnerTeamId =
    m.homeScore > m.awayScore
      ? m.homeTeamId
      : m.homeScore < m.awayScore
        ? m.awayTeamId
        : null;

  const matchPicks = await db
    .select()
    .from(picks)
    .where(
      and(
        eq(picks.matchId, m.id),
        eq(picks.pickType, "match_scoreline"),
      ),
    );

  const events: (typeof scoreEvents.$inferInsert)[] = [];
  for (const p of matchPicks) {
    // scalarValue convention: home*100 + away (e.g. 201 = 2-1, capped 0-9 per side)
    if (p.scalarValue == null) continue;
    const v = Number(p.scalarValue);
    const predHome = Math.floor(v / 100);
    const predAway = v % 100;
    let points = 0;
    const reasons: string[] = [];
    const predWinner =
      predHome > predAway
        ? p.teamId === m.homeTeamId
        : predHome < predAway
          ? p.teamId === m.awayTeamId
          : winnerTeamId === null;
    if (predWinner) {
      points += POINTS.match_winner;
      reasons.push("winner");
    }
    if (predHome === m.homeScore && predAway === m.awayScore) {
      points += POINTS.match_scoreline_bonus;
      reasons.push("scoreline");
    }
    if (points === 0) continue;
    events.push({
      userId: p.userId,
      tournamentId: p.tournamentId,
      pickId: p.id,
      matchId: m.id,
      points,
      reason: `match_${reasons.join("+")}`,
    });
  }
  if (events.length === 0) return;
  const inserted = await db
    .insert(scoreEvents)
    .values(events)
    .onConflictDoNothing()
    .returning({ id: scoreEvents.id });
  // eslint-disable-next-line no-console
  console.log(
    `[score-match] match=${matchId} scoreline · ${inserted.length} new events`,
  );
}

// ---- score-match worker -------------------------------------------------
new Worker<{ matchId: string }>(
  "scoring-score-match",
  async (job) => {
    const { matchId } = job.data;
    const [m] = await db.select().from(matches).where(eq(matches.id, matchId));
    if (!m || m.status !== "FINISHED") return;

    await scoreMatchScoreline(matchId);

    // Group settlement: only fire when no other matches in this group are
    // still pending. Idempotency comes from the deterministic anchor in
    // scoreGroupSettled + unique(pickId, matchId).
    if (m.stage === "GROUP" && m.groupId) {
      const pending = await db
        .select({ id: matches.id })
        .from(matches)
        .where(
          and(
            eq(matches.groupId, m.groupId),
            inArray(matches.status, ["SCHEDULED", "LIVE"]),
          ),
        );
      if (pending.length === 0) {
        await scoreGroupSettled(m.groupId, m.tournamentId);
      }
    }
  },
  { connection, concurrency: 4 },
);

// ---- refresh-leaderboards worker ---------------------------------------
// Rebuilds leaderboard_cache for scope='global' per tournament from the
// score_events ledger. Tie-break: total points desc, then earliest user
// created_at (per docs §12.7).
new Worker(
  "scoring-refresh-leaderboards",
  async () => {
    const tRows = await db.select({ id: tournaments.id }).from(tournaments);
    if (tRows.length === 0) return;

    for (const t of tRows) {
      const totals = await db
        .select({
          userId: scoreEvents.userId,
          total: sql<number>`COALESCE(SUM(${scoreEvents.points}), 0)::int`,
          firstSeen: sql<Date>`MIN(${users.createdAt})`,
        })
        .from(scoreEvents)
        .innerJoin(users, eq(users.id, scoreEvents.userId))
        .where(eq(scoreEvents.tournamentId, t.id))
        .groupBy(scoreEvents.userId)
        .orderBy(
          desc(sql`COALESCE(SUM(${scoreEvents.points}), 0)`),
          asc(sql`MIN(${users.createdAt})`),
        );

      if (totals.length === 0) continue;

      const now = new Date();
      const rows = totals.map((row, i) => ({
        scope: "global",
        tournamentId: t.id,
        userId: row.userId,
        totalPoints: row.total,
        rank: i + 1,
        lastRefreshed: now,
      }));

      await db
        .insert(leaderboardCache)
        .values(rows)
        .onConflictDoUpdate({
          target: [
            leaderboardCache.scope,
            leaderboardCache.tournamentId,
            leaderboardCache.userId,
          ],
          set: {
            totalPoints: sql`excluded.total_points`,
            rank: sql`excluded.rank`,
            lastRefreshed: sql`excluded.last_refreshed`,
          },
        });

      // eslint-disable-next-line no-console
      console.log(
        `[refresh-leaderboards] tournament=${t.id} · ${rows.length} rows`,
      );
    }
  },
  { connection },
);

// ---- ingest-results worker (still a stub — wired in Phase 2) -----------
new Worker(
  "scoring-ingest-results",
  async () => {
    // TODO Phase 2: pull matches from api-football and apply provider results.
    // eslint-disable-next-line no-console
    console.log("[scoring] ingest tick (stub)");
  },
  { connection },
);

// eslint-disable-next-line no-console
console.log(
  `[scoring] worker up · live-sim every ${env.LIVE_SIM_TICK_MS}ms (0 = off)`,
);
