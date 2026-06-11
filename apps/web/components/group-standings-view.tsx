"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { StandingsCard } from "@/components/standings-card";
import type { ApiGroupBlock } from "@/lib/api";
import {
  formatKickoff,
  groupFromApiBlock,
  standingsFromApiBlock,
} from "@/lib/api-adapters";

export function GroupStandingsView({
  block,
  jumpLetters,
  myPick,
}: {
  block: ApiGroupBlock;
  jumpLetters: string[];
  myPick?: { winner?: string; runner?: string };
}) {
  const group = groupFromApiBlock(block);
  const standings = standingsFromApiBlock(block);
  const { accent, letter, teams } = group;
  const fromMock = block.fromMock === true;

  return (
    <div className="relative mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
      {/* glow background */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] opacity-30 blur-3xl"
        style={{
          background: `radial-gradient(60% 50% at 50% 0%, ${accent.from}88, transparent 70%)`,
        }}
      />

      <div className="flex items-center justify-between">
        <Link
          href="/standings"
          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-fg-dim transition hover:text-fg"
        >
          ← All standings
        </Link>
        <DataBadge fromMock={fromMock} live={block.hasLive} />
      </div>

      {/* hero */}
      <header className="mt-6 flex flex-wrap items-end justify-between gap-6">
        <div className="flex items-center gap-5">
          <motion.div
            initial={{ scale: 0.6, rotate: -10, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 180, damping: 16 }}
            className="grid h-20 w-20 place-items-center rounded-2xl font-display text-5xl font-black text-ink-900 shadow-glow"
            style={{
              background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
            }}
          >
            {letter}
          </motion.div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-fg-dim">
              Group {letter} · Live standings
            </p>
            <h1 className="mt-2 font-display text-4xl font-black tracking-tight text-fg sm:text-5xl">
              {teams.map((t) => t.flag).join("  ")}
            </h1>
            <p className="mt-2 font-mono text-xs text-fg-muted">
              {teams.map((t) => t.code).join(" · ")}
            </p>
          </div>
        </div>

        {block.next && (
          <NextFixtureChip
            home={block.next.homeFlag ?? "🏳️"}
            away={block.next.awayFlag ?? "🏳️"}
            label={formatKickoff(block.next.kickoffAt)}
            md="MD3"
            accent={accent}
          />
        )}
      </header>

      {/* main */}
      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_320px]">
        <StandingsCard
          group={group}
          standings={standings}
          winner={myPick?.winner}
          runner={myPick?.runner}
        />

        <aside className="space-y-4">
          {/* placeholder live activity */}
          <div className="rounded-3xl border border-line/10 bg-surface-2 p-4 shadow-ring">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-widest text-fg-dim">
                Group activity
              </p>
              <span
                className="rounded-md px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider"
                style={{
                  background: `${accent.from}22`,
                  color: accent.text,
                }}
              >
                Coming soon
              </span>
            </div>
            <p className="py-6 text-center font-mono text-[11px] text-fg-dim">
              Live event feed wires in next.
            </p>
          </div>

          {/* teams list */}
          <div className="rounded-3xl border border-line/10 bg-surface-2 p-4 shadow-ring">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-fg-dim">
              Squad list
            </p>
            <ul className="space-y-1.5">
              {teams.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-2 rounded-xl bg-surface-3/40 px-2.5 py-2"
                >
                  <span className="text-lg leading-none">{t.flag}</span>
                  <span className="flex-1 text-[13px] font-semibold text-fg">
                    {t.name}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-fg-dim">
                    {t.code}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* jump pad */}
      <section className="mt-10">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-fg-dim">
          Jump to group
        </p>
        <div className="flex flex-wrap gap-2">
          {jumpLetters.map((l) => {
            const active = l === letter;
            const ac = active ? accent : null;
            return (
              <Link
                key={l}
                href={`/standings/${l}`}
                className="grid h-10 w-10 place-items-center rounded-xl font-display text-base font-black transition"
                style={{
                  background: ac
                    ? `linear-gradient(135deg, ${ac.from}, ${ac.to})`
                    : "rgb(var(--surface-2))",
                  color: ac ? "#0b0d12" : "rgb(var(--fg))",
                  boxShadow: ac
                    ? `0 10px 30px -8px ${ac.from}88`
                    : "inset 0 0 0 1px rgb(var(--line) / 0.1)",
                }}
              >
                {l}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function DataBadge({ fromMock, live }: { fromMock: boolean; live: boolean }) {
  if (fromMock) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-widest text-amber-300">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        Demo data
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-widest"
      style={{
        background: live ? "rgb(239 68 68 / 0.15)" : "rgb(34 197 94 / 0.12)",
        borderColor: live ? "rgb(239 68 68 / 0.4)" : "rgb(34 197 94 / 0.3)",
        color: live ? "#fca5a5" : "#86efac",
      }}
    >
      <motion.span
        animate={{ opacity: live ? [1, 0.3, 1] : 1 }}
        transition={{ duration: 1.4, repeat: Infinity }}
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: live ? "#ef4444" : "#22c55e" }}
      />
      {live ? "Live API" : "Live · DB"}
    </span>
  );
}

function NextFixtureChip({
  home,
  away,
  label,
  md,
  accent,
}: {
  home: string;
  away: string;
  label: string;
  md: string;
  accent: { from: string; to: string; ring: string; text: string };
}) {
  return (
    <div className="rounded-2xl border border-line/10 bg-surface-2 px-4 py-3 shadow-ring">
      <p className="font-mono text-[10px] uppercase tracking-widest text-fg-dim">
        {md} · Up next
      </p>
      <div className="mt-1.5 flex items-center gap-2 text-xl">
        <span>{home}</span>
        <span className="font-mono text-xs text-fg-muted">vs</span>
        <span>{away}</span>
      </div>
      <p
        className="mt-1 font-mono text-[10px] font-bold uppercase tracking-wider"
        style={{ color: accent.text }}
      >
        {label}
      </p>
    </div>
  );
}
