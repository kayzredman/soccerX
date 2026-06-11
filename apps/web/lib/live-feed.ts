"use client";

import { useEffect, useReducer, useRef } from "react";

/**
 * Fake live-match feed for the broadcast UI.
 * A reducer-driven tick that promotes events (goal, card, var, kickoff,
 * full-time) on a 10–14s cadence so the UI feels alive.
 *
 * Swap this whole module for a real WebSocket/SSE feed later — the
 * `LiveState` and `LiveEvent` shapes are the contract.
 */

export type Side = "home" | "away";
export type Severity = "normal" | "live" | "late" | "ft";

export type Team = {
  code: string;
  name: string;
  flag: string;
  color: string;
};

export type Match = {
  id: string;
  home: Team;
  away: Team;
  homeScore: number;
  awayScore: number;
  /** clock in minutes (0–95) */
  minute: number;
  /** rendered clock label ("HT", "67'", "FT", "—") */
  clockLabel: string;
  status: "scheduled" | "live" | "ht" | "ft";
  venue: string;
  /** UI severity drives accent color */
  severity: Severity;
  /** flashes briefly after goals */
  pulse: number;
  /** home possession % (0–100), away = 100 - this */
  possession: number;
  /** shots on goal */
  homeShots: number;
  awayShots: number;
  /** expected goals */
  homeXg: number;
  awayXg: number;
};

export type LiveEvent = {
  id: string;
  matchId: string;
  /** wall-clock when event was created */
  ts: number;
  minute: number;
  type: "goal" | "card" | "var" | "kickoff" | "ft" | "ht" | "sub";
  side: Side;
  player: string;
  detail?: string;
  /** team colors for chyron */
  team: Team;
};

export type LiveState = {
  matches: Match[];
  events: LiveEvent[];
  /** id of the lower-third event currently on-air (null = nothing) */
  chyronEventId: string | null;
};

// ---------- seed data ----------------------------------------------------

