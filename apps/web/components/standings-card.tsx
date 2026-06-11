"use client";

import { motion } from "framer-motion";
import {
  MOCK_NEXT_FIXTURES,
  MOCK_STANDINGS,
  type MockGroup,
  type MockStanding,
} from "@/lib/mock";
import { awardForTeam, projectGroupPoints, type RowAward } from "@/lib/scoring";

type Props = {
  group: MockGroup;
  winner?: string;
  runner?: string;
  /** Pre-computed live standings; falls back to base mock. */
  standings?: MockStanding[];
  /** Team ids whose row should pulse (received a live update). */
  flashed?: Set<string>;
};

export function StandingsCard({ group, winner, runner, standings, flashed }: Props) {
  const { letter, teams, accent } = group;
  const rows = standings ?? MOCK_STANDINGS[group.id] ?? [];
  const fixture = MOCK_NEXT_FIXTURES[group.id];
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const homeTeam = fixture ? teamById.get(fixture.home) : undefined;
  const awayTeam = fixture ? teamById.get(fixture.away) : undefined;
  const isLive = (flashed?.size ?? 0) > 0;
  const decided = (rows[0]?.mp ?? 0) >= 3;
  const projection = projectGroupPoints(rows, winner, runner, decided);

  // Predicted finishers per pick
  const predicted = new Set([winner, runner].filter(Boolean) as string[]);

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative overflow-hidden rounded-3xl border border-line/10 bg-surface-2 p-4 shadow-ring"
    >
      <div
        className="absolute inset-x-0 top-0 h-1.5"
        style={{ background: `linear-gradient(90deg, ${accent.from}, ${accent.to})` }}
      />
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-20 blur-3xl transition group-hover:opacity-40"
        style={{ background: accent.from }}
      />

      {/* header */}
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
              Group · live
            </span>
            <span className="font-mono text-[11px] text-fg-muted">
              {rows[0]?.mp ?? 0} of 3 matchdays
            </span>
          </div>
        </div>
        {/* live pulse */}
        <div
          className="flex items-center gap-1.5 rounded-full border px-2 py-0.5"
          style={{
            background: isLive ? "rgb(239 68 68 / 0.15)" : "rgb(var(--surface-3) / 0.6)",
            borderColor: isLive ? "rgb(239 68 68 / 0.45)" : "rgb(var(--line) / 0.15)",
          }}
        >
          <motion.span
            animate={{ opacity: isLive ? [1, 0.3, 1] : 0.4 }}
            transition={{ duration: 1.4, repeat: Infinity }}
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: isLive ? "#ef4444" : "rgb(var(--fg-dim))" }}
          />
          <span
            className="font-mono text-[9px] font-bold uppercase tracking-widest"
            style={{ color: isLive ? "#fca5a5" : "rgb(var(--fg-dim))" }}
          >
            {isLive ? "Live" : "Idle"}
          </span>
        </div>
      </div>

      {/* table header */}
      <div className="relative grid grid-cols-[14px_1fr_22px_22px_22px_28px_28px_42px] gap-1 px-2 pb-1.5 text-[9px] font-mono uppercase tracking-widest text-fg-dim">
        <span>#</span>
        <span>Team</span>
        <span className="text-right">MP</span>
        <span className="text-right">W</span>
        <span className="text-right">D</span>
        <span className="text-right">GD</span>
        <span className="text-right">Pts</span>
        <span className="text-right">Form</span>
      </div>

      {/* rows */}
      <ul className="relative space-y-1">
        {rows.map((row, idx) => {
          const team = teamById.get(row.teamId);
          if (!team) return null;
          const pos = idx + 1;
          const qualifying = pos <= 2;
          const isPick = predicted.has(team.id);
          const isFlashing = flashed?.has(team.id) ?? false;

          // outcome dot for user pick
          let pickStatus: "nailed" | "danger" | "missed" | null = null;
          if (winner === team.id) {
            if (pos === 1) pickStatus = "nailed";
            else if (pos === 2) pickStatus = "danger";
            else pickStatus = "missed";
          } else if (runner === team.id) {
            if (pos === 2) pickStatus = "nailed";
            else if (pos === 1 || pos === 3) pickStatus = "danger";
            else pickStatus = "missed";
          } else if (qualifying && predicted.size > 0) {
            // a team you didn't pick is in qualifying slot
            pickStatus = "danger";
          }

          return (
            <li key={team.id}>
              <motion.div
                layout
                whileHover={{ x: 2 }}
                animate={
                  isFlashing
                    ? {
                        boxShadow: [
                          `inset 0 0 0 1px ${accent.ring}44`,
                          `inset 0 0 0 2px ${accent.from}, 0 0 24px ${accent.from}77`,
                          `inset 0 0 0 1px ${accent.ring}44`,
                        ],
                      }
                    : {}
                }
                transition={{ duration: 0.9 }}
                className="relative grid grid-cols-[14px_1fr_22px_22px_22px_28px_28px_42px] items-center gap-1 rounded-xl px-2 py-2"
                style={{
                  background: qualifying
                    ? `linear-gradient(90deg, ${accent.from}22, transparent 80%)`
                    : "rgb(var(--surface-3) / 0.35)",
                  boxShadow: qualifying
                    ? `inset 0 0 0 1px ${accent.ring}44`
                    : "inset 0 0 0 1px rgb(var(--line) / 0.06)",
                }}
              >
                {/* qualification stripe */}
                {qualifying && (
                  <span
                    className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full"
                    style={{ background: accent.from }}
                  />
                )}

                {/* position */}
                <span
                  className="font-mono text-[10px] font-bold tabular-nums"
                  style={{ color: qualifying ? accent.text : "rgb(var(--fg-dim))" }}
                >
                  {pos}
                </span>

                {/* team */}
                <div className="flex min-w-0 items-center gap-2">
                  <span className="text-lg leading-none">{team.flag}</span>
                  <span className="truncate text-[13px] font-semibold text-fg">
                    {team.name}
                  </span>
                  {isPick && (
                    <PickBadge
                      award={awardForTeam(team.id, pos, winner, runner, decided)}
                      pickedAs={winner === team.id ? "1st" : "2nd"}
                      accent={accent.ring}
                    />
                  )}
                </div>

                {/* numeric cols */}
                <Num value={row.mp} />
                <Num value={row.w} highlight={qualifying} />
                <Num value={row.d} />
                <Num
                  value={`${row.gd > 0 ? "+" : ""}${row.gd}`}
                  tone={row.gd > 0 ? "good" : row.gd < 0 ? "bad" : "neutral"}
                />
                <span className="text-right font-mono text-[13px] font-black tabular-nums text-fg">
                  {row.pts}
                </span>

                {/* form */}
                <div className="flex justify-end gap-0.5">
                  {row.form.map((f, fi) => (
                    <FormDot key={fi} result={f} />
                  ))}
                </div>

                {/* outcome indicator dot */}
                {pickStatus && (
                  <motion.span
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 320, damping: 18 }}
                    className="absolute -left-1 top-1/2 grid h-3 w-3 -translate-x-full -translate-y-1/2 place-items-center rounded-full text-[8px] font-black"
                    style={{
                      background:
                        pickStatus === "nailed"
                          ? "#22c55e"
                          : pickStatus === "danger"
                            ? "#f59e0b"
                            : "#ef4444",
                      boxShadow:
                        pickStatus === "nailed"
                          ? "0 0 12px #22c55e88"
                          : pickStatus === "danger"
                            ? "0 0 10px #f59e0b88"
                            : "0 0 8px #ef444488",
                    }}
                    title={
                      pickStatus === "nailed"
                        ? "Your pick is on track"
                        : pickStatus === "danger"
                          ? "Watch out — pick in danger"
                          : "Pick is out of qualifying"
                    }
                  />
                )}
              </motion.div>
            </li>
          );
        })}
      </ul>

      {/* next fixture */}
      {fixture && homeTeam && awayTeam && (
        <div className="relative mt-3 flex items-center justify-between rounded-xl border border-line/10 bg-surface-3/60 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-widest text-fg-dim">
              {fixture.md} · Next
            </span>
          </div>
          <div className="flex items-center gap-2 text-[12px] font-semibold text-fg">
            <span>{homeTeam.flag}</span>
            <span className="font-mono text-fg-muted">vs</span>
            <span>{awayTeam.flag}</span>
            <span
              className="ml-1 rounded-md px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider"
              style={{
                background: `${accent.from}22`,
                color: accent.text,
                boxShadow: `inset 0 0 0 1px ${accent.ring}55`,
              }}
            >
              {fixture.kickoff}
            </span>
          </div>
        </div>
      )}

      {/* pick summary footer */}
      {predicted.size > 0 && (
        <div className="relative mt-2 flex items-center justify-between gap-2 px-1 text-[10px] text-fg-muted">
          <div className="flex items-center gap-2">
            <span className="font-mono uppercase tracking-widest text-fg-dim">
              Your call:
            </span>
            <PickSummary
              winner={winner}
              runner={runner}
              standings={rows}
            />
          </div>
          <PointsChip points={projection.points} provisional={projection.provisional} />
        </div>
      )}
    </motion.div>
  );
}

