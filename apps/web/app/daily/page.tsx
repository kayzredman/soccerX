"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Countdown } from "@/components/countdown";
import { PLAYERS } from "@/lib/players";
import { KICKOFF_ISO } from "@/lib/mock";

/**
 * Stories-style auto-advancing morning brief. Each segment is a card
 * with a strong visual + headline. Hold to pause, tap edges to skip.
 */

type Segment = {
  id: string;
  kicker: string;
  title: string;
  body: string;
  accent: string;
  visual: "kickoff" | "player" | "shock" | "standings" | "trophy";
  duration: number;
};

const SEGMENTS: Segment[] = [
  {
    id: "kickoff",
    kicker: "Story 01 · Today",
    title: "Tournament kicks off in…",
    body: "Mexico vs South Africa at the Estadio Azteca opens Matchday 1. Lock your bracket before the whistle.",
    accent: "#C6FF3D",
    visual: "kickoff",
    duration: 7000,
  },
  {
    id: "shock",
    kicker: "Story 02 · Yesterday",
    title: "France 2–3 Australia stuns the group",
    body: "Mitchell Duke's 89th-minute volley flipped Group D. France slip to second seed and play England next.",
    accent: "#EF4444",
    visual: "shock",
    duration: 7000,
  },
  {
    id: "player",
    kicker: "Story 03 · One to watch",
    title: "Mbappé returns from rest",
    body: "Coach Deschamps confirms full minutes today. 4 goals in 3 group games — leads the Golden Boot race.",
    accent: "#3B82F6",
    visual: "player",
    duration: 8000,
  },
  {
    id: "standings",
    kicker: "Story 04 · Your league",
    title: "You moved up 4 spots overnight",
    body: "Sitting 12th in Lagos Lads · 184 pts · 6 pt gap to top 10. Daily picks unlock at kickoff.",
    accent: "#22D3EE",
    visual: "standings",
    duration: 6500,
  },
  {
    id: "trophy",
    kicker: "Story 05 · The big picture",
    title: "Brazil 6/1 to lift the trophy",
    body: "Argentina close behind at 7/1 after Messi's match-winner. Public picks 38% Brazil, 22% France, 14% Argentina.",
    accent: "#F472B6",
    visual: "trophy",
    duration: 7000,
  },
];

