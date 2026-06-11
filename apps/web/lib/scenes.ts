export type Scene = {
  src: string;
  alt: string;
  /** focal point — keeps the subject in frame as we zoom */
  position?: string;
};

/** Curated photographic scenes — Unsplash CDN, hand-picked for World Cup vibe */
export const SCENES = {
  stadiumNight: {
    src: "https://images.unsplash.com/photo-1522778526097-ce0a22ceb253?auto=format&fit=crop&w=2000&q=80",
    alt: "Floodlit stadium at night with crowd",
    position: "center 35%",
  },
  pitchAerial: {
    src: "https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=2000&q=80",
    alt: "Soccer pitch from above",
    position: "center",
  },
  ballOnGrass: {
    src: "https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=2000&q=80",
    alt: "Soccer ball on grass under floodlights",
    position: "center 60%",
  },
  crowdFlags: {
    src: "https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=2000&q=80",
    alt: "Cheering crowd with flags at a match",
    position: "center 40%",
  },
  trophyLight: {
    src: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=2000&q=80",
    alt: "Stadium under dramatic lighting",
    position: "center 45%",
  },
} as const satisfies Record<string, Scene>;
