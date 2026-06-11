"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { Scene } from "@/lib/scenes";

/**
 * Subtle photographic backdrop with a slow Ken-Burns drift.
 * Heavy gradient mask keeps foreground text legible in either theme.
 */
export function SceneBackground({
  scene,
  variant = "hero",
}: {
  scene: Scene;
  variant?: "hero" | "banner";
}) {
  const height = variant === "hero" ? "h-[520px] sm:h-[640px]" : "h-[280px] sm:h-[340px]";

  return (
    <div className={`pointer-events-none absolute inset-x-0 top-0 -z-10 overflow-hidden ${height}`}>
      <motion.div
        initial={{ scale: 1.08, x: -10, y: -8 }}
        animate={{ scale: 1.18, x: 10, y: 8 }}
        transition={{
          duration: 28,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
        className="absolute inset-0"
      >
        <Image
          src={scene.src}
          alt={scene.alt}
          fill
          priority={variant === "hero"}
          sizes="100vw"
          style={{ objectFit: "cover", objectPosition: scene.position ?? "center" }}
        />
      </motion.div>

      {/* Light-theme mask: warm white wash */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/55 to-white dark:hidden" />
      <div className="absolute inset-0 bg-gradient-to-r from-white/50 via-transparent to-white/30 dark:hidden" />

      {/* Dark-theme mask: deep stadium-night fade */}
      <div className="absolute inset-0 hidden bg-gradient-to-b from-ink-900/60 via-ink-900/80 to-ink-900 dark:block" />
      <div className="absolute inset-0 hidden bg-gradient-to-r from-ink-900/70 via-transparent to-ink-900/40 dark:block" />

      {/* Subtle color wash so it ties to the brand */}
      <div className="absolute inset-0 mix-blend-overlay opacity-30 bg-stadium-radial" />
    </div>
  );
}
