"use client";

import { motion } from "framer-motion";

/**
 * Decorative SVG soccer ball that floats + slowly rotates.
 * Cheap (no asset request), respects prefers-reduced-motion via framer's reducedMotion: "user".
 */
export function FloatingBall({
  className = "",
  size = 96,
  delay = 0,
  duration = 7,
}: {
  className?: string;
  size?: number;
  delay?: number;
  duration?: number;
}) {
  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none absolute ${className}`}
      style={{ width: size, height: size }}
      initial={{ y: 0, rotate: 0 }}
      animate={{ y: [-12, 12, -12], rotate: 360 }}
      transition={{
        y: { duration, repeat: Infinity, ease: "easeInOut", delay },
        rotate: { duration: duration * 6, repeat: Infinity, ease: "linear", delay },
      }}
    >
      <Ball size={size} />
    </motion.div>
  );
}

function Ball({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.25))" }}
    >
      <defs>
        <radialGradient id="ballShade" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#94a3b8" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#ballShade)" stroke="#0f172a" strokeWidth="2" />
      {/* Pentagons (simplified classic ball pattern) */}
      <g fill="#0f172a">
        <polygon points="50,28 60,36 56,48 44,48 40,36" />
        <polygon points="28,52 36,46 44,52 42,62 32,62" />
        <polygon points="72,52 64,46 56,52 58,62 68,62" />
        <polygon points="50,70 58,76 54,84 46,84 42,76" />
      </g>
      <g stroke="#0f172a" strokeWidth="1.5" fill="none" strokeLinecap="round">
        <line x1="50" y1="28" x2="50" y2="14" />
        <line x1="40" y1="36" x2="24" y2="32" />
        <line x1="60" y1="36" x2="76" y2="32" />
        <line x1="44" y1="48" x2="36" y2="46" />
        <line x1="56" y1="48" x2="64" y2="46" />
        <line x1="42" y1="62" x2="34" y2="70" />
        <line x1="58" y1="62" x2="66" y2="70" />
        <line x1="50" y1="70" x2="50" y2="84" />
      </g>
    </svg>
  );
}
