"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { LiveEvent } from "@/lib/live-feed";

/**
 * CNN-style lower-third / chyron. Slides up from the bottom with
 * the latest event, holds, then retracts. Visible above ticker.
 */
export function LowerThird({ event }: { event: LiveEvent | null }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 grid place-items-center px-3 pb-4 sm:pb-6">
      <AnimatePresence mode="wait">
        {event && (
          <motion.div
            key={event.id}
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="pointer-events-auto w-full max-w-3xl"
          >
            <ChyronCard event={event} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChyronCard({ event }: { event: LiveEvent }) {
  const cfg = configFor(event);
  return (
    <div className="relative overflow-hidden rounded-md border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]">
      {/* Top bar: team color + event tag */}
      <div className="flex items-stretch bg-ink-900 text-white">
        <div
          className="flex items-center gap-2 px-4 py-2"
          style={{ backgroundColor: cfg.bg, color: cfg.fg }}
        >
          <motion.span
            initial={{ scale: 0.6, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.08 }}
            className="text-lg leading-none"
          >
            {cfg.icon}
          </motion.span>
          <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em]">
            {cfg.label}
          </span>
        </div>
        <div className="flex items-center gap-2 bg-white/10 px-3 font-mono text-[11px] font-bold uppercase tracking-widest">
          <span>{event.team.flag}</span>
          <span>{event.team.code}</span>
        </div>
        <div className="ml-auto flex items-center gap-2 bg-black/50 px-3 font-mono text-[11px] font-bold uppercase tracking-widest text-white/85">
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.1, repeat: Infinity }}
            className="h-1.5 w-1.5 rounded-full bg-red-500"
          />
          {event.minute}&apos;
        </div>
      </div>

      {/* Bottom bar: player + detail with typewriter slide */}
      <div className="flex items-center gap-3 bg-gradient-to-r from-ink-900 via-ink-900 to-ink-900/95 px-4 py-3">
        <motion.h3
          initial={{ x: -16, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 240, damping: 22 }}
          className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl"
        >
          {event.player}
        </motion.h3>
        {event.detail && (
          <motion.span
            initial={{ x: -8, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.28 }}
            className="ml-auto font-mono text-[12px] uppercase tracking-widest text-white/60"
          >
            {event.detail}
          </motion.span>
        )}
      </div>

      {/* Bottom progress bar drains as chyron decays */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 5.5, ease: "linear" }}
        style={{ originX: 0, backgroundColor: cfg.bg }}
        className="h-[3px]"
      />
    </div>
  );
}

function configFor(e: LiveEvent): { label: string; bg: string; fg: string; icon: string } {
  switch (e.type) {
    case "goal":
      return { label: "Goal", bg: "#FACC15", fg: "#111111", icon: "⚽" };
    case "card":
      return e.detail === "Red card"
        ? { label: "Red card", bg: "#DC2626", fg: "#FFFFFF", icon: "🟥" }
        : { label: "Yellow card", bg: "#FBBF24", fg: "#111111", icon: "🟨" };
    case "var":
      return { label: "VAR check", bg: "#3B82F6", fg: "#FFFFFF", icon: "🛑" };
    case "sub":
      return { label: "Substitution", bg: "#22D3EE", fg: "#0F172A", icon: "🔁" };
    case "kickoff":
      return { label: "Kick-off", bg: "#C6FF3D", fg: "#0F172A", icon: "🎬" };
    case "ht":
      return { label: "Half time", bg: "#A1A1AA", fg: "#0F172A", icon: "⏸" };
    case "ft":
      return { label: "Full time", bg: "#FFFFFF", fg: "#0F172A", icon: "⏹" };
  }
}
