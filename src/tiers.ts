import { toLeagues } from "./leagues";
import { TIERS } from "./models";

/**
 * The journey's five stages.
 *
 * The tiers were only ever numbers on a progress bar, which is a thin reward
 * for years of work. Each stage now carries a name and its own colour, so the
 * app visibly changes character as the journey climbs — the palette walks from
 * first light through to a night sky, and reaching 100 leagues is something you
 * can see rather than something you have to read.
 *
 * `from` is inclusive: a stage begins the moment its league count is reached.
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
    name: "Wanderer",
    from: 0,
    epithet: "The road is new",
    accent: "#7dd3fc",
    accentSoft: "#0284c7",
  },
  {
    index: 1,
    name: "Traveller",
    from: TIERS[0], // 20
    epithet: "The habit holds",
    accent: "#41d1ff",
    accentSoft: "#1368d6",
  },
  {
    index: 2,
    name: "Wayfarer",
    from: TIERS[1], // 100
    epithet: "Distance behind you",
    accent: "#fbbf24",
    accentSoft: "#b45309",
  },
  {
    index: 3,
    name: "Pathfinder",
    from: TIERS[2], // 1000
    epithet: "Few walk this far",
    accent: "#fb7185",
    accentSoft: "#9f1239",
  },
  {
    index: 4,
    name: "Master of the Road",
    from: TIERS[3], // 10000
    epithet: "The road is yours",
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
