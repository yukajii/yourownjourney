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
    accent: "#7dd3fc",
    accentSoft: "#0284c7",
  },
  {
    index: 1,
    name: "The Cyclops' Shore",
    from: TIERS[0], // 20
    epithet: "Cunning beats strength",
    accent: "#41d1ff",
    accentSoft: "#1368d6",
  },
  {
    index: 2,
    name: "Circe's Island",
    from: TIERS[1], // 100
    epithet: "A year can vanish here",
    accent: "#fbbf24",
    accentSoft: "#b45309",
  },
  {
    index: 3,
    name: "The Sirens' Strait",
    from: TIERS[2], // 1000
    epithet: "You hear the song and sail on",
    accent: "#fb7185",
    accentSoft: "#9f1239",
  },
  {
    index: 4,
    name: "Ithaca",
    from: TIERS[3], // 10000
    epithet: "The long way home",
    accent: "#c4b5fd",
    accentSoft: "#6d28d9",
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
