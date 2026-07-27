import { TIERS } from "./models";

/** Seconds walked → leagues. One league is one focused hour. */
export const toLeagues = (seconds: number) => seconds / 3600;

export type TierProgress = {
  /** Leagues walked, including any session still running. */
  leagues: number;
  /** The tier already reached; 0 before the first one. */
  prevTier: number;
  /** The tier being walked toward. Equals `prevTier` once the last is passed. */
  nextTier: number;
  /** Progress from `prevTier` to `nextTier`, 0–100. */
  pct: number;
};

/**
 * Where a goal sits between tiers. Past the final tier the bar simply stays
 * full rather than resetting or overflowing.
 */
export const tierProgress = (totalSeconds: number): TierProgress => {
  const leagues = toLeagues(Math.max(0, totalSeconds));
  const nextTier = TIERS.find((t) => t > leagues) ?? TIERS[TIERS.length - 1];
  const prevTier = [...TIERS].reverse().find((t) => t <= leagues) ?? 0;

  const pct =
    nextTier <= prevTier ? 100 : ((leagues - prevTier) / (nextTier - prevTier)) * 100;

  return { leagues, prevTier, nextTier, pct: Math.min(100, Math.max(0, pct)) };
};