export default function DailyPage() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTsRef = useRef<number>(0);
  const accruedRef = useRef<number>(0);

  const seg = SEGMENTS[index]!;
  const total = SEGMENTS.length;

  const advance = useCallback(() => {
    setIndex((i) => (i + 1) % total);
  }, [total]);

  const back = useCallback(() => {
    setIndex((i) => (i - 1 + total) % total);
  }, [total]);

  // reset accrued + start on segment change
  useEffect(() => {
    setProgress(0);
    accruedRef.current = 0;
    startTsRef.current = performance.now();
  }, [index]);

  useEffect(() => {
    function tick(ts: number) {
      if (!paused) {
        const elapsed = accruedRef.current + (ts - startTsRef.current);
        const p = Math.min(1, elapsed / seg.duration);
        setProgress(p);
        if (p >= 1) {
          setIndex((i) => (i + 1) % total);
          return;
        }
      } else {
        accruedRef.current += ts - startTsRef.current;
        startTsRef.current = ts;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [seg, paused, total]);

  return (
    <div className="-mt-4 sm:-mt-8">
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-4 sm:px-6 sm:pt-8">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-neon-lime">
              ● Daily brief · {new Date().toLocaleDateString(undefined, { weekday: "long" })}
            </p>
            <h1 className="mt-1 font-display text-3xl font-black tracking-tight text-fg sm:text-4xl">
              5 stories before kickoff
            </h1>
          </div>
          <Link
            href="/live"
            className="hidden rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-red-400 transition hover:bg-red-500/20 sm:inline-flex"
          >
            ● Watch live
          </Link>
        </div>

        {/* Stories progress bars */}
        <div className="mb-3 flex gap-1.5">
          {SEGMENTS.map((s, i) => (
            <div
              key={s.id}
              className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-line/15"
            >
              <div
                className="absolute inset-y-0 left-0 bg-fg"
                style={{
                  width:
                    i < index ? "100%" : i > index ? "0%" : `${progress * 100}%`,
                  transition: i === index ? "none" : "width 220ms ease",
                }}
              />
            </div>
          ))}
        </div>

        {/* Stage */}
        <div
          className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-line/10 bg-ink-900 text-white shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] sm:aspect-[16/10]"
          onPointerDown={() => setPaused(true)}
          onPointerUp={() => setPaused(false)}
          onPointerLeave={() => setPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={seg.id}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
              className="absolute inset-0"
            >
              <Visual segment={seg} />
            </motion.div>
          </AnimatePresence>

          {/* Bottom chyron */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-5 sm:p-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${seg.id}-text`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <p
                  className="font-mono text-[10px] uppercase tracking-[0.25em]"
                  style={{ color: seg.accent }}
                >
                  {seg.kicker}
                </p>
                <h2 className="mt-2 font-display text-2xl font-black leading-tight tracking-tight text-white text-balance sm:text-4xl">
                  {seg.title}
                </h2>
                <p className="mt-2 max-w-md text-sm text-white/70 sm:text-base">
                  {seg.body}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Tap zones */}
          <button
            type="button"
            onClick={back}
            aria-label="Previous story"
            className="absolute inset-y-0 left-0 z-20 w-1/3 cursor-w-resize"
          />
          <button
            type="button"
            onClick={advance}
            aria-label="Next story"
            className="absolute inset-y-0 right-0 z-20 w-1/3 cursor-e-resize"
          />

          {/* Pause indicator */}
          <AnimatePresence>
            {paused && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="pointer-events-none absolute inset-0 z-30 grid place-items-center bg-black/15"
              >
                <span className="rounded-full bg-white/10 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-white backdrop-blur-md">
                  ⏸ Paused
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls + CTA strip */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={back}
              className="rounded-full border border-line/15 bg-surface-2 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-fg-muted transition hover:text-fg"
            >
              ← Prev
            </button>
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              className="rounded-full border border-line/15 bg-surface-2 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-fg-muted transition hover:text-fg"
            >
              {paused ? "▶ Play" : "⏸ Pause"}
            </button>
            <button
              type="button"
              onClick={advance}
              className="rounded-full border border-line/15 bg-surface-2 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-fg-muted transition hover:text-fg"
            >
              Next →
            </button>
          </div>
          <Link
            href="/live"
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-white shadow-[0_10px_30px_-10px_rgba(220,38,38,0.7)] transition hover:bg-red-500 sm:hidden"
          >
            ● Watch live
          </Link>
        </div>
      </div>
    </div>
  );
}

// -------- visuals ---------------------------------------------------------

function Visual({ segment }: { segment: Segment }) {
  switch (segment.visual) {
    case "kickoff":
      return <KickoffVisual accent={segment.accent} />;
    case "player":
      return <PlayerVisual accent={segment.accent} />;
    case "shock":
      return <ShockVisual accent={segment.accent} />;
    case "standings":
      return <StandingsVisual accent={segment.accent} />;
    case "trophy":
      return <TrophyVisual accent={segment.accent} />;
  }
}

function VisualFrame({ accent, children }: { accent: string; children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 30% 20%, ${accent}44, transparent 55%), radial-gradient(circle at 80% 80%, ${accent}33, transparent 60%), linear-gradient(135deg, #060B1F 0%, #0E1538 60%, #1A0F37 100%)`,
        }}
      />
      <motion.div
        className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.05)_50%,transparent_100%)]"
        animate={{ y: ["-100%", "100%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink-900 via-ink-900/80 to-transparent" />
      {children}
    </div>
  );
}

function KickoffVisual({ accent }: { accent: string }) {
  return (
    <VisualFrame accent={accent}>
      <div className="absolute inset-0 flex items-start justify-center pt-12 sm:pt-16">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          className="text-center"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/55">
            Bracket locks in
          </p>
          <div className="mt-3 scale-110 sm:scale-125">
            <Countdown iso={KICKOFF_ISO} />
          </div>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-white/60">
            🇲🇽 Mexico vs South Africa 🇿🇦 · 13:00 CDT
          </p>
        </motion.div>
      </div>
    </VisualFrame>
  );
}

function PlayerVisual({ accent }: { accent: string }) {
  const player = PLAYERS.find((p) => p.id === "mbappe") ?? PLAYERS[0]!;
  return (
    <VisualFrame accent={accent}>
      <motion.div
        initial={{ opacity: 0, x: 30, scale: 1.05 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="absolute bottom-0 right-[-6%] top-[6%] w-[78%] sm:w-[58%]"
      >
        <motion.div
          aria-hidden
          animate={{ opacity: [0.4, 0.7, 0.4], scale: [0.9, 1.05, 0.9] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-x-[10%] bottom-[10%] -z-10 h-[60%] rounded-[50%] blur-3xl"
          style={{ backgroundColor: player.accent }}
        />
        <Image
          src={player.src}
          alt={player.alt}
          fill
          sizes="(min-width: 640px) 60vw, 80vw"
          style={{ objectFit: "contain", objectPosition: "bottom right" }}
          className="drop-shadow-[0_24px_30px_rgba(0,0,0,0.45)]"
        />
      </motion.div>

      <div className="absolute left-5 top-5 z-10 flex flex-col gap-2 sm:left-7 sm:top-7">
        <Chip label="Goals" value="4" accent={accent} />
        <Chip label="Assists" value="2" accent={accent} />
        <Chip label="xG" value="3.4" accent={accent} />
      </div>
    </VisualFrame>
  );
}

function ShockVisual({ accent }: { accent: string }) {
  return (
    <VisualFrame accent={accent}>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 sm:gap-5">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
          className="rounded-full border-2 px-4 py-1 font-mono text-[10px] font-black uppercase tracking-[0.3em]"
          style={{ borderColor: accent, color: accent }}
        >
          Upset
        </motion.div>
        <div className="flex items-center gap-5 sm:gap-8">
          <ScoreSide flag="🇫🇷" code="FRA" score={2} dim />
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 220 }}
            className="font-mono text-2xl font-black text-white/40"
          >
            —
          </motion.span>
          <ScoreSide flag="🇦🇺" code="AUS" score={3} highlight={accent} />
        </div>
        <motion.p
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="font-mono text-[10px] uppercase tracking-widest text-white/45"
        >
          89&apos; · M. Duke ⚽
        </motion.p>
      </div>
    </VisualFrame>
  );
}

function StandingsVisual({ accent }: { accent: string }) {
  const rows = [
    { rank: 8, who: "midfieldmaestro", pts: 198, you: false },
    { rank: 9, who: "GoldenGloves99", pts: 192, you: false },
    { rank: 10, who: "PenaltyKing", pts: 190, you: false },
    { rank: 12, who: "you", pts: 184, you: true },
  ];
  return (
    <VisualFrame accent={accent}>
      <div className="absolute inset-x-5 top-12 sm:inset-x-9 sm:top-16">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: accent }}>
          Lagos Lads · 248 members
        </p>
        <ul className="mt-3 space-y-1.5">
          {rows.map((r, i) => (
            <motion.li
              key={r.rank}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 font-mono text-[12px] ${
                r.you ? "bg-white/15 text-white" : "text-white/65"
              }`}
              style={r.you ? { boxShadow: `inset 0 0 0 1px ${accent}` } : undefined}
            >
              <span className="w-6 text-right font-bold">{r.rank}</span>
              <span className="flex-1 truncate">{r.who}</span>
              <span className="font-black tabular-nums">{r.pts}</span>
              {r.you && (
                <span
                  className="rounded-sm px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-ink-900"
                  style={{ backgroundColor: accent }}
                >
                  +4 ↑
                </span>
              )}
            </motion.li>
          ))}
        </ul>
      </div>
    </VisualFrame>
  );
}

function TrophyVisual({ accent }: { accent: string }) {
  const odds = [
    { code: "BRA", flag: "🇧🇷", odds: "6/1", pct: 38 },
    { code: "FRA", flag: "🇫🇷", odds: "7/1", pct: 22 },
    { code: "ARG", flag: "🇦🇷", odds: "9/1", pct: 14 },
    { code: "ENG", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", odds: "11/1", pct: 10 },
  ];
  return (
    <VisualFrame accent={accent}>
      <div className="absolute inset-x-5 top-10 sm:inset-x-9 sm:top-14">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: accent }}>
          Public picks · who lifts it?
        </p>
        <ul className="mt-3 space-y-2">
          {odds.map((o, i) => (
            <li key={o.code} className="flex items-center gap-3">
              <span className="w-14 font-mono text-[11px] text-white/70">{o.flag} {o.code}</span>
              <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${o.pct}%` }}
                  transition={{ delay: 0.15 + i * 0.08, duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
                  className="h-full"
                  style={{ backgroundColor: accent }}
                />
              </div>
              <span className="w-12 text-right font-mono text-[11px] font-black tabular-nums text-white/80">
                {o.pct}%
              </span>
              <span className="w-12 text-right font-mono text-[10px] uppercase tracking-widest text-white/40">
                {o.odds}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </VisualFrame>
  );
}

function ScoreSide({
  flag,
  code,
  score,
  dim,
  highlight,
}: {
  flag: string;
  code: string;
  score: number;
  dim?: boolean;
  highlight?: string;
}) {
  return (
    <div className={`text-center ${dim ? "opacity-55" : ""}`}>
      <div className="text-3xl">{flag}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-white/55">{code}</div>
      <div
        className="mt-1 font-display text-5xl font-black tabular-nums text-white sm:text-6xl"
        style={highlight ? { textShadow: `0 0 30px ${highlight}99` } : undefined}
      >
        {score}
      </div>
    </div>
  );
}

function Chip({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <motion.div
      initial={{ x: -16, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-md"
      style={{ boxShadow: `inset 0 0 0 1px ${accent}33` }}
    >
      <p className="font-mono text-[9px] uppercase tracking-widest text-white/50">{label}</p>
      <p className="font-mono text-base font-black tabular-nums text-white">{value}</p>
    </motion.div>
  );
}
