import Link from "next/link";
import { Countdown } from "@/components/countdown";
import { PlayerCollage } from "@/components/player-collage";
import { FloatingBall } from "@/components/floating-ball";
import { GroupsStrip } from "@/components/groups-strip";
import { KICKOFF_ISO } from "@/lib/mock";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-20">
        <PlayerCollage variant="hero" />
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[420px] bg-pitch-lines opacity-30" />
        <FloatingBall className="right-6 top-10 hidden sm:block" size={92} />
        <FloatingBall className="-left-6 bottom-32 hidden lg:block" size={64} delay={1.5} duration={9} />
        <div className="relative">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-neon-lime">
            ● Live in 1 day · USA · CAN · MEX
          </p>
          <h1 className="mt-4 font-display text-5xl font-black leading-[0.95] tracking-tight text-balance sm:text-7xl">
            Predict the
            <span className="block bg-gradient-to-r from-neon-lime via-pitch-300 to-neon-cyan bg-clip-text text-transparent">
              entire World Cup.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-fg-muted">
            A 39-day companion game built around the tournament — not a static
            bracket. Pick groups, score live, beat your friends.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/bracket"
              className="group inline-flex items-center gap-2 rounded-xl bg-neon-lime px-5 py-3 font-semibold text-ink-900 shadow-glow transition hover:brightness-110"
            >
              Build my bracket
              <span className="transition group-hover:translate-x-0.5">→</span>
            </Link>
            <Link
              href="/league"
              className="inline-flex items-center gap-2 rounded-xl border border-line/15 bg-surface-2 px-5 py-3 font-semibold text-fg transition hover:border-line/30"
            >
              Start a mini-league
            </Link>
          </div>

          <div className="mt-10 rounded-2xl border border-line/10 bg-surface-2 p-5 shadow-ring backdrop-blur sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-fg-dim">
                  Bracket locks at first kickoff
                </p>
                <p className="mt-1 text-sm text-fg-muted">
                  🇲🇽 Mexico <span className="text-fg-dim">v</span> South Africa 🇿🇦 ·
                  Estadio Azteca
                </p>
              </div>
              <Countdown iso={KICKOFF_ISO} />
            </div>
          </div>
        </div>
      </section>

      {/* Live broadcast strip */}
      <section className="mx-auto mb-8 max-w-6xl px-4 sm:px-6">
        <Link
          href="/live"
          className="group relative flex flex-wrap items-center gap-4 overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-600/15 via-amber-400/10 to-red-600/15 px-5 py-4 transition hover:border-red-500/50"
        >
          <span className="relative inline-flex items-center gap-2 rounded-md bg-red-600 px-2.5 py-1 font-mono text-[11px] font-black uppercase tracking-widest text-white shadow-[0_8px_24px_-8px_rgba(220,38,38,0.8)]">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-white/80" />
              <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-white" />
            </span>
            Live
          </span>
          <p className="font-mono text-[12px] uppercase tracking-widest text-fg">
            6 matches in play · 11 goals today
          </p>
          <span className="ml-auto inline-flex items-center gap-1 font-mono text-[12px] font-bold text-red-500 transition group-hover:translate-x-0.5">
            Open Live Centre →
          </span>
        </Link>
      </section>

      {/* Group leaders strip */}
      <section className="mx-auto mb-8 max-w-6xl px-4 sm:px-6">
        <GroupsStrip />
      </section>

      {/* Cards */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            href="/bracket"
            kicker="01"
            title="Bracket"
            body="Pick winners + runners-up across 12 groups."
            accent="lime"
          />
          <Card
            href="/daily"
            kicker="02"
            title="Daily brief"
            body="5 stories before kickoff. Auto-rotating, hold to pause."
            accent="cyan"
          />
          <Card
            href="/league"
            kicker="03"
            title="Mini-leagues"
            body="Invite friends with an 8-char code. Compete privately."
            accent="magenta"
          />
          <Card
            href="/leaderboard"
            kicker="04"
            title="Leaderboard"
            body="Global, country, and league rankings — refreshed live."
            accent="lime"
          />
        </div>
      </section>
    </div>
  );
}

function Card({
  href,
  kicker,
  title,
  body,
  accent,
}: {
  href: string;
  kicker: string;
  title: string;
  body: string;
  accent: "lime" | "cyan" | "magenta";
}) {
  const accentClass = {
    lime: "group-hover:text-neon-lime",
    cyan: "group-hover:text-neon-cyan",
    magenta: "group-hover:text-neon-magenta",
  }[accent];
  const ringClass = {
    lime: "group-hover:border-neon-lime/40",
    cyan: "group-hover:border-neon-cyan/40",
    magenta: "group-hover:border-neon-magenta/40",
  }[accent];
  return (
    <Link
      href={href as never}
      className={`group relative block overflow-hidden rounded-2xl border border-line/10 bg-surface-2 p-5 transition ${ringClass} hover:bg-surface-3`}
    >
      <span className="font-mono text-[10px] uppercase tracking-widest text-fg-dim">
        {kicker}
      </span>
      <h2
        className={`mt-3 font-display text-2xl font-bold tracking-tight text-fg transition ${accentClass}`}
      >
        {title}
      </h2>
      <p className="mt-1 text-sm text-fg-muted">{body}</p>
      <span className="absolute right-4 top-4 text-fg-dim transition group-hover:translate-x-0.5 group-hover:text-fg">
        →
      </span>
    </Link>
  );
}
