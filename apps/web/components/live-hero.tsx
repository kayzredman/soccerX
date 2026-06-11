"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LiveEvent, Match } from "@/lib/live-feed";

/**
 * "Now playing" hero card for /live. Big animated background tied
 * to the featured match. Live clock, big score, possession-style
 * accent bar, and a stack of recent events on the right.
 */
export function LiveHero({
  match,
  events,
}: {
  match: Match;
  events: LiveEvent[];
}) {
  const matchEvents = events.filter((e) => e.matchId === match.id).slice(0, 5);
  const total = match.homeScore + match.awayScore;
  const homePct = total === 0 ? 50 : (match.homeScore / total) * 100;
  const ringColor =
    match.severity === "late" ? "#EF4444"
    : match.severity === "ft" ? "#A1A1AA"
    : "#22D3EE";

  // Goal flash detection: trigger when home/away score increases on this match
  const [flashSide, setFlashSide] = useState<"home" | "away" | null>(null);
  const prevScoresRef = useRef({ home: match.homeScore, away: match.awayScore, matchId: match.id });
  useEffect(() => {
    const prev = prevScoresRef.current;
    if (prev.matchId !== match.id) {
      prevScoresRef.current = { home: match.homeScore, away: match.awayScore, matchId: match.id };
      return;
    }
    if (match.homeScore > prev.home) setFlashSide("home");
    else if (match.awayScore > prev.away) setFlashSide("away");
    prevScoresRef.current = { home: match.homeScore, away: match.awayScore, matchId: match.id };
  }, [match.homeScore, match.awayScore, match.id]);

  useEffect(() => {
    if (!flashSide) return;
    const id = window.setTimeout(() => setFlashSide(null), 2200);
    return () => window.clearTimeout(id);
  }, [flashSide]);

  return (
    <motion.div
      layout
      className="relative overflow-hidden rounded-3xl border border-line/10 bg-ink-900 text-white shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]"
      style={{ boxShadow: `0 0 0 1px ${ringColor}33, 0 30px 80px -30px ${ringColor}55` }}
    >
      <Backdrop match={match} />

      {/* top strip: live badge + venue + clock */}
      <div className="relative z-10 flex items-center gap-3 border-b border-white/10 px-5 py-3 backdrop-blur-md sm:px-7">
        <motion.span
          animate={{ opacity: [1, 0.35, 1] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          className="inline-block h-2 w-2 rounded-full bg-red-500"
        />
        <span className="font-mono text-[11px] font-black uppercase tracking-[0.22em] text-white">
          {match.status === "ft" ? "Full time" : match.status === "ht" ? "Half time" : "Live"}
        </span>
        <span className="text-white/30">·</span>
        <span className="font-mono text-[11px] uppercase tracking-widest text-white/70">
          {match.venue}
        </span>
        <ClockChip label={match.clockLabel} severity={match.severity} />
      </div>

      <div className="relative z-10 grid gap-6 px-5 py-6 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-8 sm:px-7 sm:py-10">
        <TeamSide team={match.home} score={match.homeScore} align="left" pulse={match.pulse > 0} />

        <Versus match={match} />

        <TeamSide team={match.away} score={match.awayScore} align="right" pulse={match.pulse > 0} />
      </div>

      {/* possession bar — true possession % between teams */}
      <div className="relative z-10 mx-5 mb-3 mt-1 flex h-2 overflow-hidden rounded-full bg-white/10 sm:mx-7">
        <motion.div
          initial={false}
          animate={{ width: `${match.possession}%`, backgroundColor: match.home.color }}
          transition={{ type: "spring", stiffness: 80, damping: 22 }}
          className="h-full"
        />
        <motion.div
          initial={false}
          animate={{ width: `${100 - match.possession}%`, backgroundColor: match.away.color }}
          transition={{ type: "spring", stiffness: 80, damping: 22 }}
          className="h-full"
        />
      </div>
      <div className="relative z-10 mx-5 mb-5 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-white/55 sm:mx-7 sm:mb-7">
        <span><span className="text-white/85 font-black">{Math.round(match.possession)}%</span> possession</span>
        <span>Goal share <span className="text-white/85 font-black">{Math.round(homePct)}–{100 - Math.round(homePct)}</span></span>
        <span><span className="text-white/85 font-black">{Math.round(100 - match.possession)}%</span></span>
      </div>

      {/* Live stat strip — possession, shots, xG */}
      <HeroStats match={match} />

      {/* events feed */}
      <div className="relative z-10 border-t border-white/10 px-5 py-4 sm:px-7">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
          Match events
        </p>
        <ul className="mt-3 space-y-1.5">
          <AnimatePresence initial={false}>
            {matchEvents.length === 0 && (
              <motion.li
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-mono text-[12px] text-white/40"
              >
                Quiet on the pitch…
              </motion.li>
            )}
            {matchEvents.map((e) => (
              <EventLine key={e.id} event={e} />
            ))}
          </AnimatePresence>
        </ul>
      </div>

      {/* Goal flash overlay — on top of everything inside the hero */}
      <AnimatePresence>
        {flashSide && (
          <GoalFlash key={`${flashSide}-${match.homeScore}-${match.awayScore}`} match={match} side={flashSide} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Backdrop({ match }: { match: Match }) {
  return (
    <>
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background: `radial-gradient(circle at 20% 30%, ${match.home.color}55, transparent 55%), radial-gradient(circle at 80% 70%, ${match.away.color}55, transparent 55%), linear-gradient(135deg, #060B1F, #0E1538 60%, #1A0F37)`,
        }}
      />
      {/* pitch line hint */}
      <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(transparent_calc(50%_-_1px),rgba(255,255,255,0.6)_50%,transparent_calc(50%_+_1px)),radial-gradient(circle_at_center,transparent_56px,rgba(255,255,255,0.5)_57px,transparent_58px)] [background-size:100%_100%,100%_100%]" />
      {/* scan-line shimmer */}
      <motion.div
        className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.04)_50%,transparent_100%)]"
        animate={{ y: ["-100%", "100%"] }}
        transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
      />
    </>
  );
}

