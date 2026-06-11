"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { StandingsCard } from "@/components/standings-card";
import type { ApiGroupBlock } from "@/lib/api";
import {
  groupFromApiBlock,
  standingsFromApiBlock,
} from "@/lib/api-adapters";

type View = "grid" | "compact";
type Filter = "all" | "live" | "complete" | "upcoming";

type Snap = {
  block: ApiGroupBlock;
  group: ReturnType<typeof groupFromApiBlock>;
  standings: ReturnType<typeof standingsFromApiBlock>;
  leaderPts: number;
  leaderGd: number;
  hasLive: boolean;
};

export function StandingsIndexView({
  blocks,
  picksByGroupId,
}: {
  blocks: ApiGroupBlock[];
  picksByGroupId?: Record<string, { winner?: string; runner?: string }>;
}) {
  const [view, setView] = useState<View>("grid");
  const [filter, setFilter] = useState<Filter>("all");

  const snaps = useMemo<Snap[]>(
    () =>
      blocks.map((block) => {
        const group = groupFromApiBlock(block);
        const standings = standingsFromApiBlock(block);
        const leader = standings[0];
        return {
          block,
          group,
          standings,
          leaderPts: leader?.pts ?? 0,
          leaderGd: leader?.gd ?? 0,
          hasLive: block.hasLive,
        };
      }),
    [blocks],
  );

  const filtered = useMemo(() => {
    if (filter === "all") return snaps;
    if (filter === "live") return snaps.filter((s) => s.hasLive);
    if (filter === "complete")
      return snaps.filter((s) => !s.hasLive && s.leaderPts >= 6);
    return snaps.filter((s) => !s.hasLive && s.leaderPts < 6);
  }, [snaps, filter]);

  const liveCount = snaps.filter((s) => s.hasLive).length;
  const totalGoals = snaps.reduce(
    (n, s) => n + s.standings.reduce((m, r) => m + r.gf, 0),
    0,
  );
  const fromMock = blocks.some((b) => b.fromMock);

  return (
    <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-neon-cyan">
              All standings · 12 groups · 48 teams
            </p>
            {fromMock && (
              <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-amber-300">
                Demo data
              </span>
            )}
          </div>
          <h1 className="mt-3 font-display text-5xl font-black tracking-tight text-fg sm:text-6xl">
            Group{" "}
            <span className="bg-gradient-to-r from-neon-cyan via-neon-lime to-neon-magenta bg-clip-text text-transparent">
              standings
            </span>
          </h1>
          <p className="mt-3 max-w-xl text-sm text-fg-muted">
            Live tables, sorted by points → goal difference → goals for. Tap any
            group to drill in.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-line/10 bg-surface-2 px-4 py-3 shadow-ring">
          <Stat label="Live now" value={liveCount.toString()} accent="red" />
          <Divider />
          <Stat label="Goals" value={totalGoals.toString()} accent="lime" />
          <Divider />
          <Stat label="Matchday" value="MD3" accent="cyan" />
        </div>
      </header>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <FilterBar value={filter} onChange={setFilter} liveCount={liveCount} />
        <ViewToggle value={view} onChange={setView} />
      </div>

      {filtered.length === 0 && (
        <div className="mt-10 rounded-3xl border border-dashed border-line/20 bg-surface-2/40 p-10 text-center">
          <p className="font-mono text-[11px] uppercase tracking-widest text-fg-dim">
            No groups match this filter
          </p>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-line/15 bg-surface-3 px-4 py-2 text-sm font-semibold text-fg transition hover:border-line/30"
          >
            Show all 12
          </button>
        </div>
      )}

      {view === "grid" && filtered.length > 0 && (
        <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s, i) => (
            <motion.div
              key={s.block.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.45,
                delay: i * 0.03,
                type: "spring",
                stiffness: 120,
                damping: 20,
              }}
            >
              <Link href={`/standings/${s.block.letter}`} className="block">
                <StandingsCard
                  group={s.group}
                  standings={s.standings}
                  winner={picksByGroupId?.[s.block.id]?.winner}
                  runner={picksByGroupId?.[s.block.id]?.runner}
                />
              </Link>
            </motion.div>
          ))}
        </section>
      )}

      {view === "compact" && filtered.length > 0 && (
        <section className="mt-6 overflow-hidden rounded-3xl border border-line/10 bg-surface-2 shadow-ring">
          <div className="grid grid-cols-[40px_1fr_60px_60px_60px_60px] gap-2 border-b border-line/10 bg-surface-3/40 px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-fg-dim">
            <span>Grp</span>
            <span>Leader</span>
            <span className="text-right">Pts</span>
            <span className="text-right">GD</span>
            <span className="text-right">2nd</span>
            <span className="text-right">Status</span>
          </div>
          <ul>
            {filtered.map((s, i) => {
              const leaderRow = s.standings[0];
              const secondRow = s.standings[1];
              const leaderTeam = leaderRow
                ? s.group.teams.find((t) => t.id === leaderRow.teamId)
                : undefined;
              const secondTeam = secondRow
                ? s.group.teams.find((t) => t.id === secondRow.teamId)
                : undefined;
              return (
                <motion.li
                  key={s.block.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-line/5 last:border-b-0"
                >
                  <Link
                    href={`/standings/${s.block.letter}`}
                    className="grid grid-cols-[40px_1fr_60px_60px_60px_60px] items-center gap-2 px-4 py-3 transition hover:bg-surface-3/40"
                  >
                    <span
                      className="grid h-7 w-7 place-items-center rounded-lg font-display text-sm font-black text-ink-900"
                      style={{
                        background: `linear-gradient(135deg, ${s.group.accent.from}, ${s.group.accent.to})`,
                      }}
                    >
                      {s.group.letter}
                    </span>
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="text-lg leading-none">
                        {leaderTeam?.flag ?? "🏳️"}
                      </span>
                      <span className="truncate text-[13px] font-semibold text-fg">
                        {leaderTeam?.name ?? "—"}
                      </span>
                    </div>
                    <span className="text-right font-mono text-[13px] font-black tabular-nums text-fg">
                      {s.leaderPts}
                    </span>
                    <span
                      className={`text-right font-mono text-[12px] tabular-nums ${s.leaderGd > 0 ? "text-emerald-300" : s.leaderGd < 0 ? "text-rose-300" : "text-fg-muted"}`}
                    >
                      {s.leaderGd > 0 ? "+" : ""}
                      {s.leaderGd}
                    </span>
                    <span className="flex justify-end">
                      {secondTeam ? (
                        <span className="text-lg leading-none">
                          {secondTeam.flag}
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-fg-dim">
                          —
                        </span>
                      )}
                    </span>
                    <span className="flex justify-end">
                      {s.hasLive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-widest text-red-300">
                          <motion.span
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 1.4, repeat: Infinity }}
                            className="h-1 w-1 rounded-full bg-red-500"
                          />
                          Live
                        </span>
                      ) : (
                        <span className="font-mono text-[9px] uppercase tracking-widest text-fg-dim">
                          MD2
                        </span>
                      )}
                    </span>
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-fg-dim">
          Jump to group
        </p>
        <div className="flex flex-wrap gap-2">
          {snaps.map((s) => (
            <Link
              key={s.block.id}
              href={`/standings/${s.block.letter}`}
              className="grid h-10 w-10 place-items-center rounded-xl font-display text-base font-black text-fg transition"
              style={{
                background: "rgb(var(--surface-2))",
                boxShadow: "inset 0 0 0 1px rgb(var(--line) / 0.1)",
              }}
            >
              {s.block.letter}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "red" | "lime" | "cyan";
}) {
  const color =
    accent === "red"
      ? "text-red-300"
      : accent === "lime"
        ? "text-neon-lime"
        : "text-neon-cyan";
  return (
    <div className="text-right">
      <p className="font-mono text-[9px] uppercase tracking-widest text-fg-dim">
        {label}
      </p>
      <p className={`mt-0.5 font-mono text-lg font-black tabular-nums ${color}`}>
        {value}
      </p>
    </div>
  );
}

function Divider() {
  return <span className="h-8 w-px bg-line/10" />;
}

function FilterBar({
  value,
  onChange,
  liveCount,
}: {
  value: Filter;
  onChange: (v: Filter) => void;
  liveCount: number;
}) {
  const filters: { id: Filter; label: string; badge?: string }[] = [
    { id: "all", label: "All" },
    {
      id: "live",
      label: "Live",
      badge: liveCount > 0 ? String(liveCount) : undefined,
    },
    { id: "complete", label: "Decided" },
    { id: "upcoming", label: "Open" },
  ];
  return (
    <div className="flex rounded-2xl border border-line/10 bg-surface-2 p-1 shadow-ring">
      {filters.map((f) => {
        const active = value === f.id;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onChange(f.id)}
            className="relative px-3 py-1.5 text-sm font-semibold transition"
          >
            {active && (
              <motion.span
                layoutId="filter-bg"
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-neon-cyan/15 to-neon-lime/15"
                style={{ boxShadow: "inset 0 0 0 1px rgb(34 211 238 / 0.35)" }}
              />
            )}
            <span
              className={`relative inline-flex items-center gap-1.5 ${active ? "text-fg" : "text-fg-muted"}`}
            >
              {f.label}
              {f.badge && (
                <span className="rounded-md bg-red-500/20 px-1 font-mono text-[9px] font-black text-red-300">
                  {f.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ViewToggle({
  value,
  onChange,
}: {
  value: View;
  onChange: (v: View) => void;
}) {
  return (
    <div className="flex rounded-xl border border-line/10 bg-surface-2 p-1 shadow-ring">
      {(["grid", "compact"] as const).map((v) => {
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`rounded-lg px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition ${active ? "bg-surface-3 text-fg" : "text-fg-dim hover:text-fg"}`}
          >
            {v === "grid" ? "▦ Grid" : "≡ List"}
          </button>
        );
      })}
    </div>
  );
}
