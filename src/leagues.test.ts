import { describe, expect, it } from "vitest";
import { tierProgress, toLeagues } from "./leagues";

const hours = (h: number) => h * 3600;

describe("toLeagues", () => {
  it("treats one focused hour as one league", () => {
    expect(toLeagues(3600)).toBe(1);
    expect(toLeagues(1800)).toBe(0.5);
  });
});

describe("tierProgress", () => {
  it("starts empty, walking toward the first tier", () => {
    expect(tierProgress(0)).toMatchObject({ leagues: 0, prevTier: 0, nextTier: 20, pct: 0 });
  });

  it("measures progress within the opening tier", () => {
    expect(tierProgress(hours(10))).toMatchObject({ prevTier: 0, nextTier: 20, pct: 50 });
  });

  it("resets to the foot of the next tier on reaching one", () => {
    expect(tierProgress(hours(20))).toMatchObject({ prevTier: 20, nextTier: 100, pct: 0 });
  });

  it("measures progress between two tiers", () => {
    // 60 leagues sits 40 of the way through the 80-league span from 20 to 100.
    expect(tierProgress(hours(60))).toMatchObject({ prevTier: 20, nextTier: 100, pct: 50 });
  });

  it("stays full past the final tier instead of wrapping", () => {
    expect(tierProgress(hours(10_000))).toMatchObject({ nextTier: 10_000, pct: 100 });
    expect(tierProgress(hours(25_000))).toMatchObject({ nextTier: 10_000, pct: 100 });
  });

  it("never reports outside 0–100", () => {
    for (const h of [0, 1, 19.99, 20, 99, 100, 999, 1000, 9999, 10_000, 50_000]) {
      const { pct } = tierProgress(hours(h));
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
    }
  });

  it("treats a negative total as zero rather than producing a negative bar", () => {
    expect(tierProgress(-3600)).toMatchObject({ leagues: 0, pct: 0 });
  });
});
