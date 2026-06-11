// Mock data for SoccerX UI scaffold.
// Real 2026 FIFA World Cup draw (Dec 5, 2025, Kennedy Center, Washington DC).
// Source: en.wikipedia.org/wiki/2026_FIFA_World_Cup
// Swap to live API calls (lib/api.ts) once the look/feel is signed off.

export type MockTeam = {
  id: string;
  name: string;
  code: string;
  flag: string;
  pot?: 1 | 2 | 3 | 4;
};

export type MockGroup = {
  id: string;
  letter: string;
  teams: MockTeam[];
  /** Signature accent color for this group — used across UI */
  accent: { from: string; to: string; ring: string; text: string };
};

export type MockLeague = {
  id: string;
  name: string;
  code: string;
  memberCount: number;
  myRank: number;
};

export type MockLeader = {
  rank: number;
  userId: string;
  handle: string;
  points: number;
  streak: number;
  delta: number;
  isMe?: boolean;
};

export const KICKOFF_ISO = "2026-06-11T19:00:00.000Z"; // Mexico v South Africa, Estadio Azteca, 13:00 CDT

const t = (id: string, name: string, code: string, flag: string, pot: 1 | 2 | 3 | 4): MockTeam =>
  ({ id, name, code, flag, pot });

// Group accent palette — each group gets its own signature hue
const accents = {
  scarlet:  { from: "#FF3B6E", to: "#FF8A4C", ring: "#FF3B6E", text: "#FFB3C6" },
  tangerine:{ from: "#FF8A1F", to: "#FFD23F", ring: "#FFA63D", text: "#FFD899" },
  amber:    { from: "#FFC93D", to: "#FFE16B", ring: "#FFD23F", text: "#FFEB99" },
  lime:     { from: "#C6FF3D", to: "#7EFF8A", ring: "#C6FF3D", text: "#E3FF9B" },
  emerald:  { from: "#22D3EE", to: "#34D399", ring: "#22D3EE", text: "#A7F3D0" },
  cyan:     { from: "#22D3EE", to: "#3B82F6", ring: "#22D3EE", text: "#BAE6FD" },
  azure:    { from: "#3B82F6", to: "#6366F1", ring: "#60A5FA", text: "#BFDBFE" },
  indigo:   { from: "#6366F1", to: "#A855F7", ring: "#818CF8", text: "#C7D2FE" },
  violet:   { from: "#A855F7", to: "#EC4899", ring: "#C084FC", text: "#E9D5FF" },
  magenta:  { from: "#F472B6", to: "#FB7185", ring: "#F472B6", text: "#FBCFE8" },
  coral:    { from: "#FB7185", to: "#FBBF24", ring: "#FB7185", text: "#FECDD3" },
  teal:     { from: "#14B8A6", to: "#06B6D4", ring: "#2DD4BF", text: "#99F6E4" },
} as const;

