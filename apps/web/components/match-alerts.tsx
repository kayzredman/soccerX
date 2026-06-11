"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LiveEvent, Match } from "@/lib/live-feed";

/**
 * CNN-style "Breaking News" toasts stacked in the top-right of /live.
 * Listens to the event stream and surfaces notable events that DIDN'T
 * happen in the featured match (so the user notices things off-screen).
 *
 * - Goals always alert
 * - Red cards always alert
 * - VAR + FT alert when not featured
 * - Max 3 visible at a time, auto-dismiss after 5s
 */

const LIFESPAN_MS = 5000;
const MAX_ALERTS = 3;

type Alert = {
  id: string;
  event: LiveEvent;
  match: Match;
  bornAt: number;
};

export function MatchAlerts({
  events,
  matches,
  featuredMatchId,
  onPick,
}: {
  events: LiveEvent[];
  matches: Match[];
  featuredMatchId: string;
  onPick?: (matchId: string) => void;
}) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());

  const matchById = useMemo(() => {
    const map = new Map<string, Match>();
    for (const m of matches) map.set(m.id, m);
    return map;
  }, [matches]);

  // Pick up new events that we care about
  useEffect(() => {
    const additions: Alert[] = [];
    for (const e of events) {
      if (seenIdsRef.current.has(e.id)) continue;
      seenIdsRef.current.add(e.id);
      if (e.matchId === featuredMatchId) continue;
      const interesting =
        e.type === "goal" ||
        e.type === "ft" ||
        (e.type === "card" && e.detail === "Red card") ||
        e.type === "var";
      if (!interesting) continue;
      const match = matchById.get(e.matchId);
      if (!match) continue;
      additions.push({ id: e.id, event: e, match, bornAt: Date.now() });
    }
    if (additions.length === 0) return;
    setAlerts((cur) => [...additions, ...cur].slice(0, MAX_ALERTS));
  }, [events, featuredMatchId, matchById]);

  // Expire alerts
  useEffect(() => {
    if (alerts.length === 0) return;
    const id = window.setInterval(() => {
      const now = Date.now();
      setAlerts((cur) => cur.filter((a) => now - a.bornAt < LIFESPAN_MS));
    }, 400);
    return () => window.clearInterval(id);
  }, [alerts.length]);

  return (
    <div className="pointer-events-none fixed right-3 top-20 z-30 flex w-[min(360px,calc(100vw-1.5rem))] flex-col gap-2 sm:right-5 sm:top-24">
      <AnimatePresence initial={false}>
        {alerts.map((a) => (
          <AlertCard
            key={a.id}
            alert={a}
            onPick={() => {
              onPick?.(a.match.id);
              setAlerts((cur) => cur.filter((x) => x.id !== a.id));
            }}
            onDismiss={() =>
              setAlerts((cur) => cur.filter((x) => x.id !== a.id))
            }
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function AlertCard({
  alert,
  onPick,
  onDismiss,
}: {
  alert: Alert;
  onPick: () => void;
  onDismiss: () => void;
}) {
  const { event: e, match: m } = alert;
  const cfg = configFor(e);
  return (
    <motion.div
      layout
      initial={{ x: 80, opacity: 0, scale: 0.95 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: 120, opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className="pointer-events-auto overflow-hidden rounded-xl border border-white/10 bg-ink-900/95 text-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] backdrop-blur-xl"
    >
      <button
        type="button"
        onClick={onPick}
        className="w-full text-left transition hover:bg-white/5"
      >
        <div className="flex items-stretch">
          <div
            className="flex items-center gap-2 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.2em]"
            style={{ backgroundColor: cfg.bg, color: cfg.fg }}
          >
            <span className="text-base leading-none">{cfg.icon}</span>
            {cfg.label}
          </div>
          <div className="flex flex-1 items-center justify-between gap-2 px-3 py-2">
            <span className="font-mono text-[11px] text-white/55">{e.minute}&apos;</span>
            <button
              type="button"
              onClick={(ev) => {
                ev.stopPropagation();
                onDismiss();
              }}
              className="rounded p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
        <div className="px-3 pb-3 pt-1">
          <p className="font-display text-base font-black leading-tight tracking-tight text-white">
            {e.player}
            {e.detail && (
              <span className="ml-1 font-mono text-[11px] font-normal uppercase tracking-widest text-white/45">
                · {e.detail}
              </span>
            )}
          </p>
          <p className="mt-1 font-mono text-[11px] text-white/65">
            {m.home.flag} <span className="font-bold text-white">{m.home.code}</span>{" "}
            <span className="font-black tabular-nums text-white">
              {m.homeScore}–{m.awayScore}
            </span>{" "}
            <span className="font-bold text-white">{m.away.code}</span> {m.away.flag}
            <span className="ml-2 text-white/35">tap to feature</span>
          </p>
        </div>
      </button>
      {/* lifespan bar */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: LIFESPAN_MS / 1000, ease: "linear" }}
        style={{ originX: 0, backgroundColor: cfg.bg }}
        className="h-[2px]"
      />
    </motion.div>
  );
}

function configFor(e: LiveEvent): { label: string; bg: string; fg: string; icon: string } {
  switch (e.type) {
    case "goal":
      return { label: "Goal", bg: "#FACC15", fg: "#111111", icon: "⚽" };
    case "card":
      return { label: "Red card", bg: "#DC2626", fg: "#FFFFFF", icon: "🟥" };
    case "var":
      return { label: "VAR", bg: "#3B82F6", fg: "#FFFFFF", icon: "🛑" };
    case "ft":
      return { label: "Full time", bg: "#FFFFFF", fg: "#0F172A", icon: "⏹" };
    default:
      return { label: e.type, bg: "#71717A", fg: "#FFFFFF", icon: "•" };
  }
}