function Num({
  value,
  tone = "neutral",
  highlight,
}: {
  value: number | string;
  tone?: "good" | "bad" | "neutral";
  highlight?: boolean;
}) {
  const color =
    tone === "good"
      ? "text-emerald-300"
      : tone === "bad"
        ? "text-rose-300"
        : highlight
          ? "text-fg"
          : "text-fg-muted";
  return (
    <span
      className={`text-right font-mono text-[12px] tabular-nums ${color} ${highlight ? "font-bold" : ""}`}
    >
      {value}
    </span>
  );
}

function FormDot({ result }: { result: "W" | "D" | "L" }) {
  const map = {
    W: { bg: "#22c55e", text: "W" },
    D: { bg: "#f59e0b", text: "D" },
    L: { bg: "#ef4444", text: "L" },
  } as const;
  const c = map[result];
  return (
    <span
      className="grid h-3.5 w-3.5 place-items-center rounded-full font-mono text-[7px] font-black text-ink-900"
      style={{ background: c.bg, boxShadow: `0 0 6px ${c.bg}55` }}
    >
      {c.text}
    </span>
  );
}

function PickBadge({
  award,
  pickedAs,
  accent,
}: {
  award: RowAward | null;
  pickedAs: "1st" | "2nd";
  accent: string;
}) {
  // Style varies by award status
  let bg = "transparent";
  let fg = accent;
  let ring = accent;
  let label = `Your ${pickedAs}`;

  if (award) {
    if (award.status === "nailed") {
      bg = "#22c55e";
      fg = "#0b0d12";
      ring = "#22c55e";
      label = `Your ${pickedAs} · ${award.label}`;
    } else if (award.status === "swap") {
      bg = "#f59e0b";
      fg = "#0b0d12";
      ring = "#f59e0b";
      label = `Your ${pickedAs} · ${award.label}`;
    } else if (award.status === "danger" || award.status === "missed") {
      bg = "transparent";
      fg = "#fca5a5";
      ring = "#ef4444";
      label = `Your ${pickedAs} · ${award.label}`;
    }
  }

  return (
    <motion.span
      key={award?.status ?? "none"}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 360, damping: 20 }}
      className="shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[8px] font-black uppercase tracking-wider"
      style={{
        background: bg,
        color: fg,
        boxShadow: `inset 0 0 0 1px ${ring}`,
      }}
    >
      {label}
    </motion.span>
  );
}

