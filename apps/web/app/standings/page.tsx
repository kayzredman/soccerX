import { fetchAllStandings, fetchMyGroupPicks } from "@/lib/api";
import { StandingsIndexView } from "@/components/standings-index-view";
import { LiveRefresher } from "@/components/live-refresher";

export const revalidate = 0;

export const metadata = {
  title: "All standings · soccerX",
};

export default async function StandingsIndexPage() {
  const [blocks, savedPicks] = await Promise.all([
    fetchAllStandings(),
    fetchMyGroupPicks(),
  ]);
  blocks.sort((a, b) => a.letter.localeCompare(b.letter));

  const picksByGroupId: Record<string, { winner?: string; runner?: string }> = {};
  for (const p of savedPicks) {
    const slot = picksByGroupId[p.groupId] ?? {};
    if (p.pickType === "group_winner") slot.winner = p.teamId;
    else slot.runner = p.teamId;
    picksByGroupId[p.groupId] = slot;
  }

  return (
    <>
      <LiveRefresher />
      <StandingsIndexView blocks={blocks} picksByGroupId={picksByGroupId} />
    </>
  );
}
