import { describe, expect, it } from "vitest";
import { TIER_STAGES, nextStage, tierForLeagues, tierForSeconds } from "./tiers";
import { TIERS } from "./models";

const hours = (h: number) => h * 3600;

describe("TIER_STAGES", () => {
  it("has one more stage than there are tier thresholds", () => {
    // The opening stage precedes the first threshold.
    expect(TIER_STAGES).toHaveLength(TIERS.length + 1);
  });

  it("begins at zero and rises with the thresholds", () => {
    expect(TIER_STAGES[0].from).toBe(0);
    expect(TIER_STAGES.slice(1).map((s) => s.from)).toEqual(TIERS);
  });

  it("indexes stages in order", () => {
    TIER_STAGES.forEach((s, i) => expect(s.index).toBe(i));
  });

  it("gives every stage a distinct name and accent", () => {
    expect(new Set(TIER_STAGES.map((s) => s.name)).size).toBe(TIER_STAGES.length);
    expect(new Set(TIER_STAGES.map((s) => s.accent)).size).toBe(TIER_STAGES.length);
  });

  it("uses colours a stylesheet can take verbatim", () => {
    for (const s of TIER_STAGES) {
      expect(s.accent).toMatch(/^#[0-9a-f]{6}$/i);
      expect(s.accentSoft).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe("tierForLeagues", () => {
  it("starts at Troy", () => {
    expect(tierForLeagues(0).name).toBe("Troy");
    expect(tierForLeagues(19.99).name).toBe("Troy");
  });

  it("changes station exactly on the threshold, not after it", () => {
    expect(tierForLeagues(20).name).toBe("The Cyclops' Shore");
    expect(tierForLeagues(100).name).toBe("Circe's Island");
    expect(tierForLeagues(1000).name).toBe("The Sirens' Strait");
    expect(tierForLeagues(10_000).name).toBe("Ithaca");
  });

  it("stays at Ithaca however far past it you sail", () => {
    expect(tierForLeagues(50_000).name).toBe("Ithaca");
  });

  it("treats a negative total as the beginning rather than throwing", () => {
    expect(tierForLeagues(-5).name).toBe("Troy");
  });
});

describe("tierForSeconds", () => {
  it("converts before deciding", () => {
    expect(tierForSeconds(hours(19)).name).toBe("Troy");
    expect(tierForSeconds(hours(20)).name).toBe("The Cyclops' Shore");
  });
});

describe("nextStage", () => {
  it("points at the station ahead", () => {
    expect(nextStage(TIER_STAGES[0])?.name).toBe("The Cyclops' Shore");
  });

  it("is null at the end of the road", () => {
    expect(nextStage(TIER_STAGES[TIER_STAGES.length - 1])).toBeNull();
  });
});