function PointsChip({
  points,
  provisional,
}: {
  points: number;
  provisional: boolean;
}) {
  const tone =
    points >= 14
      ? { bg: "#22c55e", text: "#052e16", glow: "#22c55e88" }
      : points >= 8
        ? { bg: "#a3e635", text: "#1a2e05", glow: "#a3e63577" }
        : points >= 4
          ? { bg: "#f59e0b", text: "#3b1e05", glow: "#f59e0b77" }
          : { bg: "rgb(var(--surface-3))", text: "rgb(var(--fg-dim))", glow: "transparent" };

  return (
    <motion.span
      key={points}
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 360, damping: 20 }}
      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-mono text-[10px] font-black uppercase tracking-widest"
      style={{
        background: tone.bg,
        color: tone.text,
        boxShadow: `0 0 12px ${tone.glow}`,
      }}
    >
      <span className="tabular-nums">
        {provisional ? "~" : ""}
        +{points}
      </span>
      <span className="opacity-70">pts</span>
    </motion.span>
  );
}

function PickSummary({
  winner,
  runner,
  standings,
}: {
  winner?: string;
  runner?: string;
  standings: MockStanding[];
}) {
  const posOf = (id?: string) => {
    if (!id) return null;
    const idx = standings.findIndex((s) => s.teamId === id);
    return idx === -1 ? null : idx + 1;
  };
  const wp = posOf(winner);
  const rp = posOf(runner);
  const wOk = wp === 1;
  const rOk = rp === 2;
  const bothOk = wOk && rOk;
  const anyMiss = (winner && wp !== 1 && wp !== null && wp > 2) || (runner && rp !== 2 && rp !== null && rp > 2);

  if (bothOk) {
    return (
      <span className="font-mono font-bold text-emerald-300">
        Both on track ✓
      </span>
    );
  }
  if (anyMiss) {
    return (
      <span className="font-mono font-bold text-rose-300">
        Pick is dropping — react fast
      </span>
    );
  }
  return (
    <span className="font-mono font-bold text-amber-300">
      Tight — could go either way
    </span>
  );
}
