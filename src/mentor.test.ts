import { describe, expect, it } from "vitest";
import { buildSignals, mentorLines, situationKey, type MentorSignals } from "./mentor";
import type { Goal, Log } from "./models";

const NOW = new Date(2026, 6, 27, 20, 0).getTime(); // Monday evening

const goal = (totalTime = 0): Goal => ({
  id: "g1",
  name: "Learn Japanese",
  totalTime,
  created: NOW - 100 * 86_400_000,
});

let counter = 0;
const log = (daysBack: number, durationSec = 3600): Log => {
  const d = new Date(NOW);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - daysBack);
  return { id: `l${counter++}`, timestamp: d.getTime(), durationSec, note: "" };
};

const idle = { isActive: false, seconds: 0 };
const ids = (s: MentorSignals) => mentorLines(s).map((l) => l.id);

describe("buildSignals", () => {
  it("reports nothing walked for a brand new goal", () => {
    const s = buildSignals(goal(), [], idle, NOW);
    expect(s).toMatchObject({ hasGoal: true, daysSinceLast: null, streakDays: 0, walkedToday: false });
  });

  it("counts days since the last entry in calendar days", () => {
    // Logged at noon three days ago; the wall clock gap is under 80 hours but
    // it is unambiguously three days back.
    expect(buildSignals(goal(), [log(3)], idle, NOW).daysSinceLast).toBe(3);
  });

  it("treats an entry from earlier today as zero days", () => {
    const s = buildSignals(goal(), [log(0)], idle, NOW);
    expect(s.daysSinceLast).toBe(0);
    expect(s.walkedToday).toBe(true);
  });

  it("counts last night as one day, not zero", () => {
    // 21:00 yesterday is 23 hours before 20:00 today — under a full day of
    // elapsed time, but the previous calendar day.
    const d = new Date(NOW);
    d.setHours(21, 0, 0, 0);
    d.setDate(d.getDate() - 1);
    const s = buildSignals(goal(), [{ id: "x", timestamp: d.getTime(), durationSec: 3600, note: "" }], idle, NOW);
    expect(s.daysSinceLast).toBe(1);
    expect(s.walkedToday).toBe(false);
  });

  it("counts a running session toward the leagues walked", () => {
    const s = buildSignals(goal(3600), [], { isActive: true, seconds: 1800 }, NOW);
    expect(s.leagues).toBeCloseTo(1.5);
  });
});

describe("mentorLines", () => {
  it("asks for a goal before anything else", () => {
    const s = buildSignals(null, [], idle, NOW);
    expect(ids(s)).toEqual(["no-goal"]);
  });

  it("invites a first hour when nothing has been walked", () => {
    expect(ids(buildSignals(goal(), [], idle, NOW))).toContain("never-walked");
  });

  it("speaks to the walk while a session runs", () => {
    const s = buildSignals(goal(3600), [log(1)], { isActive: true, seconds: 300 }, NOW);
    expect(ids(s)).toContain("walking");
  });

  it("suggests rest after ninety unbroken minutes, above all else", () => {
    const s = buildSignals(goal(0), [log(1)], { isActive: true, seconds: 95 * 60 }, NOW);
    expect(mentorLines(s)[0].id).toBe("long-session");
  });

  it("acknowledges a streak it can actually see", () => {
    const logs = [0, 1, 2, 3, 4].map((d) => log(d));
    expect(ids(buildSignals(goal(5 * 3600), logs, idle, NOW))).toContain("streak");
  });

  it("marks a long streak differently from a short one", () => {
    const logs = Array.from({ length: 9 }, (_, d) => log(d));
    const got = ids(buildSignals(goal(9 * 3600), logs, idle, NOW));
    expect(got).toContain("long-streak");
    expect(got).not.toContain("streak");
  });

  it("names the actual gap when returning after one", () => {
    const s = buildSignals(goal(10 * 3600), [log(20)], idle, NOW);
    const line = mentorLines(s).find((l) => l.id === "long-absence");
    expect(line?.text).toContain("20 days");
  });

  it("reaches for a station when one is close", () => {
    // 19.5 leagues: half a league short of the 20 threshold.
    const s = buildSignals(goal(19.5 * 3600), [log(1)], idle, NOW);
    const line = mentorLines(s).find((l) => l.id === "near-mark");
    expect(line?.text).toContain("landfall");
    expect(line?.priority).toBeGreaterThan(60);
  });

  it("always leaves something to say", () => {
    const s = buildSignals(goal(50 * 3600), [log(1)], idle, NOW);
    expect(mentorLines(s).length).toBeGreaterThan(1);
  });

  it("orders the most pressing line first", () => {
    const s = buildSignals(goal(50 * 3600), [log(30)], idle, NOW);
    const lines = mentorLines(s);
    for (let i = 1; i < lines.length; i++) {
      expect(lines[i - 1].priority).toBeGreaterThanOrEqual(lines[i].priority);
    }
  });
});

