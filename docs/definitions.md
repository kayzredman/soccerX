# Definitions

Single source of truth for terms used in SoccerX. If a UI label or scoring rule disagrees with this doc, this doc wins (or we update this doc explicitly).

## Tournament terms

- **Match-day** — a calendar date on which at least one tournament match kicks off, in UTC.
- **Stage** — `GROUP` | `R32` | `R16` | `QF` | `SF` | `FINAL` | `THIRD_PLACE`.
- **Group winner** — the team finishing 1st in a group on points → goal difference → goals scored → head-to-head → fair-play → draw (per FIFA WC2026 regulations).
- **Best-3rd** — one of the 8 best 3rd-placed teams that advance to the round of 32 (new format for 2026).

## Pick types

- **Bracket pick** — a structural prediction made before the tournament locks: group winner, group runner-up, best-3rd, knockout progression, champion.
- **Daily pick** — a per-match-day bonus question that locks at kickoff of the relevant match.
- **Locked pick** — a pick whose `lockedAt` timestamp has passed. Immutable. Any further edits return 409.

## Scoring terms

- **Score event** — an immutable row in `score_events` awarding (or reversing) points for a specific (user, pick, match) tuple.
- **Total score** — `SUM(points)` over all of a user's score events for a given tournament.
- **Settled match** — a match whose `status = 'FINISHED'` per the data provider AND for which the scoring worker has emitted score events for all relevant picks.
- **Reversal** — a `score_events` row with negative points, used when a provider corrects a result. Original row is never deleted.

## League terms

- **Mini-league** — a user-created group identified by an 8-character invite code. Members share a leaderboard scope.
- **League leaderboard** — leaderboard scoped to a single mini-league.
- **League owner** — the user who created the league. Can rename, regenerate the code, remove members. Cannot delete others' picks.

## Lock semantics

- **Bracket lock** — set to `tournament.startsAt` for all group-stage bracket picks. Knockout picks lock at the kickoff of their stage's first relevant match for that user's path (simpler v1: lock all knockouts at start of the knockout round).
- **Daily-pick lock** — set to `match.kickoffAt` for the specific match referenced.

## Edge cases

- **Match abandoned / replayed** — treated as no result until replay is settled. No score events emitted.
- **Walkover** — the awarded team is treated as the winner with scoreline `1-0` for scoring purposes (configurable per tournament).
- **Penalty shootouts** — for knockout-progression picks, the team that progresses is the "winner". For scoreline picks (if offered for knockouts in v2), the score at end of extra time is used.
