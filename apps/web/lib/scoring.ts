/**
 * SoccerX scoring rules.
 *
 * Group stage picks:
 *   - Correct winner in the right slot (1st)  → +10 pts (perfect)
 *   - Correct runner-up in the right slot (2nd) → +8  pts (perfect)
 *   - Right team but wrong slot (you picked 1st, they finished 2nd, etc.) → +4 pts (partial)
 *   - Right team still in the qualifying mix mid-tournament → +2 pts (provisional)
 *   - Pick is currently out of qualifying → 0
 *
 * Mid-tournament we show "live / provisional" totals so the user feels the
 * stakes move in real time; once the group is settled they convert to the
 * locked totals.
 */

import type { MockStanding } from "@/lib/mock";

export type PickStatus = "nailed" | "swap" | "partial" | "danger" | "missed";

export type RowAward = {
  pickedAs: "winner" | "runner";
  finishedAt: number;
  status: PickStatus;
  points: number;
  /** if the group is not yet decided */
  provisional: boolean;
  /** short copy for the badge */
  label: string;
};

const POINTS = {
  exactWinner: 10,
  exactRunner: 8,
  partial: 4,
  provisional: 2,
} as const;

/**
 * Score a single pick row for a team in a given group standings.
 * Returns null if the team wasn't picked.
 */
export function awardForTeam(
  teamId: string,
  position: number,
  winnerPick: string | undefined,
  runnerPick: string | undefined,
  decided: boolean,
): RowAward | null {
  const pickedAs: "winner" | "runner" | null =
    winnerPick === teamId ? "winner" : runnerPick === teamId ? "runner" : null;
  if (!pickedAs) return null;

  // Perfect = right team in the right slot
  const perfectWinner = pickedAs === "winner" && position === 1;
  const perfectRunner = pickedAs === "runner" && position === 2;

  if (perfectWinner) {
    return {
      pickedAs,
      finishedAt: position,
      status: "nailed",
      points: POINTS.exactWinner,
      provisional: !decided,
      label: decided ? `+${POINTS.exactWinner} locked` : `+${POINTS.exactWinner} on track`,
    };
  }
  if (perfectRunner) {
    return {
      pickedAs,
      finishedAt: position,
      status: "nailed",
      points: POINTS.exactRunner,
      provisional: !decided,
      label: decided ? `+${POINTS.exactRunner} locked` : `+${POINTS.exactRunner} on track`,
    };
  }

  // Swap = right team but in the wrong qualifying slot
  const swapWinner = pickedAs === "winner" && position === 2;
  const swapRunner = pickedAs === "runner" && position === 1;
  if (swapWinner || swapRunner) {
    return {
      pickedAs,
      finishedAt: position,
      status: "swap",
      points: POINTS.partial,
      provisional: !decided,
      label: decided ? `+${POINTS.partial} swap` : `+${POINTS.partial} swap risk`,
    };
  }

  // Team finished 3rd or 4th
  if (position >= 3) {
    return {
      pickedAs,
      finishedAt: position,
      status: position === 3 ? "danger" : "missed",
      points: 0,
      provisional: !decided,
      label: decided ? "0 missed" : "in danger",
    };
  }

  return null;
}

/**
 * Total potential points across a single group given the current standings.
 * Mid-tournament this returns the "if it ended right now" projection.
 */
export function projectGroupPoints(
  rows: MockStanding[],
  winnerPick: string | undefined,
  runnerPick: string | undefined,
  decided: boolean,
): { points: number; provisional: boolean } {
  let total = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const award = awardForTeam(row.teamId, i + 1, winnerPick, runnerPick, decided);
    if (award) total += award.points;
  }
  return { points: total, provisional: !decided };
}
