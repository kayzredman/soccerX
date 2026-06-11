/**
 * Real footballers from the WC2026 draw, with transparent-cutout PNG
 * portraits sourced from TheSportsDB (open CDN).
 *
 * `accent` matches a vibe color from our group palette so the collage
 * stays on-brand when masked / overlaid.
 */
export type Player = {
  id: string;
  name: string;
  team: string;
  /** flag emoji */
  flag: string;
  /** transparent cutout PNG */
  src: string;
  alt: string;
  /** css color used for the glow ring + caption underline */
  accent: string;
};

export const PLAYERS: Player[] = [
  {
    id: "messi",
    name: "Lionel Messi",
    team: "Argentina",
    flag: "🇦🇷",
    src: "https://r2.thesportsdb.com/images/media/player/cutout/e0i2051750317027.png",
    alt: "Lionel Messi cutout",
    accent: "#22D3EE",
  },
  {
    id: "ronaldo",
    name: "Cristiano Ronaldo",
    team: "Portugal",
    flag: "🇵🇹",
    src: "https://r2.thesportsdb.com/images/media/player/cutout/a19jje1761592498.png",
    alt: "Cristiano Ronaldo cutout",
    accent: "#EF4444",
  },
  {
    id: "mbappe",
    name: "Kylian Mbappé",
    team: "France",
    flag: "🇫🇷",
    src: "https://r2.thesportsdb.com/images/media/player/cutout/h9u9vz1733653583.png",
    alt: "Kylian Mbappé cutout",
    accent: "#3B82F6",
  },
  {
    id: "vinicius",
    name: "Vinícius Jr.",
    team: "Brazil",
    flag: "🇧🇷",
    src: "https://r2.thesportsdb.com/images/media/player/cutout/ejuxsh1750271859.png",
    alt: "Vinícius Junior cutout",
    accent: "#FACC15",
  },
  {
    id: "haaland",
    name: "Erling Haaland",
    team: "Norway",
    flag: "🇳🇴",
    src: "https://r2.thesportsdb.com/images/media/player/cutout/un3jr11769182465.png",
    alt: "Erling Haaland cutout",
    accent: "#C6FF3D",
  },
  {
    id: "salah",
    name: "Mohamed Salah",
    team: "Egypt",
    flag: "🇪🇬",
    src: "https://r2.thesportsdb.com/images/media/player/cutout/3blc581757088735.png",
    alt: "Mohamed Salah cutout",
    accent: "#F472B6",
  },
  {
    id: "son",
    name: "Heung-min Son",
    team: "South Korea",
    flag: "🇰🇷",
    src: "https://r2.thesportsdb.com/images/media/player/cutout/a5cqf81766425262.png",
    alt: "Heung-min Son cutout",
    accent: "#22D3EE",
  },
  {
    id: "kane",
    name: "Harry Kane",
    team: "England",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    src: "https://r2.thesportsdb.com/images/media/player/cutout/j4ouvd1756408895.png",
    alt: "Harry Kane cutout",
    accent: "#A855F7",
  },
  {
    id: "modric",
    name: "Luka Modrić",
    team: "Croatia",
    flag: "🇭🇷",
    src: "https://r2.thesportsdb.com/images/media/player/cutout/msewdx1758892756.png",
    alt: "Luka Modrić cutout",
    accent: "#F87171",
  },
  {
    id: "neymar",
    name: "Neymar Jr.",
    team: "Brazil",
    flag: "🇧🇷",
    src: "https://r2.thesportsdb.com/images/media/player/cutout/av4ar01767782947.png",
    alt: "Neymar cutout",
    accent: "#FBBF24",
  },
  {
    id: "bellingham",
    name: "Jude Bellingham",
    team: "England",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    src: "https://r2.thesportsdb.com/images/media/player/cutout/trk5271750271712.png",
    alt: "Jude Bellingham cutout",
    accent: "#FFFFFF",
  },
  {
    id: "pedri",
    name: "Pedri",
    team: "Spain",
    flag: "🇪🇸",
    src: "https://r2.thesportsdb.com/images/media/player/cutout/srwppu1424795582.png",
    alt: "Pedri cutout",
    accent: "#FBBF24",
  },
  {
    id: "rodri",
    name: "Rodri",
    team: "Spain",
    flag: "🇪🇸",
    src: "https://r2.thesportsdb.com/images/media/player/cutout/0ml2zi1761148957.png",
    alt: "Rodri cutout",
    accent: "#EF4444",
  },
  {
    id: "saka",
    name: "Bukayo Saka",
    team: "England",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    src: "https://r2.thesportsdb.com/images/media/player/cutout/xfwok41769331816.png",
    alt: "Bukayo Saka cutout",
    accent: "#F472B6",
  },
];

export function pickPlayers(ids: string[]): Player[] {
  return ids
    .map((id) => PLAYERS.find((p) => p.id === id))
    .filter((p): p is Player => Boolean(p));
}
