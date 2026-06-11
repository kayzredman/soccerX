"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLiveFeed } from "@/lib/live-feed";
import { groupSnapshots } from "@/lib/standings";

export function GroupsStrip() {
  const { matches } = useLiveFeed();
  const snaps = groupSnapshots(matches);

  return (
    <div className="rounded-2xl border border-line/10 bg-surface-2 p-4 shadow-ring">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-fg-dim">
            Group leaders · live
          </p>
          <p className="mt-1 font-display text-lg font-bold tracking-tight text-fg">
            Who&apos;s topping their group?
          </p>
        </div>
        <Link
          href="/bracket"
          className="font-mono text-[11px] font-bold text-neon-lime transition hover:text-neon-cyan"
        >
          All standings →
        </Link>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {snaps.map((s) => (
          <Link
            key={s.group.id}
            href={`/standings/${s.group.id}`}
            className="group relative shrink-0 overflow-hidden rounded-2xl border border-line/10 bg-surface-3/40 transition hover:border-line/30"
            style={{ width: 168 }}
          >
            {/* color stripe */}
            <div
              className="absolute inset-x-0 top-0 h-1"
              style={{
                background: `linear-gradient(90deg, ${s.group.accent.from}, ${s.group.accent.to})`,
              }}
            />

            <div className="relative px-3 pb-3 pt-3.5">
              {/* group letter chip + live dot */}
              <div className="flex items-center justify-between">
                <span
                  className="grid h-7 w-7 place-items-center rounded-lg font-display text-sm font-black text-ink-900 shadow"
                  style={{
                    background: `linear-gradient(135deg, ${s.group.accent.from}, ${s.group.accent.to})`,
                  }}
                >
                  {s.group.letter}
                </span>
                {s.hasLive ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-1.5 py-0.5 font-mono text-[8px] font-black uppercase tracking-widest text-red-300">
                    <motion.span
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                      className="h-1 w-1 rounded-full bg-red-500"
                    />
                    Live
                  </span>
                ) : (
                  <span className="font-mono text-[9px] uppercase tracking-widest text-fg-dim">
                    {s.leaderPts}pts
                  </span>
                )}
              </div>

              {/* leader */}
              <div className="mt-2.5 flex items-center gap-2">
                <span className="text-xl leading-none">{s.leader.flag}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-fg">
                    {s.leader.name}
                  </p>
                  <p className="font-mono text-[10px] text-fg-muted">
                    {s.leaderPts}pts
                    <span className="ml-1 text-fg-dim">
                      ({s.leaderGd > 0 ? "+" : ""}
                      {s.leaderGd} GD)
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* hover sheen */}
            <span
              className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100"
              style={{
                background: `radial-gradient(60% 60% at 50% 100%, ${s.group.accent.from}22, transparent 70%)`,
              }}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
