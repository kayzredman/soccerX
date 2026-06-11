"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLiveFeed } from "@/lib/live-feed";
import { LiveTicker } from "@/components/live-ticker";
import { LiveHero } from "@/components/live-hero";
import { LiveCard } from "@/components/live-card";
import { LowerThird } from "@/components/lower-third";
import { MatchAlerts } from "@/components/match-alerts";

export default function LivePage() {
  const { matches, events, chyronEventId } = useLiveFeed();
  const [pinnedId, setPinnedId] = useState<string | null>(null);

  // featured = pinned, else match with most recent pulse, else first live
  const featured = useMemo(() => {
    if (pinnedId) {
      const p = matches.find((m) => m.id === pinnedId);
      if (p) return p;
    }
    const pulsing = matches.find((m) => m.pulse > 0);
    if (pulsing) return pulsing;
    const live = matches.find((m) => m.status === "live");
    if (live) return live;
    return matches[0];
  }, [matches, pinnedId]);

  const chyronEvent = useMemo(
    () => events.find((e) => e.id === chyronEventId) ?? null,
    [events, chyronEventId],
  );

  const liveCount = matches.filter((m) => m.status === "live").length;
  const goalsToday = events.filter((e) => e.type === "goal").length;

  if (!featured) return null;
  const others = matches.filter((m) => m.id !== featured.id);

  return (
    <div className="-mt-8 sm:-mt-12">
      {/* CNN-style broadcast frame */}
      <LiveTicker matches={matches} />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        {/* page meta strip */}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-red-500">
              ● Broadcast · Matchday 1
            </p>
            <h1 className="mt-2 font-display text-4xl font-black tracking-tight text-fg sm:text-5xl">
              Live <span className="bg-gradient-to-r from-red-500 via-amber-400 to-neon-cyan bg-clip-text text-transparent">Centre</span>
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <MiniStat label="Live" value={liveCount} color="#EF4444" pulse />
            <MiniStat label="Goals" value={goalsToday} color="#FACC15" />
            <MiniStat label="Matches" value={matches.length} color="#22D3EE" />
          </div>
        </div>

        {/* Hero match */}
        <LiveHero match={featured} events={events} />

        {/* Other matches */}
        <section className="mt-6">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-fg-dim">
            Other matches · tap to feature
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((m) => (
              <motion.div
                key={m.id}
                layout
                transition={{ type: "spring", stiffness: 220, damping: 24 }}
              >
                <LiveCard
                  match={m}
                  active={m.id === pinnedId}
                  onClick={() => setPinnedId(m.id === pinnedId ? null : m.id)}
                />
              </motion.div>
            ))}
          </div>
        </section>

        {/* Recent events feed */}
        <section className="mt-10">
          <div className="flex items-end justify-between">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-fg-dim">
              Recent events
            </p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-fg-dim/60">
              Auto-refresh · 10–14s
            </p>
          </div>
          <ul className="mt-3 divide-y divide-line/10 rounded-2xl border border-line/10 bg-surface-2">
            {events.length === 0 && (
              <li className="px-4 py-6 text-center font-mono text-[12px] text-fg-dim">
                Waiting for the next moment…
              </li>
            )}
            {events.slice(0, 8).map((e) => (
              <motion.li
                key={e.id}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 px-4 py-3"
              >
                <span className="w-10 font-mono text-[12px] text-fg-dim">{e.minute}&apos;</span>
                <span
                  className="inline-flex h-6 items-center gap-1 rounded px-1.5 font-mono text-[10px] font-black uppercase tracking-widest"
                  style={{
                    backgroundColor:
                      e.type === "goal" ? "#FACC15"
                      : e.type === "card" ? "#FBBF24"
                      : e.type === "var" ? "#3B82F6"
                      : e.type === "kickoff" ? "#C6FF3D"
                      : "#71717A",
                    color: e.type === "var" ? "#FFFFFF" : "#111111",
                  }}
                >
                  {e.type}
                </span>
                <span className="text-sm">{e.team.flag}</span>
                <span className="font-bold text-fg">{e.player}</span>
                {e.detail && (
                  <span className="ml-auto font-mono text-[11px] uppercase tracking-widest text-fg-dim">
                    {e.detail}
                  </span>
                )}
              </motion.li>
            ))}
          </ul>
        </section>
      </div>

      <LowerThird event={chyronEvent} />
      <MatchAlerts
        events={events}
        matches={matches}
        featuredMatchId={featured.id}
        onPick={(id) => setPinnedId(id)}
      />
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
  pulse,
}: {
  label: string;
  value: number;
  color: string;
  pulse?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl border border-line/10 bg-surface-2 px-3 py-2"
      style={{ boxShadow: `inset 0 0 0 1px ${color}22` }}
    >
      {pulse ? (
        <motion.span
          animate={{ opacity: [1, 0.35, 1] }}
          transition={{ duration: 1.1, repeat: Infinity }}
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      )}
      <span className="font-mono text-[10px] uppercase tracking-widest text-fg-dim">{label}</span>
      <span className="font-mono text-sm font-black tabular-nums text-fg">{value}</span>
    </div>
  );
}
