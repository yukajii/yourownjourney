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
  /** Translation keys rather than text: station names are localised. */
  nameKey: string;
  epithetKey: string;
  /** Leagues at which this stage begins. */
  from: number;
  accent: string;
  accentSoft: string;
};

export const TIER_STAGES: Tier[] = [
  {
    index: 0,
    nameKey: "station.troy",
    from: 0,
    epithetKey: "station.troy.epithet",
    // Cold open sea, warming toward a gold dawn at Ithaca.
    accent: "#7fb8c9",
    accentSoft: "#2b6c86",
  },
  {
    index: 1,
    nameKey: "station.cyclops",
    from: TIERS[0], // 20
    epithetKey: "station.cyclops.epithet",
    accent: "#3f9d8a",
    accentSoft: "#1d5c52",
  },
  {
    index: 2,
    nameKey: "station.circe",
    from: TIERS[1], // 100
    epithetKey: "station.circe.epithet",
    accent: "#c9a227",
    accentSoft: "#7a5c12",
  },
  {
    index: 3,
    nameKey: "station.sirens",
    from: TIERS[2], // 1000
    epithetKey: "station.sirens.epithet",
    accent: "#d97757",
    accentSoft: "#8c2f39",
  },
  {
    index: 4,
    nameKey: "station.ithaca",
    from: TIERS[3], // 10000
    epithetKey: "station.ithaca.epithet",
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
