import { fetchAllStandings, fetchMyGroupPicks } from "@/lib/api";
import {
  groupFromApiBlock,
  standingsFromApiBlock,
} from "@/lib/api-adapters";
import { BracketView } from "@/components/bracket-view";
import { LiveRefresher } from "@/components/live-refresher";
import { saveGroupPicksAction } from "./actions";
import type { MockGroup, MockStanding } from "@/lib/mock";

export const revalidate = 0;

export const metadata = {
  title: "Bracket · soccerX",
};

export default async function BracketPage() {
  const [blocks, savedPicks] = await Promise.all([
    fetchAllStandings(),
    fetchMyGroupPicks(),
  ]);
  blocks.sort((a, b) => a.letter.localeCompare(b.letter));

  const groups: MockGroup[] = blocks.map(groupFromApiBlock);
  const standingsByGroupId: Record<string, MockStanding[]> = {};
  for (const b of blocks) standingsByGroupId[b.id] = standingsFromApiBlock(b);

  // Hydrate picks state shape: { [groupId]: { winner, runner } }
  const initialPicks: Record<string, { winner?: string; runner?: string }> = {};
  for (const p of savedPicks) {
    const slot = initialPicks[p.groupId] ?? {};
    if (p.pickType === "group_winner") slot.winner = p.teamId;
    else slot.runner = p.teamId;
    initialPicks[p.groupId] = slot;
  }

  const fromMock = blocks.some((b) => b.fromMock);

  return (
    <>
      <LiveRefresher />
      <BracketView
        groups={groups}
        standingsByGroupId={standingsByGroupId}
        fromMock={fromMock}
        initialPicks={initialPicks}
        saveAction={saveGroupPicksAction}
        alreadyLocked={savedPicks.length > 0}
      />
    </>
  );
}