function ClockChip({ label, severity }: { label: string; severity: Match["severity"] }) {
  const color = severity === "late" ? "#EF4444" : severity === "ft" ? "#A1A1AA" : "#FFFFFF";
  return (
    <span className="ml-auto inline-flex items-center gap-2 rounded-md bg-black/45 px-2.5 py-1 font-mono text-[12px] font-black tabular-nums">
      <motion.span
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span style={{ color }}>{label}</span>
    </span>
  );
}

function TeamSide({
  team,
  score,
  align,
  pulse,
}: {
  team: Match["home"];
  score: number;
  align: "left" | "right";
  pulse: boolean;
}) {
  const isLeft = align === "left";
  return (
    <div className={`flex items-center gap-4 ${isLeft ? "" : "sm:flex-row-reverse"}`}>
      <motion.div
        animate={pulse ? { scale: [1, 1.15, 1] } : {}}
        transition={{ duration: 0.6 }}
        className="grid h-14 w-14 place-items-center rounded-2xl text-3xl shadow-lg sm:h-16 sm:w-16"
        style={{ backgroundColor: `${team.color}22`, boxShadow: `inset 0 0 0 1px ${team.color}55` }}
      >
        {team.flag}
      </motion.div>
      <div className={isLeft ? "" : "text-right"}>
        <p className="font-mono text-[10px] uppercase tracking-widest text-white/55">{team.code}</p>
        <p className="font-display text-2xl font-black leading-tight tracking-tight sm:text-3xl">
          {team.name}
        </p>
      </div>
      <div className={`ml-auto ${isLeft ? "sm:ml-6" : "sm:mr-6 sm:ml-0"}`}>
        <motion.div
          key={score}
          initial={{ scale: 1.6, y: -8, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 18 }}
          className="font-display text-6xl font-black tabular-nums leading-none text-white sm:text-7xl"
          style={{ textShadow: `0 0 30px ${team.color}88` }}
        >
          {score}
        </motion.div>
      </div>
    </div>
  );
}

function Versus({ match }: { match: Match }) {
  return (
    <div className="hidden flex-col items-center sm:flex">
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">vs</span>
      <span className="mt-1 font-mono text-[11px] uppercase tracking-widest text-white/55">
        {match.status === "ft" ? "Decided" : "In play"}
      </span>
    </div>
  );
}

function EventLine({ event }: { event: LiveEvent }) {
  const dot = {
    goal: "bg-amber-300",
    card: "bg-yellow-400",
    var: "bg-blue-400",
    sub: "bg-cyan-300",
    kickoff: "bg-lime-300",
    ht: "bg-zinc-300",
    ft: "bg-white",
  }[event.type];
  return (
    <motion.li
      layout
      initial={{ x: -12, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ opacity: 0, x: 12 }}
      className="flex items-center gap-3 font-mono text-[12px] text-white/85"
    >
      <span className="w-10 text-white/45">{event.minute}&apos;</span>
      <span className={`inline-block h-2 w-2 rounded-full ${dot}`} />
      <span className="text-white">{event.player}</span>
      {event.detail && (
        <span className="text-white/40">· {event.detail}</span>
      )}
    </motion.li>
  );
}

