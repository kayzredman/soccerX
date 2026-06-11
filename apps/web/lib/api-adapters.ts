/**
 * Adapter: turn API standings blocks into the shapes StandingsCard expects.
 * Centralised here so the standings UI only knows about one shape.
 */
import type { ApiGroupBlock } from "@/lib/api";
import type { MockGroup, MockStanding, MockTeam } from "@/lib/mock";
import { MOCK_GROUPS } from "@/lib/mock";

const FALLBACK_ACCENT: MockGroup["accent"] = {
  from: "#22D3EE",
  to: "#34D399",
  ring: "#22D3EE",
  text: "#A7F3D0",
};

const ACCENT_POOL: MockGroup["accent"][] = [
  { from: "#FF3B6E", to: "#FF8A4C", ring: "#FF3B6E", text: "#FFB3C6" },
  { from: "#FF8A1F", to: "#FFD23F", ring: "#FFA63D", text: "#FFD899" },
  { from: "#FFC93D", to: "#FFE16B", ring: "#FFD23F", text: "#FFEB99" },
  { from: "#C6FF3D", to: "#7EFF8A", ring: "#C6FF3D", text: "#E3FF9B" },
  { from: "#22D3EE", to: "#34D399", ring: "#22D3EE", text: "#A7F3D0" },
  { from: "#22D3EE", to: "#3B82F6", ring: "#22D3EE", text: "#BAE6FD" },
  { from: "#3B82F6", to: "#6366F1", ring: "#60A5FA", text: "#BFDBFE" },
  { from: "#6366F1", to: "#A855F7", ring: "#818CF8", text: "#C7D2FE" },
  { from: "#A855F7", to: "#EC4899", ring: "#C084FC", text: "#E9D5FF" },
  { from: "#F472B6", to: "#FB7185", ring: "#F472B6", text: "#FBCFE8" },
  { from: "#FB7185", to: "#FBBF24", ring: "#FB7185", text: "#FECDD3" },
  { from: "#14B8A6", to: "#06B6D4", ring: "#2DD4BF", text: "#99F6E4" },
];

function accentForLetter(letter: string): MockGroup["accent"] {
  // Prefer mock-defined accent so the visual mapping stays consistent
  const mock = MOCK_GROUPS.find((g) => g.letter === letter);
  if (mock) return mock.accent;
  const idx = letter.charCodeAt(0) - 65;
  return ACCENT_POOL[idx % ACCENT_POOL.length] ?? FALLBACK_ACCENT;
}

export function groupFromApiBlock(block: ApiGroupBlock): MockGroup {
  const teams: MockTeam[] = block.rows.map((r) => ({
    id: r.teamId,
    name: r.teamName,
    code: r.teamCode,
    flag: r.teamFlag ?? "🏳️",
  }));
  return {
    id: block.id,
    letter: block.letter,
    teams,
    accent: accentForLetter(block.letter),
  };
}

export function standingsFromApiBlock(block: ApiGroupBlock): MockStanding[] {
  return block.rows.map((r) => ({
    teamId: r.teamId,
    mp: r.mp,
    w: r.w,
    d: r.d,
    l: r.l,
    gf: r.gf,
    ga: r.ga,
    gd: r.gd,
    pts: r.pts,
    form: r.form,
  }));
}

export function formatKickoff(iso: string): string {
  // If the seed delivered an ISO timestamp, render relative to today.
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate();
  const time = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (sameDay) return `Today · ${time}`;
  if (isTomorrow) return `Tomorrow · ${time}`;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }) + ` · ${time}`;
}