const TEAMS: Record<string, Team> = {
  ARG: { code: "ARG", name: "Argentina",  flag: "🇦🇷", color: "#75AADB" },
  MEX: { code: "MEX", name: "Mexico",     flag: "🇲🇽", color: "#15803D" },
  RSA: { code: "RSA", name: "S. Africa",  flag: "🇿🇦", color: "#FFB81C" },
  FRA: { code: "FRA", name: "France",     flag: "🇫🇷", color: "#3B82F6" },
  GER: { code: "GER", name: "Germany",    flag: "🇩🇪", color: "#FACC15" },
  BRA: { code: "BRA", name: "Brazil",     flag: "🇧🇷", color: "#22C55E" },
  ESP: { code: "ESP", name: "Spain",      flag: "🇪🇸", color: "#EF4444" },
  ENG: { code: "ENG", name: "England",    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", color: "#FFFFFF" },
  PRT: { code: "POR", name: "Portugal",   flag: "🇵🇹", color: "#DC2626" },
  NLD: { code: "NED", name: "Netherlands",flag: "🇳🇱", color: "#F97316" },
  KOR: { code: "KOR", name: "S. Korea",   flag: "🇰🇷", color: "#EF4444" },
  USA: { code: "USA", name: "USA",        flag: "🇺🇸", color: "#3B82F6" },
};

const SCORERS: Record<string, string[]> = {
  ARG: ["L. Messi", "L. Martinez", "J. Alvarez", "E. Fernández"],
  MEX: ["H. Lozano", "S. Giménez", "E. Álvarez"],
  RSA: ["P. Foster", "L. Mokoena"],
  FRA: ["K. Mbappé", "A. Griezmann", "O. Dembélé"],
  GER: ["J. Musiala", "K. Havertz", "S. Gnabry"],
  BRA: ["Vinícius Jr.", "Rodrygo", "Endrick", "Raphinha"],
  ESP: ["Pedri", "Lamine Yamal", "Á. Morata"],
  ENG: ["J. Bellingham", "H. Kane", "B. Saka", "P. Foden"],
  POR: ["C. Ronaldo", "B. Fernandes", "R. Leão"],
  NED: ["C. Gakpo", "M. Depay", "X. Simons"],
  KOR: ["H. Son", "L. Kang-in"],
  USA: ["C. Pulisic", "T. Weah", "F. Balogun"],
};

const VENUES = [
  "Estadio Azteca",
  "MetLife Stadium",
  "SoFi Stadium",
  "AT&T Stadium",
  "BMO Field",
  "Mercedes-Benz Stadium",
  "Levi's Stadium",
  "Lumen Field",
];

function clockFor(m: Match): string {
  if (m.status === "scheduled") return "—";
  if (m.status === "ht") return "HT";
  if (m.status === "ft") return "FT";
  return `${m.minute}'`;
}

function severityFor(m: Match): Severity {
  if (m.status === "ft") return "ft";
  if (m.status === "ht") return "normal";
  if (m.minute >= 80) return "late";
  return m.status === "live" ? "live" : "normal";
}

function mkMatch(
  id: string,
  homeCode: string,
  awayCode: string,
  venue: string,
  startedAtMin: number,
): Match {
  const home = TEAMS[homeCode];
  const away = TEAMS[awayCode];
  if (!home || !away) throw new Error(`Unknown team in seed: ${homeCode}/${awayCode}`);
  const base: Match = {
    id,
    home,
    away,
    homeScore: 0,
    awayScore: 0,
    minute: Math.max(0, startedAtMin),
    clockLabel: "",
    status: startedAtMin > 0 ? "live" : "scheduled",
    venue,
    severity: "normal",
    pulse: 0,
    possession: 50,
    homeShots: 0,
    awayShots: 0,
    homeXg: 0,
    awayXg: 0,
  };
  base.clockLabel = clockFor(base);
  base.severity = severityFor(base);
  return base;
}

function seed(): LiveState {
  const matches: Match[] = [
    mkMatch("m1", "ARG", "MEX", VENUES[0]!, 38),
    mkMatch("m2", "FRA", "GER", VENUES[1]!, 22),
    mkMatch("m3", "BRA", "ESP", VENUES[2]!, 67),
    mkMatch("m4", "ENG", "PRT", VENUES[3]!, 5),
    mkMatch("m5", "NLD", "KOR", VENUES[4]!, 0),
    mkMatch("m6", "USA", "RSA", VENUES[5]!, 0),
  ];
  // ARG 2-1 MEX, dominant
  Object.assign(matches[0]!, {
    homeScore: 2, awayScore: 1, possession: 62,
    homeShots: 9, awayShots: 4, homeXg: 1.8, awayXg: 0.7,
  });
  // FRA 1-1 GER, even
  Object.assign(matches[1]!, {
    homeScore: 1, awayScore: 1, possession: 48,
    homeShots: 5, awayShots: 5, homeXg: 1.1, awayXg: 1.3,
  });
  // BRA 0-2 ESP, upset in progress
  Object.assign(matches[2]!, {
    homeScore: 0, awayScore: 2, possession: 58,
    homeShots: 11, awayShots: 6, homeXg: 1.5, awayXg: 1.9,
  });
  // ENG 0-0 PRT, early
  Object.assign(matches[3]!, { possession: 53, homeShots: 1, awayShots: 0 });
  return { matches, events: [], chyronEventId: null };
}

// ---------- reducer ------------------------------------------------------

type Action =
  | { kind: "tick" }
  | { kind: "spawn" }
  | { kind: "clearChyron"; id: string };

function rng<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function nextId(): string {
  return `evt_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
}

function reducer(state: LiveState, action: Action): LiveState {
  switch (action.kind) {
    case "tick": {
      const matches = state.matches.map((m) => {
        if (m.status === "ft" || m.status === "scheduled") return m;
        const next = { ...m, pulse: Math.max(0, m.pulse - 1) };
        if (next.status === "live") {
          next.minute = Math.min(95, next.minute + 1);
          if (next.minute === 45) next.status = "ht";
          if (next.minute >= 90 && Math.random() < 0.18) next.status = "ft";
        } else if (next.status === "ht") {
          if (Math.random() < 0.35) {
            next.status = "live";
            next.minute = 46;
          }
        }
        // possession drift +/- 1.5, clamped 30..70
        const drift = (Math.random() - 0.5) * 3;
        next.possession = Math.max(30, Math.min(70, next.possession + drift));
        next.clockLabel = clockFor(next);
        next.severity = severityFor(next);
        return next;
      });
      return { ...state, matches };
    }

    case "spawn": {
      const liveMatches = state.matches.filter((m) => m.status === "live");
      if (liveMatches.length === 0) {
        // promote a scheduled match to live
        const sched = state.matches.find((m) => m.status === "scheduled");
        if (!sched) return state;
        const promoted = state.matches.map((m) =>
          m.id === sched.id
            ? { ...m, status: "live" as const, minute: 1, clockLabel: "1'", severity: "live" as const }
            : m,
        );
        const kickoff: LiveEvent = {
          id: nextId(),
          matchId: sched.id,
          ts: Date.now(),
          minute: 1,
          type: "kickoff",
          side: "home",
          player: sched.home.name,
          detail: "Kick-off",
          team: sched.home,
        };
        return {
          matches: promoted,
          events: [kickoff, ...state.events].slice(0, 25),
          chyronEventId: kickoff.id,
        };
      }

      const m = rng(liveMatches);
      const side: Side = Math.random() < 0.5 ? "home" : "away";
      const team = side === "home" ? m.home : m.away;
      const roll = Math.random();
      const type: LiveEvent["type"] =
        roll < 0.35 ? "goal" :
        roll < 0.55 ? "card" :
        roll < 0.7  ? "var"  :
        roll < 0.85 ? "sub"  :
        m.minute >= 90 ? "ft" : "card";

      const scorers = SCORERS[team.code] ?? ["#10"];
      const player = rng(scorers);

      let matches = state.matches;
      let detail: string | undefined;
      if (type === "goal") {
        const xgAdd = 0.4 + Math.random() * 0.7;
        matches = state.matches.map((x) =>
          x.id !== m.id
            ? x
            : {
                ...x,
                pulse: 6,
                homeScore: side === "home" ? x.homeScore + 1 : x.homeScore,
                awayScore: side === "away" ? x.awayScore + 1 : x.awayScore,
                homeShots: side === "home" ? x.homeShots + 1 : x.homeShots,
                awayShots: side === "away" ? x.awayShots + 1 : x.awayShots,
                homeXg: side === "home" ? +(x.homeXg + xgAdd).toFixed(2) : x.homeXg,
                awayXg: side === "away" ? +(x.awayXg + xgAdd).toFixed(2) : x.awayXg,
              },
        );
        detail = "GOAL";
      } else if (type === "card") {
        detail = Math.random() < 0.85 ? "Yellow card" : "Red card";
      } else if (type === "var") {
        detail = "VAR review";
      } else if (type === "sub") {
        const other = rng(scorers.filter((p) => p !== player));
        detail = `Sub · ${other ?? "Bench"} on`;
      } else if (type === "ft") {
        matches = state.matches.map((x) =>
          x.id !== m.id ? x : { ...x, status: "ft" as const, severity: "ft" as const, clockLabel: "FT" },
        );
        detail = "Full time";
      }

      const evt: LiveEvent = {
        id: nextId(),
        matchId: m.id,
        ts: Date.now(),
        minute: m.minute,
        type,
        side,
        player,
        team,
        ...(detail !== undefined ? { detail } : {}),
      };
      return {
        matches,
        events: [evt, ...state.events].slice(0, 25),
        chyronEventId: evt.id,
      };
    }

    case "clearChyron":
      return state.chyronEventId === action.id
        ? { ...state, chyronEventId: null }
        : state;
  }
}

// ---------- hook ---------------------------------------------------------

export function useLiveFeed(): LiveState {
  const [state, dispatch] = useReducer(reducer, undefined, seed);
  const chyronTimer = useRef<number | null>(null);

  // clock tick — every 4s = 1 in-match minute
  useEffect(() => {
    const id = window.setInterval(() => dispatch({ kind: "tick" }), 4000);
    return () => window.clearInterval(id);
  }, []);

  // event spawner — every 10–14s
  useEffect(() => {
    let id: number;
    const schedule = () => {
      const delay = 10000 + Math.random() * 4000;
      id = window.setTimeout(() => {
        dispatch({ kind: "spawn" });
        schedule();
      }, delay);
    };
    schedule();
    return () => window.clearTimeout(id);
  }, []);

  // auto-retract chyron after 5.5s
  useEffect(() => {
    if (!state.chyronEventId) return;
    if (chyronTimer.current) window.clearTimeout(chyronTimer.current);
    const evtId = state.chyronEventId;
    chyronTimer.current = window.setTimeout(() => {
      dispatch({ kind: "clearChyron", id: evtId });
    }, 5500);
    return () => {
      if (chyronTimer.current) window.clearTimeout(chyronTimer.current);
    };
  }, [state.chyronEventId]);

  return state;
}
