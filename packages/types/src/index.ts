import { z } from "zod";

// ===== Tournament =====
export const TournamentFormat = z.enum(["wc2026", "afcon2027"]);
export type TournamentFormat = z.infer<typeof TournamentFormat>;

export const Stage = z.enum([
  "GROUP",
  "R32",
  "R16",
  "QF",
  "SF",
  "FINAL",
  "THIRD_PLACE",
]);
export type Stage = z.infer<typeof Stage>;

export const MatchStatus = z.enum([
  "SCHEDULED",
  "LIVE",
  "FINISHED",
  "POSTPONED",
  "CANCELED",
]);
export type MatchStatus = z.infer<typeof MatchStatus>;

// ===== Picks =====
export const PickType = z.enum([
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
export type PickType = z.infer<typeof PickType>;

export const CreatePickInput = z.object({
  tournamentId: z.string().uuid(),
  pickType: PickType,
  matchId: z.string().uuid().nullish(),
  teamId: z.string().uuid().nullish(),
  scalarValue: z.number().nullish(),
});
export type CreatePickInput = z.infer<typeof CreatePickInput>;

// ===== Leagues =====
export const CreateLeagueInput = z.object({
  name: z.string().min(2).max(64),
});
export type CreateLeagueInput = z.infer<typeof CreateLeagueInput>;

export const JoinLeagueInput = z.object({
  code: z.string().length(8),
});
export type JoinLeagueInput = z.infer<typeof JoinLeagueInput>;

// ===== Leaderboard =====
export const LeaderboardScope = z.union([
  z.literal("global"),
  z.string().regex(/^country:[A-Z]{2}$/),
  z.string().regex(/^league:[a-z0-9]{8}$/i),
]);
export type LeaderboardScope = z.infer<typeof LeaderboardScope>;

// ===== Archetypes (v1.5) =====
export const Archetype = z.enum([
  "CHALK",
  "ROMANTIC",
  "CHAOS",
  "PATRIOT",
  "STATISTICIAN",
]);
export type Archetype = z.infer<typeof Archetype>;
