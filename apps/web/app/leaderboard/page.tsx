"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MOCK_LEADERBOARD, type MockLeader } from "@/lib/mock";
import { fetchGlobalLeaderboard, type ApiLeaderboardRow } from "@/lib/api";
import { SceneBackground } from "@/components/scene-background";
import { SCENES } from "@/lib/scenes";

const SCOPES = ["Global", "Ghana", "My league"] as const;
type Scope = (typeof SCOPES)[number];

function apiRowToLeader(r: ApiLeaderboardRow): MockLeader {
  return {
    rank: r.rank,
    userId: r.userId,
    handle: r.handle,
    points: r.totalPoints,
    streak: 0,
    delta: 0,
  };
}

export default function LeaderboardPage() {
  const [scope, setScope] = useState<Scope>("Global");
  const [liveRows, setLiveRows] = useState<MockLeader[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (scope !== "Global") {
      setLiveRows(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchGlobalLeaderboard(100)
      .then((rows) => {
        if (cancelled) return;
        setLiveRows(rows.length > 0 ? rows.map(apiRowToLeader) : []);
      })
      .catch(() => {
        if (!cancelled) setLiveRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [scope]);

  const isLive = scope === "Global" && (liveRows?.length ?? 0) > 0;
  const board: MockLeader[] = isLive && liveRows ? liveRows : MOCK_LEADERBOARD;
  const top3 = board.slice(0, 3);
  const rest = board.slice(3);

  return (
    <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
      <SceneBackground scene={SCENES.trophyLight} variant="banner" />
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-neon-cyan">
            Leaderboard
          </p>
          <h1 className="mt-3 font-display text-4xl font-black tracking-tight sm:text-5xl text-fg">
            Who&apos;s ahead?
          </h1>
          <p className="mt-2 max-w-xl text-sm text-fg-muted">
            Live standings across the tournament. Refreshed every match.
          </p>
          <p className="mt-2 text-[10px] font-mono uppercase tracking-[0.25em] text-fg-dim">
            {scope !== "Global"
              ? "preview · scope not live yet"
              : loading
                ? "loading…"
                : isLive
                  ? "live · global"
                  : "preview · no score events yet"}
          </p>
        </div>
        <div className="flex gap-1 rounded-xl border border-line/10 bg-surface-2 p-1">
          {SCOPES.map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className="relative rounded-lg px-3 py-1.5 text-xs font-medium text-fg-muted transition"
            >
              {scope === s && (
                <motion.span
                  layoutId="scope-pill"
                  className="absolute inset-0 rounded-lg bg-line/10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className={`relative ${scope === s ? "text-fg" : ""}`}>
                {s}
              </span>
            </button>
          ))}
        </div>
      </header>

      <Podium top3={top3} />

      <section className="mt-10 overflow-hidden rounded-2xl border border-line/10 bg-surface-2 shadow-ring">
        <div className="grid grid-cols-[3rem_1fr_5rem_4.5rem_3.5rem] items-center gap-3 border-b border-line/10 px-4 py-3 text-[10px] uppercase tracking-widest text-fg-dim sm:px-6">
          <span>Rank</span>
          <span>Player</span>
          <span className="text-right">Points</span>
          <span className="text-right hidden sm:block">Streak</span>
          <span className="text-right">Δ</span>
        </div>
        <ul>
          {rest.map((row, i) => (
            <motion.li
              key={row.userId}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
              className={`grid grid-cols-[3rem_1fr_5rem_4.5rem_3.5rem] items-center gap-3 border-b border-line/5 px-4 py-3 text-sm transition last:border-b-0 hover:bg-line/[0.04] sm:px-6 ${
                row.isMe ? "bg-neon-lime/[0.08]" : ""
              }`}
            >
              <span className="font-mono text-fg-dim">#{row.rank}</span>
              <span className="flex min-w-0 items-center gap-3">
                <span
                  className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${
                    row.isMe
                      ? "bg-neon-lime text-ink-900"
                      : "bg-surface-3 text-fg-muted"
                  }`}
                >
                  {row.handle.slice(0, 2).toUpperCase()}
                </span>
                <span className="truncate">
                  <span
                    className={`font-medium ${row.isMe ? "text-emerald-600 dark:text-neon-lime" : "text-fg"}`}
                  >
                    {row.handle}
                  </span>
                  {row.isMe && (
                    <span className="ml-2 rounded bg-neon-lime/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-emerald-700 dark:text-neon-lime">
                      you
                    </span>
                  )}
                </span>
              </span>
              <span className="text-right font-mono font-bold tabular-nums text-fg">
                {row.points}
              </span>
              <span className="hidden text-right text-fg-muted sm:block">
                {row.streak > 0 ? `🔥 ${row.streak}` : "—"}
              </span>
              <span
                className={`text-right font-mono text-xs ${
                  row.delta > 0
                    ? "text-emerald-600 dark:text-neon-lime"
                    : row.delta < 0
                      ? "text-rose-500 dark:text-neon-magenta"
                      : "text-fg-dim"
                }`}
              >
                {row.delta > 0 ? `▲${row.delta}` : row.delta < 0 ? `▼${Math.abs(row.delta)}` : "—"}
              </span>
            </motion.li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Podium({ top3 }: { top3: MockLeader[] }) {
  const order = [top3[1], top3[0], top3[2]];
  const heights = ["h-32", "h-44", "h-24"];
  const colors = [
    "from-slate-300 to-slate-100 dark:from-white/30 dark:to-white/5",
    "from-neon-lime/90 to-neon-lime/20 dark:from-neon-lime/80 dark:to-neon-lime/10",
    "from-amber-400/80 to-amber-200 dark:from-amber-400/60 dark:to-amber-400/5",
  ];
  const labels = ["2", "1", "3"];

  return (
    <section className="mt-10 grid grid-cols-3 items-end gap-3 sm:gap-6">
      {order.map((r, idx) =>
        r ? (
          <motion.div
            key={r.userId}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 + idx * 0.1, type: "spring", stiffness: 110 }}
            className="flex flex-col items-center"
          >
            <div className="mb-3 flex flex-col items-center">
              <div
                className={`grid h-14 w-14 place-items-center rounded-full text-base font-bold ${
                  labels[idx] === "1"
                    ? "bg-neon-lime text-ink-900 shadow-glow"
                    : "bg-surface-3 text-fg"
                } ring-2 ring-line/10`}
              >
                {r.handle.slice(0, 2).toUpperCase()}
              </div>
              <p className="mt-2 truncate max-w-[8rem] text-center text-sm font-semibold text-fg">
                {r.handle}
              </p>
              <p className="font-mono text-xs text-fg-muted">{r.points} pts</p>
            </div>
            <div
              className={`relative w-full overflow-hidden rounded-t-xl border border-b-0 border-line/10 bg-gradient-to-t ${colors[idx]} ${heights[idx]}`}
            >
              <span className="absolute inset-0 grid place-items-center font-display text-5xl font-black text-fg/30">
                {labels[idx]}
              </span>
            </div>
          </motion.div>
        ) : (
          <div key={`empty-${idx}`} />
        ),
      )}
    </section>
  );
}
