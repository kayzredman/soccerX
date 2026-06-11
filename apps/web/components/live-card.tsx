"use client";

import { motion } from "framer-motion";
import type { Match } from "@/lib/live-feed";

/**
 * Smaller live match card in the side column on /live.
 * Auto-promotes (visual ring + glow) when goalpulse fires.
 */
export function LiveCard({
  match,
  active,
  onClick,
}: {
  match: Match;
  active?: boolean;
  onClick?: () => void;
}) {
  const ring =
    match.severity === "late" ? "#EF4444"
    : match.severity === "ft" ? "#A1A1AA"
    : match.pulse > 0 ? "#FACC15"
    : "#22D3EE";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      animate={{ boxShadow: `0 0 0 1px ${ring}${active ? "AA" : "33"}, 0 20px 40px -25px ${ring}66` }}
      transition={{ type: "spring", stiffness: 200, damping: 22 }}
      className="group relative w-full overflow-hidden rounded-2xl bg-surface-2 p-4 text-left"
    >
      {/* color stripe */}
      <div
        className="absolute inset-x-0 top-0 h-0.5"
        style={{
          background: `linear-gradient(90deg, ${match.home.color}, ${match.away.color})`,
        }}
      />

      <div className="flex items-center gap-2">
        <ClockBadge match={match} />
        {match.status !== "scheduled" && (
          <span className="font-mono text-[9px] uppercase tracking-widest text-fg-dim">
            {match.venue.split(" ").slice(-1)[0]}
          </span>
        )}
        {match.pulse > 0 && (
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: [0.6, 1.1, 1], opacity: [0, 1, 1] }}
            className="ml-auto rounded-sm bg-amber-300 px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-widest text-ink-900"
          >
            ⚽ Goal
          </motion.span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto] gap-y-1.5 gap-x-2">
        <Row team={match.home} score={match.homeScore} />
        <Row team={match.away} score={match.awayScore} />
      </div>
    </motion.button>
  );
}

function ClockBadge({ match }: { match: Match }) {
  if (match.status === "scheduled") {
    return (
      <span className="rounded bg-line/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-fg-dim">
        Soon
      </span>
    );
  }
  if (match.status === "ft") {
    return (
      <span className="rounded bg-line/15 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
        FT
      </span>
    );
  }
  if (match.status === "ht") {
    return (
      <span className="rounded bg-line/15 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
        HT
      </span>
    );
  }
  const isLate = match.minute >= 80;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest ${
        isLate ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"
      }`}
    >
      <motion.span
        animate={{ opacity: [1, 0.35, 1] }}
        transition={{ duration: 1.1, repeat: Infinity }}
        className={`h-1 w-1 rounded-full ${isLate ? "bg-red-500" : "bg-emerald-400"}`}
      />
      {match.clockLabel}
    </span>
  );
}

function Row({ team, score }: { team: Match["home"]; score: number }) {
  return (
    <>
      <div className="flex items-center gap-2">
        <span className="text-lg">{team.flag}</span>
        <span className="font-display text-sm font-bold text-fg">{team.name}</span>
      </div>
      <motion.span
        key={score}
        initial={{ y: -4, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="font-mono text-lg font-black tabular-nums text-fg"
      >
        {score}
      </motion.span>
    </>
  );
}
