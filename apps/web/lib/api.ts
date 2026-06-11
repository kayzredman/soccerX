import { auth } from "@clerk/nextjs/server";
import { getEnv } from "@soccerx/config";
import {
  MOCK_GROUPS,
  MOCK_NEXT_FIXTURES,
  MOCK_STANDINGS,
} from "@/lib/mock";

const env = getEnv();
const SLUG = "wc2026";

type Init = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

export async function apiFetch(path: string, init: Init = {}): Promise<Response> {
  const { getToken } = await auth();
  const token = await getToken();
  const headers: Record<string, string> = {
    accept: "application/json",
    ...(init.headers ?? {}),
  };
  if (token) headers.authorization = `Bearer ${token}`;
  return fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, { ...init, headers });
}

export async function apiJson<T>(path: string, init: Init = {}): Promise<T> {
  const res = await apiFetch(path, init);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${path}: ${body}`);
  }
  return (await res.json()) as T;
}

// ===== Public (unauth) helpers — safe-fetch with mock fallback ===========

export type ApiStandingRow = {
  teamId: string;
  teamName: string;
  teamCode: string;
  teamFlag: string | null;
  mp: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
  form: ("W" | "D" | "L")[];
};

export type ApiGroupBlock = {
  id: string;
  letter: string;
  rows: ApiStandingRow[];
  next: {
    homeCode: string;
    homeFlag: string | null;
    awayCode: string;
    awayFlag: string | null;
    kickoffAt: string;
  } | null;
  hasLive: boolean;
  /** Set when this block came from the mock fallback. */
  fromMock?: boolean;
};

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

export async function fetchAllStandings(): Promise<ApiGroupBlock[]> {
  const data = await safePublicFetch<{ groups: ApiGroupBlock[] }>(
    `/tournaments/${SLUG}/standings`,
  );
  if (data?.groups?.length) return data.groups;
  return mockToApiBlocks();
}

export async function fetchGroupStanding(
  letter: string,
): Promise<ApiGroupBlock | null> {
  const data = await safePublicFetch<ApiGroupBlock>(
    `/tournaments/${SLUG}/standings/${letter.toUpperCase()}`,
  );
  if (data) return data;
  const all = mockToApiBlocks();
  return all.find((b) => b.letter === letter.toUpperCase()) ?? null;
}

function mockToApiBlocks(): ApiGroupBlock[] {
  return MOCK_GROUPS.map((g): ApiGroupBlock => {
    const standings = MOCK_STANDINGS[g.id] ?? [];
    const teamById = new Map(g.teams.map((t) => [t.id, t]));
    const next = MOCK_NEXT_FIXTURES[g.id];
    const home = next ? teamById.get(next.home) : undefined;
    const away = next ? teamById.get(next.away) : undefined;
    return {
      id: g.id,
      letter: g.letter,
      fromMock: true,
      rows: standings.map((s) => {
        const team = teamById.get(s.teamId);
        return {
          teamId: s.teamId,
          teamName: team?.name ?? s.teamId,
          teamCode: team?.code ?? s.teamId.toUpperCase(),
          teamFlag: team?.flag ?? null,
          mp: s.mp,
          w: s.w,
          d: s.d,
          l: s.l,
          gf: s.gf,
          ga: s.ga,
          gd: s.gd,
          pts: s.pts,
          form: s.form,
        };
      }),
      next:
        next && home && away
          ? {
              homeCode: home.code,
              homeFlag: home.flag,
              awayCode: away.code,
              awayFlag: away.flag,
              kickoffAt: next.kickoff,
            }
          : null,
      hasLive: false,
    };
  });
}

// ===== Picks (authed) =====================================================

export type ApiGroupPickRow = {
  id: string;
  pickType: "group_winner" | "group_runner_up";
  teamId: string;
  groupId: string;
  lockedAt: string | null;
};

export type GroupPickInput = {
  groupId: string;
  pickType: "group_winner" | "group_runner_up";
  teamId: string;
};

/** Server-side fetch of current user's group picks. Returns [] when unauthed. */
export async function fetchMyGroupPicks(): Promise<ApiGroupPickRow[]> {
  try {
    const res = await apiFetch(`/tournaments/${SLUG}/picks/groups`);
    if (!res.ok) return [];
    const data = (await res.json()) as { picks: ApiGroupPickRow[] };
    return data.picks ?? [];
  } catch {
    return [];
  }
}

/** Server-side save of current user's group picks. */
export async function saveMyGroupPicks(
  picksInput: GroupPickInput[],
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  try {
    const res = await apiFetch(`/tournaments/${SLUG}/picks/groups`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ picks: picksInput }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `API ${res.status}: ${body || res.statusText}` };
    }
    const data = (await res.json()) as { count: number };
    return { ok: true, count: data.count };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
