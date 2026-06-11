"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { MockGroup, MockStanding } from "@/lib/mock";
import { PlayerCollage } from "@/components/player-collage";
import { StandingsCard } from "@/components/standings-card";
import { projectGroupPoints } from "@/lib/scoring";

type Picks = Record<string, { winner?: string; runner?: string }>;
type Mode = "picks" | "standings";

type SaveResult =
  | { ok: true; count: number }
  | { ok: false; error: string };

export function BracketView({
  groups,
  standingsByGroupId,
  fromMock,
  initialPicks,
  saveAction,
  alreadyLocked,
}: {
  groups: MockGroup[];
  standingsByGroupId: Record<string, MockStanding[]>;
  fromMock: boolean;
  initialPicks?: Picks;
  saveAction?: (
    input: {
      groupId: string;
      pickType: "group_winner" | "group_runner_up";
      teamId: string;
    }[],
  ) => Promise<SaveResult>;
  alreadyLocked?: boolean;
}) {
  const [picks, setPicks] = useState<Picks>(initialPicks ?? {});
  const [confettiKey, setConfettiKey] = useState(0);
  const [locked, setLocked] = useState(false);
  const [mode, setMode] = useState<Mode>(
    alreadyLocked ? "standings" : "picks",
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();

  const projectedTotal = useMemo(() => {
    let total = 0;
    let provisional = false;
    for (const g of groups) {
      const rows = standingsByGroupId[g.id] ?? [];
      const decided = (rows[0]?.mp ?? 0) >= 3;
      const proj = projectGroupPoints(
        rows,
        picks[g.id]?.winner,
        picks[g.id]?.runner,
        decided,
      );
      total += proj.points;
      if (proj.provisional) provisional = true;
    }
    return { points: total, provisional };
  }, [groups, standingsByGroupId, picks]);

  const totalSlots = groups.length * 2;
  const filled = useMemo(
    () =>
      Object.values(picks).reduce(
        (n, p) => n + (p.winner ? 1 : 0) + (p.runner ? 1 : 0),
        0,
      ),
    [picks],
  );

  const progress = filled / totalSlots;

  function cycle(groupId: string, teamId: string) {
    setPicks((prev) => {
      const cur = prev[groupId] ?? {};
      let next: { winner?: string; runner?: string };
      if (cur.winner === teamId) next = { winner: undefined, runner: cur.runner };
      else if (cur.runner === teamId) next = { winner: cur.winner, runner: undefined };
      else if (!cur.winner) next = { winner: teamId, runner: cur.runner };
      else if (!cur.runner) next = { winner: cur.winner, runner: teamId };
      else next = { winner: teamId, runner: cur.winner };

      const updated = { ...prev, [groupId]: next };
      const newFilled = Object.values(updated).reduce(
        (n, p) => n + (p.winner ? 1 : 0) + (p.runner ? 1 : 0),
        0,
      );
      if (newFilled === totalSlots && filled !== totalSlots) {
        setConfettiKey((k) => k + 1);
      }
      return updated;
    });
  }

  return (
    <div className="relative mx-auto max-w-6xl px-4 pb-32 pt-8 sm:px-6 sm:pt-12">
      <PlayerCollage variant="banner" />
      <Header progress={progress} filled={filled} total={totalSlots} fromMock={fromMock} />

      <ModeTabs mode={mode} onChange={setMode} />

      {mode === "standings" && filled > 0 && (
        <ScoreTotalBanner
          points={projectedTotal.points}
          provisional={projectedTotal.provisional}
          filled={filled}
          total={totalSlots}
        />
      )}

      <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g, i) => (
          <motion.div
            key={`${mode}-${g.id}`}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.5,
              delay: i * 0.03,
              type: "spring",
              stiffness: 110,
              damping: 18,
            }}
          >
            {mode === "picks" ? (
              <GroupCard
                group={g}
                winner={picks[g.id]?.winner}
                runner={picks[g.id]?.runner}
                onPick={(teamId) => cycle(g.id, teamId)}
              />
            ) : (
              <StandingsCard
                group={g}
                winner={picks[g.id]?.winner}
                runner={picks[g.id]?.runner}
                standings={standingsByGroupId[g.id]}
              />
            )}
          </motion.div>
        ))}
      </section>

      <SubmitBar
        filled={filled}
        total={totalSlots}
        hidden={mode === "standings"}
        isSaving={isSaving}
        saveError={saveError}
        onLock={() => {
          if (!saveAction) {
            setLocked(true);
            setConfettiKey((k) => k + 1);
            return;
          }
          // Flatten picks into the API input shape
          const input: {
            groupId: string;
            pickType: "group_winner" | "group_runner_up";
            teamId: string;
          }[] = [];
          for (const [groupId, p] of Object.entries(picks)) {
            if (p.winner)
              input.push({
                groupId,
                pickType: "group_winner",
                teamId: p.winner,
              });
            if (p.runner)
              input.push({
                groupId,
                pickType: "group_runner_up",
                teamId: p.runner,
              });
          }
          setSaveError(null);
          startSave(async () => {
            const result = await saveAction(input);
            if (result.ok) {
              setLocked(true);
              setConfettiKey((k) => k + 1);
            } else {
              setSaveError(result.error);
            }
          });
        }}
      />

      <AnimatePresence>
        {confettiKey > 0 && (
          <Confetti key={confettiKey} onDone={() => setConfettiKey(0)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {locked && (
          <LockedModal
            picks={picks}
            totalGroups={groups.length}
            onClose={() => setLocked(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Header({
  progress,
  filled,
  total,
  fromMock,
}: {
  progress: number;
  filled: number;
  total: number;
  fromMock: boolean;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-6">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-neon-lime">
            Phase 01 · Group stage · 48 teams · 12 groups
          </p>
          {fromMock && (
            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-amber-300">
              Demo data
            </span>
          )}
        </div>
        <h1 className="mt-3 font-display text-5xl font-black tracking-tight sm:text-6xl text-fg">
          Pick your{" "}
          <span className="bg-gradient-to-r from-neon-lime via-neon-cyan to-neon-magenta bg-clip-text text-transparent">
            top 2
          </span>
        </h1>
        <p className="mt-3 max-w-xl text-sm text-fg-muted">
          Tap once for the <span className="font-semibold text-fg">group winner</span>, tap a second team
          for the <span className="font-semibold text-fg">runner-up</span>. Tap again to clear.
        </p>
      </div>
      <ProgressRing progress={progress} filled={filled} total={total} />
    </header>
  );
}

function ScoreTotalBanner({
  points,
  provisional,
  filled,
  total,
}: {
  points: number;
  provisional: boolean;
  filled: number;
  total: number;
}) {
  const maxPossible = (total / 2) * 18;
  const pct = maxPossible === 0 ? 0 : points / maxPossible;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
      className="mt-5 overflow-hidden rounded-2xl border border-line/10 bg-surface-2 shadow-ring"
    >
      <div className="flex flex-wrap items-center gap-4 px-5 py-4">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-fg-dim">
            {provisional ? "Projected total" : "Locked total"}
          </span>
          {provisional && (
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              className="h-1.5 w-1.5 rounded-full bg-red-500"
            />
          )}
        </div>
        <motion.span
          key={points}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 18 }}
          className="font-display text-3xl font-black tracking-tight tabular-nums text-fg"
        >
          {provisional && "~"}+{points}
          <span className="ml-1 text-base text-fg-dim">pts</span>
        </motion.span>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-fg-dim">
          {filled}/{total} picks · max {maxPossible}
        </span>
      </div>
      <div className="h-1 w-full bg-surface-3">
        <motion.div
          className="h-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, pct * 100)}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          style={{ background: "linear-gradient(90deg, #C6FF3D, #22D3EE, #F472B6)" }}
        />
      </div>
    </motion.div>
  );
}

function ModeTabs({
  mode,
  onChange,
}: {
  mode: "picks" | "standings";
  onChange: (m: "picks" | "standings") => void;
}) {
  const tabs: { id: "picks" | "standings"; label: string; sub: string }[] = [
    { id: "picks", label: "Your picks", sub: "Tap to choose top 2" },
    { id: "standings", label: "Live standings", sub: "Real tables · MD3 coming" },
  ];
  return (
    <div className="mt-8 flex w-full max-w-xl rounded-2xl border border-line/10 bg-surface-2 p-1.5 shadow-ring">
      {tabs.map((t) => {
        const active = mode === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className="group relative flex-1 rounded-xl px-3 py-2 text-left transition"
          >
            {active && (
              <motion.span
                layoutId="mode-tab-bg"
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-neon-lime/15 via-neon-cyan/15 to-neon-magenta/15"
                style={{ boxShadow: "inset 0 0 0 1px rgb(198 255 61 / 0.35)" }}
              />
            )}
            <span className="relative flex items-center gap-2">
              <span
                className={`font-display text-sm font-bold tracking-tight transition ${active ? "text-fg" : "text-fg-muted group-hover:text-fg"}`}
              >
                {t.label}
              </span>
              {t.id === "standings" && (
                <motion.span
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                  className="h-1.5 w-1.5 rounded-full bg-red-500"
                />
              )}
            </span>
            <span className="relative mt-0.5 block font-mono text-[10px] uppercase tracking-widest text-fg-dim">
              {t.sub}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ProgressRing({
  progress,
  filled,
  total,
}: {
  progress: number;
  filled: number;
  total: number;
}) {
  const R = 30;
  const C = 2 * Math.PI * R;
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="flex items-center gap-3 rounded-2xl border border-line/10 bg-surface-2 px-4 py-3 shadow-ring"
    >
      <div className="relative h-16 w-16">
        <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
          <defs>
            <linearGradient id="ringG" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C6FF3D" />
              <stop offset="50%" stopColor="#22D3EE" />
              <stop offset="100%" stopColor="#F472B6" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r={R} stroke="rgb(var(--line) / 0.12)" strokeWidth="6" fill="none" />
          <motion.circle
            cx="32" cy="32" r={R}
            stroke="url(#ringG)"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={C}
            animate={{ strokeDashoffset: C * (1 - progress) }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center font-mono text-sm font-bold text-fg">
          {Math.round(progress * 100)}%
        </div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-widest text-fg-dim">Picks</div>
        <div className="font-mono text-lg font-bold tabular-nums text-fg">
          {filled}
          <span className="text-fg-dim"> / {total}</span>
        </div>
      </div>
    </motion.div>
  );
}

function GroupCard({
  group,
  winner,
  runner,
  onPick,
}: {
  group: MockGroup;
  winner: string | undefined;
  runner: string | undefined;
  onPick: (teamId: string) => void;
}) {
  const { letter, teams, accent } = group;
  const filled = (winner ? 1 : 0) + (runner ? 1 : 0);

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative overflow-hidden rounded-3xl border border-line/10 bg-surface-2 p-4 shadow-ring"
      style={{
        boxShadow:
          filled === 2
            ? `0 0 0 1px ${accent.ring}55, 0 24px 60px -20px ${accent.from}66`
            : undefined,
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-1.5"
        style={{ background: `linear-gradient(90deg, ${accent.from}, ${accent.to})` }}
      />
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-20 blur-3xl transition group-hover:opacity-40"
        style={{ background: accent.from }}
      />

      <div className="relative mb-3 flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <span
            className="grid h-9 w-9 place-items-center rounded-xl font-display text-lg font-black text-ink-900 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${accent.from}, ${accent.to})` }}
          >
            {letter}
          </span>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.18em] text-fg-dim">
              Group
            </span>
            <span className="font-mono text-[11px] text-fg-muted">
              {filled === 2 ? "Complete ✓" : `${filled}/2 picks`}
            </span>
          </div>
        </div>
      </div>

      <ul className="relative space-y-1.5">
        {teams.map((tm) => {
          const isWinner = winner === tm.id;
          const isRunner = runner === tm.id;
          const state: "idle" | "winner" | "runner" = isWinner
            ? "winner"
            : isRunner
              ? "runner"
              : "idle";
          return (
            <li key={tm.id}>
              <motion.button
                type="button"
                onClick={() => onPick(tm.id)}
                whileTap={{ scale: 0.97 }}
                whileHover={{ x: 2 }}
                className="relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition"
                style={{
                  background:
                    state === "winner"
                      ? `linear-gradient(90deg, ${accent.from}33, ${accent.to}11)`
                      : state === "runner"
                        ? `linear-gradient(90deg, ${accent.from}1a, transparent)`
                        : "rgb(var(--surface-3) / 0.4)",
                  boxShadow:
                    state === "winner"
                      ? `inset 0 0 0 1.5px ${accent.ring}`
                      : state === "runner"
                        ? `inset 0 0 0 1px ${accent.ring}66`
                        : "inset 0 0 0 1px rgb(var(--line) / 0.08)",
                }}
              >
                <motion.span
                  animate={state !== "idle" ? { scale: [1, 1.25, 1] } : {}}
                  transition={{ duration: 0.4 }}
                  className="text-2xl leading-none"
                  style={{
                    filter:
                      state !== "idle"
                        ? "drop-shadow(0 0 8px rgba(255,255,255,0.4))"
                        : undefined,
                  }}
                >
                  {tm.flag}
                </motion.span>
                <span className="flex-1 truncate text-[15px] font-semibold text-fg">
                  {tm.name}
                </span>
                <span className="hidden font-mono text-[10px] text-fg-dim sm:inline">
                  {tm.code}
                </span>
                <AnimatePresence mode="wait">
                  {state !== "idle" && (
                    <motion.span
                      key={state}
                      initial={{ scale: 0.4, opacity: 0, rotate: -12 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      exit={{ scale: 0.4, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 420, damping: 18 }}
                      className="rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-widest text-ink-900 shadow-md"
                      style={{
                        background:
                          state === "winner"
                            ? `linear-gradient(135deg, ${accent.from}, ${accent.to})`
                            : "rgba(255,255,255,0.85)",
                      }}
                    >
                      {state === "winner" ? "1st 🏆" : "2nd"}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
}

function SubmitBar({
  filled,
  total,
  onLock,
  hidden,
  isSaving,
  saveError,
}: {
  filled: number;
  total: number;
  onLock: () => void;
  hidden?: boolean;
  isSaving?: boolean;
  saveError?: string | null;
}) {
  const ready = filled === total && !isSaving;
  if (hidden) return null;
  return (
    <motion.div
      initial={{ y: 32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 22 }}
      className="fixed inset-x-0 bottom-4 z-30 mx-auto flex max-w-2xl items-center justify-between gap-4 rounded-2xl border border-line/10 bg-surface-2/95 px-4 py-3 shadow-ring backdrop-blur-xl sm:px-5"
    >
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10">
          <svg viewBox="0 0 40 40" className="h-full w-full -rotate-90">
            <circle cx="20" cy="20" r="16" stroke="rgb(var(--line) / 0.12)" strokeWidth="4" fill="none" />
            <motion.circle
              cx="20" cy="20" r="16"
              stroke="#C6FF3D" strokeWidth="4" strokeLinecap="round" fill="none"
              strokeDasharray={2 * Math.PI * 16}
              animate={{ strokeDashoffset: 2 * Math.PI * 16 * (1 - filled / total) }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </svg>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-fg-dim">Bracket</p>
          <p className="font-mono text-sm font-bold text-fg">
            {filled}
            <span className="text-fg-dim"> / {total}</span>
          </p>
          {saveError && (
            <p className="font-mono text-[9px] text-rose-300">
              {saveError}
            </p>
          )}
        </div>
      </div>
      <motion.button
        type="button"
        disabled={!ready}
        onClick={() => {
          if (ready) onLock();
        }}
        whileTap={ready ? { scale: 0.96 } : {}}
        whileHover={ready ? { scale: 1.03 } : {}}
        className={`group inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition ${
          ready
            ? "bg-gradient-to-r from-neon-lime via-pitch-300 to-neon-cyan text-ink-900 shadow-glow"
            : "cursor-not-allowed bg-surface-3 text-fg-dim"
        }`}
      >
        {isSaving
          ? "Saving…"
          : filled === total
            ? "Lock it in 🔒"
            : `${total - filled} left`}
        <span className="transition group-hover:translate-x-0.5">→</span>
      </motion.button>
    </motion.div>
  );
}

function Confetti({ onDone }: { onDone: () => void }) {
  const pieces = Array.from({ length: 90 });
  const palette = ["#C6FF3D", "#22D3EE", "#F472B6", "#FFD23F", "#FF8A4C", "#A855F7"];
  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {pieces.map((_, i) => {
        const x = Math.random() * 100;
        const delay = Math.random() * 0.3;
        const dur = 1.4 + Math.random() * 1.6;
        const color = palette[i % palette.length];
        const rot = Math.random() * 720 - 360;
        const shape = i % 3 === 0 ? "rounded-full" : "rounded-sm";
        return (
          <motion.span
            key={i}
            initial={{ y: -20, x: `${x}vw`, rotate: 0, opacity: 1, scale: 0.5 + Math.random() }}
            animate={{ y: "110vh", rotate: rot, opacity: 0 }}
            transition={{ duration: dur, delay, ease: "easeIn" }}
            onAnimationComplete={() => i === pieces.length - 1 && onDone()}
            style={{ backgroundColor: color }}
            className={`absolute top-0 h-2.5 w-2.5 ${shape}`}
          />
        );
      })}
    </div>
  );
}

function LockedModal({
  picks,
  totalGroups,
  onClose,
}: {
  picks: Picks;
  totalGroups: number;
  onClose: () => void;
}) {
  const completed = Object.values(picks).filter(
    (p) => p.winner && p.runner,
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center px-4"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-ink-900/70 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-line/15 bg-surface-2 p-7 shadow-glow"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-neon-lime via-neon-cyan to-neon-magenta" />

        <motion.div
          initial={{ scale: 0.6, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.05, type: "spring", stiffness: 200, damping: 14 }}
          className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-neon-lime to-neon-cyan text-3xl shadow-glow"
        >
          🔒
        </motion.div>

        <h2 className="text-center font-display text-3xl font-black tracking-tight text-fg">
          Bracket locked!
        </h2>
        <p className="mx-auto mt-2 max-w-xs text-center text-sm text-fg-muted">
          You picked winners + runners-up across all{" "}
          <span className="font-semibold text-fg">{completed}</span> groups.
          Good luck — you can edit until the first kickoff.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl border border-line/10 bg-surface-3 p-3 text-center">
          <Stat label="Groups" value={`${completed}/${totalGroups}`} />
          <Stat label="Picks" value={`${completed * 2}`} />
          <Stat label="Round" value="Group" />
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/leaderboard"
            onClick={onClose}
            className="group inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-neon-lime via-pitch-300 to-neon-cyan px-4 py-3 text-sm font-bold text-ink-900 shadow-glow transition hover:brightness-110"
          >
            View leaderboard
            <span className="transition group-hover:translate-x-0.5">→</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-line/15 bg-surface-3 px-4 py-3 text-sm font-semibold text-fg transition hover:border-line/30"
          >
            Edit picks
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-fg-dim">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-fg">
        {value}
      </p>
    </div>
  );
}
