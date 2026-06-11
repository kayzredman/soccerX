// Client-safe API helpers. No Clerk / server-only imports — can be imported
// from "use client" components without breaking the bundle.
import { getEnv } from "@soccerx/config";

const env = getEnv();
const SLUG = "wc2026";

async function safePublicFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export type ApiLeaderboardRow = {
  rank: number;
  userId: string;
  handle: string;
  name: string | null;
  image: string | null;
  country: string | null;
  totalPoints: number;
};

export async function fetchGlobalLeaderboard(
  limit = 50,
): Promise<ApiLeaderboardRow[]> {
  const data = await safePublicFetch<{
    source: "cache" | "live";
    rows: ApiLeaderboardRow[];
  }>(`/tournaments/${SLUG}/leaderboard?limit=${limit}`);
  return data?.rows ?? [];
}
