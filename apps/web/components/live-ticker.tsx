"use client";

import { motion } from "framer-motion";
import type { Match } from "@/lib/live-feed";

/**
 * Persistent CNN-style ticker crawling across the top of /live.
 * Renders the same content twice in a marquee for seamless loop.
 */
export function LiveTicker({ matches }: { matches: Match[] }) {
  const items = matches.filter((m) => m.status !== "scheduled");
  if (items.length === 0) return null;

  return (
    <div className="relative overflow-hidden border-y border-line/10 bg-ink-900 text-white">
      {/* live badge pinned left */}
      <div className="absolute left-0 top-0 z-10 flex h-full items-center gap-2 bg-red-600 px-3 font-mono text-[11px] font-black uppercase tracking-widest text-white shadow-[2px_0_12px_rgba(220,38,38,0.55)]">
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          className="inline-block h-2 w-2 rounded-full bg-white"
        />
        Live
      </div>

      {/* fade edges */}
      <div className="pointer-events-none absolute left-14 top-0 z-10 h-full w-12 bg-gradient-to-r from-ink-900 to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-ink-900 to-transparent" />

      <motion.div
        className="flex whitespace-nowrap py-2.5 pl-20 will-change-transform"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: items.length * 6, repeat: Infinity, ease: "linear" }}
      >
        {[...items, ...items].map((m, i) => (
          <TickerItem key={`${m.id}-${i}`} m={m} />
        ))}
      </motion.div>
    </div>
  );
}

function TickerItem({ m }: { m: Match }) {
  const goalPulse = m.pulse > 0;
  return (
    <span className="mr-10 inline-flex items-center gap-2 font-mono text-[12px] tracking-tight text-white/85">
      <span className="text-white/55">{m.clockLabel}</span>
      <span className="inline-flex items-center gap-1.5">
        <span>{m.home.flag}</span>
        <span className="font-bold text-white">{m.home.code}</span>
      </span>
      <motion.span
        animate={goalPulse ? { scale: [1, 1.18, 1], color: ["#FFFFFF", "#FACC15", "#FFFFFF"] } : {}}
        transition={{ duration: 0.8 }}
        className="font-mono font-black tabular-nums text-white"
      >
        {m.homeScore}–{m.awayScore}
      </motion.span>
      <span className="inline-flex items-center gap-1.5">
        <span className="font-bold text-white">{m.away.code}</span>
        <span>{m.away.flag}</span>
      </span>
      {m.status === "ht" && (
        <span className="ml-2 rounded-sm bg-white/15 px-1.5 py-0.5 text-[10px] font-bold uppercase">HT</span>
      )}
      {m.status === "ft" && (
        <span className="ml-2 rounded-sm bg-white/15 px-1.5 py-0.5 text-[10px] font-bold uppercase">FT</span>
      )}
      <span className="ml-3 text-white/25">•</span>
    </span>
  );
}
