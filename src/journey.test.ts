import { describe, expect, it } from "vitest";
import {
  currentStreak,
  dayKey,
  heatmapWeeks,
  nextWaypoint,
  pacePerWeek,
  prevWaypoint,
  projectArrival,
  secondsByDay,
  waypointProgress,
} from "./journey";
import type { Log } from "./models";

const DAY = 86_400_000;
const hours = (h: number) => h * 3600;

let counter = 0;
const log = (timestamp: number, durationSec = 3600): Log => ({
  id: `l${counter++}`,
  timestamp,
  durationSec,
  note: "",
});

/** Local noon on a day `offset` days from `from`, avoiding DST edges. */
const daysAgo = (offset: number, from: number) => {
  const d = new Date(from);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - offset);
  return d.getTime();
};

/**
 * A fixed evening "now". It has to be later in the day than the noon that
 * `daysAgo` produces, or today's own entry counts as being in the future.
 */
const NOW = new Date(2026, 6, 27, 20, 0).getTime();

describe("waypoints", () => {
  it("puts the first marks close together", () => {
    expect(nextWaypoint(0)).toBe(5);
    expect(nextWaypoint(3)).toBe(5);
    expect(nextWaypoint(5)).toBe(10);
  });

  it("never overshoots a tier", () => {
    // Step of 5 would land on 20 exactly; step of 20 would jump past 100.
    expect(nextWaypoint(18)).toBe(20);
    expect(nextWaypoint(95)).toBe(100);
    expect(nextWaypoint(950)).toBe(1000);
    expect(nextWaypoint(9500)).toBe(10_000);
  });

  it("widens the spacing as the journey grows", () => {
    expect(nextWaypoint(20)).toBe(40);
    expect(nextWaypoint(100)).toBe(200);
    expect(nextWaypoint(1000)).toBe(2000);
  });

  it("keeps going past the final tier rather than stopping", () => {
    expect(nextWaypoint(10_000)).toBe(11_000);
    expect(nextWaypoint(12_500)).toBe(13_000);
  });

  it("fills from the mark just passed", () => {
    expect(prevWaypoint(0)).toBe(0);
    expect(prevWaypoint(18)).toBe(15);
    expect(prevWaypoint(25)).toBe(20);
    expect(prevWaypoint(105)).toBe(100);
  });

  it("treats a tier as the mark just passed", () => {
    // 100 is a tier, so the bar restarts there rather than from 20.
    expect(prevWaypoint(100)).toBe(100);
    expect(prevWaypoint(20)).toBe(20);
  });
});

describe("waypointProgress", () => {
  it("starts empty", () => {
    expect(waypointProgress(0)).toMatchObject({ from: 0, to: 5, pct: 0, remaining: 5 });
  });

  it("moves visibly deep into the long tier", () => {
    // The very case the plain tier bar could not show: 105 leagues is 5% of
    // the way to 200, not 0.5% of the way to 1000.
    const p = waypointProgress(hours(105));
    expect(p).toMatchObject({ from: 100, to: 200, toIsTier: false });
    expect(p.pct).toBeCloseTo(5);
  });

  it("marks a tier as the destination when one is next", () => {
    expect(waypointProgress(hours(95)).toIsTier).toBe(true);
    expect(waypointProgress(hours(18)).toIsTier).toBe(true);
  });

  it("lands exactly on a tier rather than sailing past it", () => {
    expect(waypointProgress(hours(20))).toMatchObject({ from: 20, to: 40, pct: 0 });
  });

  it("stays within 0-100 across the whole range", () => {
    for (const h of [0, 1, 5, 19.9, 20, 60, 99.9, 100, 500, 999, 1000, 5000, 10_000, 40_000]) {
      const { pct } = waypointProgress(hours(h));
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
    }
  });
});

describe("pacePerWeek", () => {
  const now = NOW;

  it("is zero with nothing logged", () => {
    expect(pacePerWeek([], now)).toBe(0);
  });

  it("averages the trailing window", () => {
    // Four hours spread over a 28-day window is one league per week.
    const logs = [0, 7, 14, 21].map((d) => log(daysAgo(d, now)));
    expect(pacePerWeek(logs, now, 28)).toBeCloseTo(1);
  });

  it("ignores anything older than the window", () => {
    const logs = [log(daysAgo(60, now), hours(100)), log(daysAgo(1, now), hours(4))];
    expect(pacePerWeek(logs, now, 28)).toBeCloseTo(1);
  });

  it("ignores entries in the future", () => {
    expect(pacePerWeek([log(now + 10 * DAY, hours(100))], now, 28)).toBe(0);
  });
});

