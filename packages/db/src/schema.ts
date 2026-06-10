import {
  pgSchema,
  uuid,
  text,
  integer,
  bigserial,
  timestamp,
  numeric,
  boolean,
  pgEnum,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";

// All SoccerX tables live under the `soccerx` schema.
export const sx = pgSchema("soccerx");

// ===== Enums =====
export const stageEnum = sx.enum("stage", [
  "GROUP",
  "R32",
  "R16",
  "QF",
  "SF",
  "FINAL",
  "THIRD_PLACE",
]);

export const matchStatusEnum = sx.enum("match_status", [
  "SCHEDULED",
  "LIVE",
  "FINISHED",
  "POSTPONED",
  "CANCELED",
]);

export const pickTypeEnum = sx.enum("pick_type", [
  "group_winner",
  "group_runner_up",
  "best_third",
  "r32",
  "r16",
  "qf",
  "sf",
  "final",
  "champion",
  "match_scoreline",
  "daily_first_scorer",
  "daily_over_under",
  "daily_red_card",
  "daily_half_time",
]);

export const tournamentFormatEnum = sx.enum("tournament_format", [
  "wc2026",
  "afcon2027",
]);

export const archetypeEnum = sx.enum("archetype", [
  "CHALK",
  "ROMANTIC",
  "CHAOS",
  "PATRIOT",
  "STATISTICIAN",
]);

// ===== Users =====
export const users = sx.table(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkUserId: text("clerk_user_id").unique(),
    email: text("email"),
    handle: text("handle").notNull(),
    country: text("country"), // ISO 3166-1 alpha-2
    archetype: archetypeEnum("archetype"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    handleUnique: uniqueIndex("users_handle_lower_unique").on(t.handle),
  }),
);

// ===== Tournaments =====
export const tournaments = sx.table("tournaments", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  format: tournamentFormatEnum("format").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  bracketLockAt: timestamp("bracket_lock_at", { withTimezone: true }).notNull(),
});

// ===== Groups =====
export const groups = sx.table(
  "groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tournamentId: uuid("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    letter: text("letter").notNull(), // A..L
  },
  (t) => ({
    tournamentLetterUnique: uniqueIndex("groups_tournament_letter_unique").on(
      t.tournamentId,
      t.letter,
    ),
  }),
);

// ===== Teams =====
export const teams = sx.table(
  "teams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tournamentId: uuid("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    groupId: uuid("group_id").references(() => groups.id),
    name: text("name").notNull(),
    code: text("code").notNull(), // 3-letter FIFA code
    flagEmoji: text("flag_emoji"),
  },
  (t) => ({
    tournamentCodeUnique: uniqueIndex("teams_tournament_code_unique").on(
      t.tournamentId,
      t.code,
    ),
  }),
);

// ===== Matches =====
export const matches = sx.table(
  "matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tournamentId: uuid("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    stage: stageEnum("stage").notNull(),
    groupId: uuid("group_id").references(() => groups.id),
    homeTeamId: uuid("home_team_id").references(() => teams.id),
    awayTeamId: uuid("away_team_id").references(() => teams.id),
    kickoffAt: timestamp("kickoff_at", { withTimezone: true }).notNull(),
    venue: text("venue"),
    homeScore: integer("home_score"),
    awayScore: integer("away_score"),
    status: matchStatusEnum("status").notNull().default("SCHEDULED"),
    externalRef: text("external_ref"), // provider match id
    settledAt: timestamp("settled_at", { withTimezone: true }),
  },
  (t) => ({
    kickoffIdx: index("matches_kickoff_idx").on(t.kickoffAt),
    externalRefUnique: uniqueIndex("matches_external_ref_unique").on(
      t.externalRef,
    ),
  }),
);

// ===== Picks =====
export const picks = sx.table(
  "picks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tournamentId: uuid("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    pickType: pickTypeEnum("pick_type").notNull(),
    matchId: uuid("match_id").references(() => matches.id),
    teamId: uuid("team_id").references(() => teams.id),
    scalarValue: numeric("scalar_value"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lockedAt: timestamp("locked_at", { withTimezone: true }).notNull(),
  },
  (t) => ({
    userTournamentTypeIdx: index("picks_user_tournament_type_idx").on(
      t.userId,
      t.tournamentId,
      t.pickType,
    ),
    // a user has at most one pick per (type + match) — match is null for
    // structural picks like champion, but for those we add a partial unique
    // index in a migration as needed.
  }),
);

// ===== Score events (immutable ledger) =====
export const scoreEvents = sx.table(
  "score_events",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tournamentId: uuid("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    pickId: uuid("pick_id")
      .notNull()
      .references(() => picks.id, { onDelete: "cascade" }),
    matchId: uuid("match_id").references(() => matches.id),
    points: integer("points").notNull(),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userTournamentIdx: index("score_events_user_tournament_idx").on(
      t.userId,
      t.tournamentId,
    ),
    pickMatchUnique: uniqueIndex("score_events_pick_match_unique").on(
      t.pickId,
      t.matchId,
    ),
  }),
);

// ===== Leagues =====
export const leagues = sx.table(
  "leagues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    code: text("code").notNull().unique(),
    isOpen: boolean("is_open").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    codeIdx: index("leagues_code_idx").on(t.code),
  }),
);

export const leagueMembers = sx.table(
  "league_members",
  {
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.leagueId, t.userId] }),
  }),
);

// ===== Leaderboard cache =====
// scope examples: 'global', 'country:GH', 'league:ABCD1234'
export const leaderboardCache = sx.table(
  "leaderboard_cache",
  {
    scope: text("scope").notNull(),
    tournamentId: uuid("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    totalPoints: integer("total_points").notNull(),
    rank: integer("rank").notNull(),
    lastRefreshed: timestamp("last_refreshed", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.scope, t.tournamentId, t.userId] }),
    rankIdx: index("leaderboard_scope_tournament_rank_idx").on(
      t.scope,
      t.tournamentId,
      t.rank,
    ),
  }),
);

// ===== Daily questions (server-curated) =====
export const dailyQuestions = sx.table(
  "daily_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tournamentId: uuid("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    pickType: pickTypeEnum("pick_type").notNull(),
    prompt: text("prompt").notNull(),
    pointsAward: integer("points_award").notNull().default(10),
    settledAt: timestamp("settled_at", { withTimezone: true }),
  },
  (t) => ({
    matchTypeUnique: uniqueIndex("daily_questions_match_type_unique").on(
      t.matchId,
      t.pickType,
    ),
  }),
);