/**
 * The point of the rewrite: the old set told a user on a twelve-day streak
 * that they had missed a session. No line may contradict the state.
 */
describe("mentorLines never says anything untrue", () => {
  const scenarios: { name: string; signals: MentorSignals }[] = [
    { name: "fresh goal", signals: buildSignals(goal(), [], idle, NOW) },
    { name: "walked today", signals: buildSignals(goal(3600), [log(0)], idle, NOW) },
    { name: "streak of 5", signals: buildSignals(goal(5 * 3600), [0, 1, 2, 3, 4].map((d) => log(d)), idle, NOW) },
    { name: "away 3 days", signals: buildSignals(goal(9 * 3600), [log(3), log(4)], idle, NOW) },
    { name: "away 40 days", signals: buildSignals(goal(9 * 3600), [log(40)], idle, NOW) },
    { name: "mid-session", signals: buildSignals(goal(3600), [log(1)], { isActive: true, seconds: 600 }, NOW) },
    { name: "near a tier", signals: buildSignals(goal(19.8 * 3600), [log(0)], idle, NOW) },
    { name: "no goal", signals: buildSignals(null, [], idle, NOW) },
  ];

  for (const { name, signals } of scenarios) {
    it(`holds for: ${name}`, () => {
      const got = ids(signals);

      // Absence and having walked today are mutually exclusive.
      if (signals.walkedToday) {
        expect(got).not.toContain("short-absence");
        expect(got).not.toContain("week-absence");
        expect(got).not.toContain("long-absence");
      }

      // A streak cannot be claimed when there is none.
      if (signals.streakDays < 3) {
        expect(got).not.toContain("streak");
        expect(got).not.toContain("long-streak");
      }
      if (signals.streakDays === 0) expect(got).not.toContain("keep-streak");

      // "Today is already walked" must only appear when it is.
      if (!signals.walkedToday) expect(got).not.toContain("walked-today");

      // Nothing walked ever means no pace claim and no streak claim.
      if (signals.daysSinceLast === null) {
        expect(got).not.toContain("pace");
        expect(got).not.toContain("streak");
      }

      // A pace claim requires actual movement.
      if (signals.leaguesPerWeek <= 0) expect(got).not.toContain("pace");

      expect(got.length).toBeGreaterThan(0);
    });
  }

  it("never offers both 'walked today' and a gap in the same breath", () => {
    for (const { signals } of scenarios) {
      const got = ids(signals);
      const gap = got.some((id) => id.endsWith("-absence"));
      expect(gap && got.includes("walked-today")).toBe(false);
    }
  });
});

describe("situationKey", () => {
  it("changes when the situation does", () => {
    const a = mentorLines(buildSignals(goal(3600), [log(0)], idle, NOW));
    const b = mentorLines(buildSignals(goal(3600), [log(0)], { isActive: true, seconds: 60 }, NOW));
    expect(situationKey(a)).not.toBe(situationKey(b));
  });

  it("is stable when nothing has changed", () => {
    const s = buildSignals(goal(3600), [log(0)], idle, NOW);
    expect(situationKey(mentorLines(s))).toBe(situationKey(mentorLines(s)));
  });
});