function HeroStats({ match }: { match: Match }) {
  return (
    <div className="relative z-10 grid grid-cols-3 gap-px overflow-hidden border-y border-white/10 bg-white/5">
      <StatCell
        label="Shots"
        leftValue={match.homeShots}
        rightValue={match.awayShots}
        leftColor={match.home.color}
        rightColor={match.away.color}
      />
      <StatCell
        label="xG"
        leftValue={match.homeXg.toFixed(2)}
        rightValue={match.awayXg.toFixed(2)}
        leftColor={match.home.color}
        rightColor={match.away.color}
      />
      <StatCell
        label="Poss."
        leftValue={`${Math.round(match.possession)}%`}
        rightValue={`${Math.round(100 - match.possession)}%`}
        leftColor={match.home.color}
        rightColor={match.away.color}
      />
    </div>
  );
}

function StatCell({
  label,
  leftValue,
  rightValue,
  leftColor,
  rightColor,
}: {
  label: string;
  leftValue: number | string;
  rightValue: number | string;
  leftColor: string;
  rightColor: string;
}) {
  return (
    <div className="bg-ink-900/60 px-3 py-2 text-center sm:py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{label}</p>
      <div className="mt-1 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <motion.span
          key={`L-${leftValue}`}
          initial={{ y: -4, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-right font-mono text-lg font-black tabular-nums"
          style={{ color: leftColor }}
        >
          {leftValue}
        </motion.span>
        <span className="font-mono text-[10px] text-white/30">—</span>
        <motion.span
          key={`R-${rightValue}`}
          initial={{ y: -4, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-left font-mono text-lg font-black tabular-nums"
          style={{ color: rightColor }}
        >
          {rightValue}
        </motion.span>
      </div>
    </div>
  );
}

function GoalFlash({ match, side }: { match: Match; side: "home" | "away" }) {
  const team = side === "home" ? match.home : match.away;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
    >
      {/* gold sheen wash */}
      <motion.div
        initial={{ x: "-110%" }}
        animate={{ x: "110%" }}
        transition={{ duration: 1.3, ease: [0.32, 0.72, 0, 1] }}
        className="absolute inset-y-0 -left-1/4 w-[40%] -skew-x-12 bg-gradient-to-r from-transparent via-amber-300/45 to-transparent"
      />
      {/* color spotlight from scoring side */}
      <motion.div
        initial={{ opacity: 0.0 }}
        animate={{ opacity: [0, 0.55, 0] }}
        transition={{ duration: 1.8, times: [0, 0.25, 1] }}
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at ${side === "home" ? "20% 60%" : "80% 60%"}, ${team.color}, transparent 55%)`,
        }}
      />
      {/* GOAL splash */}
      <div className="absolute inset-0 grid place-items-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0, rotate: -6 }}
          animate={{ scale: [0.6, 1.15, 1], opacity: [0, 1, 1], rotate: [-6, 2, 0] }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          className="text-center"
        >
          <p
            className="font-display text-7xl font-black leading-none tracking-tight text-white sm:text-9xl"
            style={{
              textShadow: `0 0 30px ${team.color}, 0 0 80px ${team.color}88`,
            }}
          >
            GOAL!
          </p>
          <motion.p
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mt-2 font-mono text-[12px] uppercase tracking-[0.3em] text-white/80"
          >
            {team.flag} {team.name} · {match.minute}&apos;
          </motion.p>
        </motion.div>
      </div>
      {/* confetti dots */}
      <ConfettiBurst color={team.color} />
    </motion.div>
  );
}

function ConfettiBurst({ color }: { color: string }) {
  const dots = Array.from({ length: 24 }, (_, i) => i);
  return (
    <div className="absolute inset-0">
      {dots.map((i) => {
        const angle = (i / 24) * Math.PI * 2;
        const dist = 120 + ((i * 13) % 80);
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        const palette = ["#FACC15", "#FFFFFF", color];
        const c = palette[i % palette.length]!;
        return (
          <motion.span
            key={`burst-${i}`}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
            animate={{ x: dx, y: dy, opacity: 0, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: c, boxShadow: `0 0 8px ${c}` }}
          />
        );
      })}
    </div>
  );
}
