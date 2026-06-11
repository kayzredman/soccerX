import Link from "next/link";
import { fetchAllStandings, fetchGroupStanding, fetchMyGroupPicks } from "@/lib/api";
import { GroupStandingsView } from "@/components/group-standings-view";
import { LiveRefresher } from "@/components/live-refresher";

export const revalidate = 0;

type Params = Promise<{ group: string }>;

export default async function GroupStandingsPage({
  params,
}: {
  params: Params;
}) {
  const { group: groupParam } = await params;
  const letter = groupParam.replace(/^g-/i, "").toUpperCase();

  const [block, all, savedPicks] = await Promise.all([
    fetchGroupStanding(letter),
    fetchAllStandings(),
    fetchMyGroupPicks(),
  ]);

  if (!block) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-16 sm:px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-fg-dim">
          404 · group not found
        </p>
        <h1 className="mt-3 font-display text-4xl font-black text-fg">
          No group {letter}.
        </h1>
        <Link
          href="/standings"
          className="mt-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-fg-dim transition hover:text-fg"
        >
          ← All standings
        </Link>
      </div>
    );
  }

  const jumpLetters = all.map((b) => b.letter).sort();
  if (!jumpLetters.includes(block.letter)) jumpLetters.unshift(block.letter);

  const myPick = savedPicks
    .filter((p) => p.groupId === block.id)
    .reduce<{ winner?: string; runner?: string }>((acc, p) => {
      if (p.pickType === "group_winner") acc.winner = p.teamId;
      else acc.runner = p.teamId;
      return acc;
    }, {});

  return (
    <>
      <LiveRefresher />
      <GroupStandingsView
        block={block}
        jumpLetters={jumpLetters}
        myPick={myPick}
      />
    </>
  );
}

export async function generateMetadata({ params }: { params: Params }) {
  const { group } = await params;
  const letter = group.replace(/^g-/i, "").toUpperCase();
  return { title: `Group ${letter} · Standings` };
}