describe("projectArrival", () => {
  const now = NOW;

  it("returns null at a standstill", () => {
    expect(projectArrival(10, 0, now)).toBeNull();
    expect(projectArrival(10, -1, now)).toBeNull();
  });

  it("returns null when there is nothing left to walk", () => {
    expect(projectArrival(0, 5, now)).toBeNull();
  });

  it("projects the obvious case", () => {
    // Ten leagues remaining at two a week is five weeks out.
    expect(projectArrival(10, 2, now)).toBeCloseTo(now + 35 * DAY, -5);
  });

  it("declines to guess more than a decade out", () => {
    expect(projectArrival(10_000, 0.01, now)).toBeNull();
  });
});

describe("dayKey and secondsByDay", () => {
  it("buckets on the local calendar day, not UTC", () => {
    // 23:30 local stays on its own day whatever the offset.
    const late = new Date(2026, 0, 15, 23, 30).getTime();
    expect(dayKey(late)).toBe("2026-01-15");

    const early = new Date(2026, 0, 15, 0, 30).getTime();
    expect(dayKey(early)).toBe("2026-01-15");
  });

  it("sums several sessions on one day", () => {
    const d = new Date(2026, 0, 15, 9).getTime();
    const totals = secondsByDay([log(d, 1800), log(d + 3600_000, 900)]);
    expect(totals["2026-01-15"]).toBe(2700);
  });
});

describe("currentStreak", () => {
  const now = NOW;

  it("is zero with no logs", () => {
    expect(currentStreak([], now)).toBe(0);
  });

  it("counts back through consecutive days", () => {
    const logs = [0, 1, 2, 3].map((d) => log(daysAgo(d, now)));
    expect(currentStreak(logs, now)).toBe(4);
  });

  it("survives a day not yet walked", () => {
    // Nothing today, but yesterday and the day before: the streak stands.
    const logs = [1, 2, 3].map((d) => log(daysAgo(d, now)));
    expect(currentStreak(logs, now)).toBe(3);
  });

  it("breaks once a whole day has been missed", () => {
    const logs = [2, 3, 4].map((d) => log(daysAgo(d, now)));
    expect(currentStreak(logs, now)).toBe(0);
  });

  it("counts several sessions in a day once", () => {
    const logs = [log(daysAgo(0, now)), log(daysAgo(0, now) + 3600_000)];
    expect(currentStreak(logs, now)).toBe(1);
  });
});

describe("heatmapWeeks", () => {
  const now = new Date(2026, 6, 27, 15, 0).getTime(); // a Monday

  it("returns the requested number of week columns of seven days", () => {
    const grid = heatmapWeeks([], now, 26);
    expect(grid).toHaveLength(26);
    for (const week of grid) expect(week).toHaveLength(7);
  });

  it("starts every column on a Monday", () => {
    for (const week of heatmapWeeks([], now, 4)) {
      expect(new Date(week[0].ms).getDay()).toBe(1);
    }
  });

  it("ends with the week containing today", () => {
    const grid = heatmapWeeks([], now, 4);
    const lastWeek = grid[grid.length - 1];
    expect(lastWeek.some((c) => c.key === dayKey(now))).toBe(true);
  });

  it("places a log on its own day", () => {
    const when = daysAgo(3, now);
    const cell = heatmapWeeks([log(when, 5400)], now, 4)
      .flat()
      .find((c) => c.key === dayKey(when));
    expect(cell?.seconds).toBe(5400);
    expect(cell?.level).toBe(3);
  });

  it("grades intensity by time walked", () => {
    const levels = [0, 900, 1800, 3600, 7200].map(
      (s) => heatmapWeeks([log(daysAgo(1, now), s)], now, 2)
        .flat()
        .find((c) => c.key === dayKey(daysAgo(1, now)))!.level
    );
    expect(levels).toEqual([0, 1, 2, 3, 4]);
  });

  it("marks days after today so they can be dimmed", () => {
    const grid = heatmapWeeks([], now, 2).flat();
    expect(grid.filter((c) => c.inFuture).every((c) => c.ms > now - DAY)).toBe(true);
    expect(grid.find((c) => c.key === dayKey(now))?.inFuture).toBe(false);
  });
});
