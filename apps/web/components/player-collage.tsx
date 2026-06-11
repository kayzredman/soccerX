"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { pickPlayers, type Player } from "@/lib/players";

/**
 * A layered, parallax collage of footballer cutouts professionally fused
 * into the page. Two-tier:
 *  • back layer: large hero cutout, slow drift + scale
 *  • mid layer: 3 supporting cutouts at different speeds + offsets
 *  • gradient masks for theme-aware legibility
 *  • soft accent glows pulsing behind each player
 */

type Layout = {
  /** absolute positioning + size for each slot */
  className: string;
  /** float amplitude */
  amp: number;
  /** float duration (s) */
  dur: number;
  /** rotation drift (deg) */
  rot: number;
  delay: number;
};

const HERO_IDS = ["messi", "mbappe", "haaland", "bellingham"] as const;
const BANNER_IDS = ["ronaldo", "vinicius", "salah"] as const;

const HERO_LAYOUT: Layout[] = [
  // big anchor — right side
  { className: "right-[-2%] bottom-[-6%] h-[105%] w-[60%] sm:right-[2%] sm:w-[48%]", amp: 14, dur: 11, rot: 2, delay: 0 },
  // mid-left
  { className: "left-[-6%] bottom-[-4%] h-[78%] w-[42%] sm:left-[4%] sm:w-[32%]", amp: 18, dur: 9, rot: -3, delay: 0.6 },
  // top-right behind anchor
  { className: "right-[28%] top-[6%] hidden h-[55%] w-[22%] md:block", amp: 10, dur: 13, rot: 4, delay: 1.1 },
  // small far-left
  { className: "left-[24%] top-[10%] hidden h-[48%] w-[18%] lg:block", amp: 12, dur: 8, rot: -2, delay: 1.7 },
];

const BANNER_LAYOUT: Layout[] = [
  { className: "right-[2%] bottom-[-8%] h-[120%] w-[36%] sm:right-[6%] sm:w-[26%]", amp: 10, dur: 10, rot: 2, delay: 0 },
  { className: "right-[28%] top-[-6%] hidden h-[85%] w-[20%] md:block", amp: 8, dur: 12, rot: -3, delay: 0.7 },
  { className: "left-[6%] bottom-[-4%] hidden h-[95%] w-[22%] lg:block", amp: 14, dur: 9, rot: 3, delay: 1.3 },
];

export function PlayerCollage({
  variant = "hero",
}: {
  variant?: "hero" | "banner";
}) {
  const height =
    variant === "hero"
      ? "h-[560px] sm:h-[680px]"
      : "h-[300px] sm:h-[360px]";
  const players =
    variant === "hero"
      ? pickPlayers(HERO_IDS as unknown as string[])
      : pickPlayers(BANNER_IDS as unknown as string[]);
  const layout = variant === "hero" ? HERO_LAYOUT : BANNER_LAYOUT;

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-0 -z-10 overflow-hidden ${height}`}
    >
      {/* Base wash — looks like a stadium gradient under floodlights */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A1024] via-[#11173B] to-[#1B0F3A] dark:opacity-100 opacity-0 transition-opacity duration-300" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#F2F4FF] via-[#E8ECFF] to-[#F8F0FF] dark:opacity-0 opacity-100 transition-opacity duration-300" />

      {/* Floodlight beams */}
      <div className="absolute -top-32 left-1/2 h-[120%] w-[140%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,_rgba(198,255,61,0.18),_transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(198,255,61,0.10),_transparent_60%)]" />
      <div className="absolute top-0 right-0 h-[80%] w-[60%] bg-[radial-gradient(ellipse_at_top_right,_rgba(34,211,238,0.18),_transparent_60%)]" />
      <div className="absolute top-0 left-0 h-[80%] w-[60%] bg-[radial-gradient(ellipse_at_top_left,_rgba(244,114,182,0.16),_transparent_60%)]" />

      {/* Pitch line hint */}
      <div className="absolute inset-x-0 bottom-0 h-[60%] bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.04)_60%,rgba(0,0,0,0.10))] dark:bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.25)_60%,rgba(0,0,0,0.55))]" />

      {/* Players */}
      {players.map((p, i) => {
        const l = layout[i] ?? layout[0];
        if (!l) return null;
        return <PlayerTile key={p.id} player={p} layout={l} priority={i === 0 && variant === "hero"} />;
      })}

      {/* Soft particle dots (very subtle, gives "stadium dust" feeling) */}
      <Particles />

      {/* Foreground legibility masks */}
      {/* Light theme: cool white fade */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/45 to-white dark:hidden" />
      <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-white/15 dark:hidden" />

      {/* Dark theme: deep ink fade */}
      <div className="absolute inset-0 hidden bg-gradient-to-b from-ink-900/30 via-ink-900/70 to-ink-900 dark:block" />
      <div className="absolute inset-0 hidden bg-gradient-to-r from-ink-900/60 via-transparent to-ink-900/30 dark:block" />

      {/* Brand color wash */}
      <div className="absolute inset-0 mix-blend-overlay opacity-25 bg-stadium-radial" />
    </div>
  );
}

function PlayerTile({
  player,
  layout,
  priority,
}: {
  player: Player;
  layout: Layout;
  priority?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: [0, -layout.amp, 0], rotate: [0, layout.rot, 0] }}
      transition={{
        opacity: { duration: 0.9, delay: layout.delay },
        y: {
          duration: layout.dur,
          repeat: Infinity,
          repeatType: "loop",
          ease: "easeInOut",
          delay: layout.delay,
        },
        rotate: {
          duration: layout.dur * 1.5,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
          delay: layout.delay,
        },
      }}
      className={`absolute ${layout.className}`}
    >
      {/* Accent glow behind the player */}
      <motion.div
        aria-hidden
        animate={{ opacity: [0.35, 0.65, 0.35], scale: [0.9, 1.05, 0.9] }}
        transition={{ duration: layout.dur * 1.2, repeat: Infinity, ease: "easeInOut", delay: layout.delay }}
        className="absolute inset-x-[12%] bottom-[8%] -z-10 h-[55%] rounded-[50%] blur-3xl"
        style={{ backgroundColor: player.accent }}
      />

      <div className="relative h-full w-full">
        <Image
          src={player.src}
          alt={player.alt}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 28vw, (min-width: 640px) 42vw, 60vw"
          style={{ objectFit: "contain", objectPosition: "bottom center" }}
          className="drop-shadow-[0_24px_30px_rgba(0,0,0,0.45)]"
        />
      </div>
    </motion.div>
  );
}

function Particles() {
  const dots = Array.from({ length: 22 }, (_, i) => i);
  return (
    <div className="absolute inset-0">
      {dots.map((i) => {
        const x = (i * 53) % 100;
        const y = (i * 37) % 100;
        const size = 2 + (i % 3);
        const dur = 6 + (i % 5);
        return (
          <motion.span
            key={`dot-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0], y: [0, -12, 0] }}
            transition={{ duration: dur, repeat: Infinity, delay: (i % 7) * 0.4, ease: "easeInOut" }}
            className="absolute rounded-full bg-white/60 dark:bg-white/70"
            style={{ left: `${x}%`, top: `${y}%`, width: size, height: size }}
          />
        );
      })}
    </div>
  );
}
