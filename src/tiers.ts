import { toLeagues } from "./leagues";
import { TIERS } from "./models";

/**
 * Stations of the voyage.
 *
 * A league is a nautical measure — three nautical miles — so the unit was
 * always maritime. The stages take their names from the Odyssey, and they are
 * chosen to mean something to a person building a habit rather than to
 * decorate: Circe's island is where a year vanishes pleasantly, the Sirens are
 * the temptation you have to plan for, Ithaca is arrival.
 *
 * `from` is inclusive: a station begins the moment its league count is reached.
 */
export type Tier = {
  index: number;
  name: string;
  /** Leagues at which this stage begins. */
  from: number;
  /** What the stage feels like, shown under the name. */
  epithet: string;
  accent: string;
  accentSoft: string;
};

export const TIER_STAGES: Tier[] = [
  {
    index: 0,
    name: "Troy",
    from: 0,
    epithet: "The sails are set",
    // Cold open sea, warming toward a gold dawn at Ithaca.
    accent: "#7fb8c9",
    accentSoft: "#2b6c86",
  },
  {
    index: 1,
    name: "The Cyclops' Shore",
    from: TIERS[0], // 20
    epithet: "Cunning beats strength",
    accent: "#3f9d8a",
    accentSoft: "#1d5c52",
  },
  {
    index: 2,
    name: "Circe's Island",
    from: TIERS[1], // 100
    epithet: "A year can vanish here",
    accent: "#c9a227",
    accentSoft: "#7a5c12",
  },
  {
    index: 3,
    name: "The Sirens' Strait",
    from: TIERS[2], // 1000
    epithet: "You hear the song and sail on",
    accent: "#d97757",
    accentSoft: "#8c2f39",
  },
  {
    index: 4,
    name: "Ithaca",
    from: TIERS[3], // 10000
    epithet: "The long way home",
    accent: "#e8c46a",
    accentSoft: "#a1741f",
  },
];

/** The stage a given number of leagues falls in. */
export const tierForLeagues = (leagues: number): Tier => {
  const safe = Math.max(0, leagues);
  // Walk backwards so the highest stage whose threshold has been passed wins.
  for (let i = TIER_STAGES.length - 1; i >= 0; i--) {
    if (safe >= TIER_STAGES[i].from) return TIER_STAGES[i];
  }
  return TIER_STAGES[0];
};

export const tierForSeconds = (totalSeconds: number): Tier =>
  tierForLeagues(toLeagues(Math.max(0, totalSeconds)));

/** The stage after this one, or null at the end of the road. */
export const nextStage = (tier: Tier): Tier | null =>
  TIER_STAGES[tier.index + 1] ?? null;