export const MOCK_GROUPS: MockGroup[] = [
  {
    id: "g-a", letter: "A", accent: accents.scarlet,
    teams: [
      t("mex", "Mexico",         "MEX", "🇲🇽", 1),
      t("rsa", "South Africa",   "RSA", "🇿🇦", 4),
      t("kor", "Korea Republic", "KOR", "🇰🇷", 2),
      t("cze", "Czechia",        "CZE", "🇨🇿", 3),
    ],
  },
  {
    id: "g-b", letter: "B", accent: accents.tangerine,
    teams: [
      t("can", "Canada",                 "CAN", "🇨🇦", 1),
      t("bih", "Bosnia and Herzegovina", "BIH", "🇧🇦", 4),
      t("qat", "Qatar",                  "QAT", "🇶🇦", 3),
      t("sui", "Switzerland",            "SUI", "🇨🇭", 2),
    ],
  },
  {
    id: "g-c", letter: "C", accent: accents.amber,
    teams: [
      t("bra", "Brazil",   "BRA", "🇧🇷", 1),
      t("mar", "Morocco",  "MAR", "🇲🇦", 2),
      t("hai", "Haiti",    "HAI", "🇭🇹", 4),
      t("sco", "Scotland", "SCO", "🏴󠁧󠁢󠁳󠁣󠁴󠁿", 3),
    ],
  },
  {
    id: "g-d", letter: "D", accent: accents.lime,
    teams: [
      t("usa", "United States", "USA", "🇺🇸", 1),
      t("par", "Paraguay",      "PAR", "🇵🇾", 3),
      t("aus", "Australia",     "AUS", "🇦🇺", 2),
      t("tur", "Türkiye",       "TUR", "🇹🇷", 4),
    ],
  },
  {
    id: "g-e", letter: "E", accent: accents.emerald,
    teams: [
      t("ger", "Germany",     "GER", "🇩🇪", 1),
      t("cuw", "Curaçao",     "CUW", "🇨🇼", 4),
      t("civ", "Côte d'Ivoire","CIV", "🇨🇮", 3),
      t("ecu", "Ecuador",     "ECU", "🇪🇨", 2),
    ],
  },
  {
    id: "g-f", letter: "F", accent: accents.cyan,
    teams: [
      t("ned", "Netherlands", "NED", "🇳🇱", 1),
      t("jpn", "Japan",       "JPN", "🇯🇵", 2),
      t("swe", "Sweden",      "SWE", "🇸🇪", 4),
      t("tun", "Tunisia",     "TUN", "🇹🇳", 3),
    ],
  },
  {
    id: "g-g", letter: "G", accent: accents.azure,
    teams: [
      t("bel", "Belgium",     "BEL", "🇧🇪", 1),
      t("egy", "Egypt",       "EGY", "🇪🇬", 3),
      t("irn", "IR Iran",     "IRN", "🇮🇷", 2),
      t("nzl", "New Zealand", "NZL", "🇳🇿", 4),
    ],
  },
  {
    id: "g-h", letter: "H", accent: accents.indigo,
    teams: [
      t("esp", "Spain",        "ESP", "🇪🇸", 1),
      t("cpv", "Cabo Verde",   "CPV", "🇨🇻", 3),
      t("ksa", "Saudi Arabia", "KSA", "🇸🇦", 4),
      t("uru", "Uruguay",      "URU", "🇺🇾", 2),
    ],
  },
  {
    id: "g-i", letter: "I", accent: accents.violet,
    teams: [
      t("fra", "France",  "FRA", "🇫🇷", 1),
      t("sen", "Senegal", "SEN", "🇸🇳", 2),
      t("irq", "Iraq",    "IRQ", "🇮🇶", 4),
      t("nor", "Norway",  "NOR", "🇳🇴", 3),
    ],
  },
  {
    id: "g-j", letter: "J", accent: accents.magenta,
    teams: [
      t("arg", "Argentina", "ARG", "🇦🇷", 1),
      t("alg", "Algeria",   "ALG", "🇩🇿", 3),
      t("aut", "Austria",   "AUT", "🇦🇹", 2),
      t("jor", "Jordan",    "JOR", "🇯🇴", 4),
    ],
  },
  {
    id: "g-k", letter: "K", accent: accents.coral,
    teams: [
      t("por", "Portugal",   "POR", "🇵🇹", 1),
      t("cod", "Congo DR",   "COD", "🇨🇩", 4),
      t("uzb", "Uzbekistan", "UZB", "🇺🇿", 3),
      t("col", "Colombia",   "COL", "🇨🇴", 2),
    ],
  },
  {
    id: "g-l", letter: "L", accent: accents.teal,
    teams: [
      t("eng", "England",  "ENG", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", 1),
      t("cro", "Croatia",  "CRO", "🇭🇷", 2),
      t("gha", "Ghana",    "GHA", "🇬🇭", 3),
      t("pan", "Panama",   "PAN", "🇵🇦", 4),
    ],
  },
];

export type MockStanding = {
  teamId: string;
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

export type MockNextFixture = {
  home: string;
  away: string;
  kickoff: string;
  /** match-day label e.g. "MD3" */
  md: string;
};

const st = (
  teamId: string,
  w: number,
  d: number,
  l: number,
  gf: number,
  ga: number,
  form: ("W" | "D" | "L")[],
): MockStanding => ({
  teamId,
  mp: w + d + l,
  w,
  d,
  l,
  gf,
  ga,
  gd: gf - ga,
  pts: w * 3 + d,
  form,
});

/** Live group standings — opening week, ~2 matches in. Pre-sorted. */
export const MOCK_STANDINGS: Record<string, MockStanding[]> = {
  "g-a": [
    st("mex", 2, 0, 0, 4, 1, ["W", "W"]),
    st("kor", 1, 1, 0, 3, 2, ["W", "D"]),
    st("cze", 0, 1, 1, 1, 2, ["D", "L"]),
    st("rsa", 0, 0, 2, 0, 3, ["L", "L"]),
  ],
  "g-b": [
    st("sui", 2, 0, 0, 3, 0, ["W", "W"]),
    st("can", 1, 0, 1, 2, 2, ["W", "L"]),
    st("qat", 0, 1, 1, 1, 2, ["L", "D"]),
    st("bih", 0, 1, 1, 1, 3, ["D", "L"]),
  ],
  "g-c": [
    st("bra", 2, 0, 0, 5, 1, ["W", "W"]),
    st("mar", 1, 1, 0, 3, 2, ["D", "W"]),
    st("sco", 0, 1, 1, 1, 3, ["L", "D"]),
    st("hai", 0, 0, 2, 0, 3, ["L", "L"]),
  ],
  "g-d": [
    st("usa", 1, 1, 0, 3, 2, ["W", "D"]),
    st("aus", 1, 1, 0, 2, 1, ["D", "W"]),
    st("tur", 0, 1, 1, 1, 2, ["L", "D"]),
    st("par", 0, 1, 1, 1, 2, ["D", "L"]),
  ],
  "g-e": [
    st("ger", 2, 0, 0, 4, 0, ["W", "W"]),
    st("civ", 1, 1, 0, 2, 1, ["D", "W"]),
    st("ecu", 0, 1, 1, 1, 2, ["D", "L"]),
    st("cuw", 0, 0, 2, 0, 4, ["L", "L"]),
  ],
  "g-f": [
    st("jpn", 2, 0, 0, 4, 1, ["W", "W"]),
    st("ned", 1, 0, 1, 3, 2, ["L", "W"]),
    st("swe", 1, 0, 1, 2, 3, ["W", "L"]),
    st("tun", 0, 0, 2, 0, 3, ["L", "L"]),
  ],
  "g-g": [
    st("bel", 2, 0, 0, 4, 1, ["W", "W"]),
    st("irn", 1, 1, 0, 2, 1, ["W", "D"]),
    st("nzl", 0, 1, 1, 1, 2, ["D", "L"]),
    st("egy", 0, 0, 2, 0, 3, ["L", "L"]),
  ],
  "g-h": [
    st("esp", 2, 0, 0, 5, 0, ["W", "W"]),
    st("uru", 1, 1, 0, 3, 1, ["W", "D"]),
    st("cpv", 0, 1, 1, 1, 3, ["D", "L"]),
    st("ksa", 0, 0, 2, 0, 5, ["L", "L"]),
  ],
  "g-i": [
    st("sen", 2, 0, 0, 4, 1, ["W", "W"]),
    st("fra", 1, 0, 1, 3, 2, ["L", "W"]),
    st("nor", 1, 0, 1, 2, 3, ["W", "L"]),
    st("irq", 0, 0, 2, 0, 3, ["L", "L"]),
  ],
  "g-j": [
    st("arg", 2, 0, 0, 5, 1, ["W", "W"]),
    st("aut", 1, 1, 0, 3, 2, ["D", "W"]),
    st("alg", 0, 1, 1, 1, 2, ["D", "L"]),
    st("jor", 0, 0, 2, 0, 4, ["L", "L"]),
  ],
  "g-k": [
    st("col", 2, 0, 0, 4, 1, ["W", "W"]),
    st("por", 1, 0, 1, 3, 2, ["L", "W"]),
    st("uzb", 1, 0, 1, 2, 3, ["W", "L"]),
    st("cod", 0, 0, 2, 0, 3, ["L", "L"]),
  ],
  "g-l": [
    st("eng", 2, 0, 0, 4, 0, ["W", "W"]),
    st("gha", 1, 1, 0, 2, 1, ["W", "D"]),
    st("cro", 0, 1, 1, 1, 2, ["D", "L"]),
    st("pan", 0, 0, 2, 0, 4, ["L", "L"]),
  ],
};

/** Next group-stage fixture per group. */
export const MOCK_NEXT_FIXTURES: Record<string, MockNextFixture> = {
  "g-a": { home: "mex", away: "kor", kickoff: "Today · 18:00", md: "MD3" },
  "g-b": { home: "sui", away: "can", kickoff: "Today · 21:00", md: "MD3" },
  "g-c": { home: "bra", away: "mar", kickoff: "Tomorrow · 15:00", md: "MD3" },
  "g-d": { home: "usa", away: "aus", kickoff: "Tomorrow · 18:00", md: "MD3" },
  "g-e": { home: "ger", away: "civ", kickoff: "Tomorrow · 21:00", md: "MD3" },
  "g-f": { home: "jpn", away: "ned", kickoff: "Fri · 15:00", md: "MD3" },
  "g-g": { home: "bel", away: "irn", kickoff: "Fri · 18:00", md: "MD3" },
  "g-h": { home: "esp", away: "uru", kickoff: "Fri · 21:00", md: "MD3" },
  "g-i": { home: "sen", away: "fra", kickoff: "Sat · 15:00", md: "MD3" },
  "g-j": { home: "arg", away: "aut", kickoff: "Sat · 18:00", md: "MD3" },
  "g-k": { home: "col", away: "por", kickoff: "Sat · 21:00", md: "MD3" },
  "g-l": { home: "eng", away: "gha", kickoff: "Sun · 18:00", md: "MD3" },
};

export const MOCK_LEAGUES: MockLeague[] = [
  { id: "l1", name: "Office Hooligans", code: "K7QM3X9P", memberCount: 14, myRank: 3 },
  { id: "l2", name: "Family Feud FC",   code: "B4R2YJN8", memberCount: 6,  myRank: 1 },
  { id: "l3", name: "Coding Crew",      code: "9TXFM2QH", memberCount: 22, myRank: 9 },
];

export const MOCK_LEADERBOARD: MockLeader[] = [
  { rank: 1, userId: "u1", handle: "kojo_24",        points: 218, streak: 7, delta: 0  },
  { rank: 2, userId: "u2", handle: "ama_strikes",    points: 204, streak: 5, delta: 1  },
  { rank: 3, userId: "u3", handle: "fenway_fan",     points: 196, streak: 4, delta: -1 },
  { rank: 4, userId: "u4", handle: "you",            points: 188, streak: 3, delta: 2, isMe: true },
  { rank: 5, userId: "u5", handle: "ronaldo_stan",   points: 181, streak: 2, delta: -2 },
  { rank: 6, userId: "u6", handle: "vinicius_jr",    points: 174, streak: 0, delta: 0  },
  { rank: 7, userId: "u7", handle: "midfield_mafia", points: 169, streak: 1, delta: 3  },
  { rank: 8, userId: "u8", handle: "stoppage_tom",   points: 162, streak: 0, delta: -1 },
  { rank: 9, userId: "u9", handle: "tactic_tee",     points: 158, streak: 0, delta: 0  },
  { rank: 10,userId: "u10",handle: "xg_xena",        points: 151, streak: 0, delta: 1  },
];
