import { describe, expect, it } from "vitest";
import {
  MAX_LOGS_SENT,
  MIN_NOTES,
  buildStats,
  buildTranscript,
  buildUserPrompt,
  canReflect,
  monthBounds,
  notedLogs,
  parseReflection,
  periodLogs,
  trailingMonth,
  type ReflectionInput,
} from "./reflection";
import type { Log } from "./models";

const DAY = 86_400_000;
const NOW = new Date(2026, 6, 27, 20, 0).getTime();

let counter = 0;
const log = (daysBack: number, note: string, durationSec = 3600): Log => {
  const d = new Date(NOW);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - daysBack);
  return { id: `l${counter++}`, timestamp: d.getTime(), durationSec, note };
};

const input = (logs: Log[]): ReflectionInput => ({
  goalName: "Learn Japanese",
  from: NOW - 30 * DAY,
  to: NOW,
  logs,
});

describe("periodLogs", () => {
  it("keeps only what falls inside the window, oldest first", () => {
    const logs = [log(1, "a"), log(60, "old"), log(5, "b")];
    expect(periodLogs(logs, NOW - 30 * DAY, NOW).map((l) => l.note)).toEqual(["b", "a"]);
  });

  it("excludes anything after the window", () => {
    const future: Log = { id: "f", timestamp: NOW + DAY, durationSec: 3600, note: "later" };
    expect(periodLogs([future], NOW - 30 * DAY, NOW)).toEqual([]);
  });
});

describe("notedLogs", () => {
  it("drops sessions with no note", () => {
    expect(notedLogs([log(1, ""), log(2, "  "), log(3, "real")])).toHaveLength(1);
  });
});

describe("canReflect", () => {
  it("refuses when nothing carries a note", () => {
    const r = canReflect(input([log(1, ""), log(2, "")]));
    expect(r.ready).toBe(false);
    if (!r.ready) expect(r.key).toBe("reflection.noNotes");
  });

  it("refuses when there is too little to work with", () => {
    const r = canReflect(input([log(1, "one"), log(2, "two")]));
    expect(r.ready).toBe(false);
    if (!r.ready) {
      expect(r.key).toBe("reflection.tooFew");
      // The count is passed through so the message can pluralise it.
      expect(r.params?.count).toBe(2);
    }
  });

  it("allows once there are enough notes", () => {
    const logs = Array.from({ length: MIN_NOTES }, (_, i) => log(i + 1, `note ${i}`));
    expect(canReflect(input(logs)).ready).toBe(true);
  });

  it("counts only notes inside the period", () => {
    // Plenty of notes, but all of them older than the window.
    const logs = Array.from({ length: 10 }, (_, i) => log(40 + i, `old ${i}`));
    expect(canReflect(input(logs)).ready).toBe(false);
  });
});

describe("buildTranscript", () => {
  it("sends only noted sessions, dated and oldest first", () => {
    const lines = buildTranscript(input([log(2, "kanji"), log(1, ""), log(3, "grammar")])).split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("grammar");
    expect(lines[1]).toContain("kanji");
  });

  it("carries the duration in plain words", () => {
    expect(buildTranscript(input([log(1, "reading", 5400)]))).toContain("1h 30m");
  });

  it("clips a runaway note rather than sending all of it", () => {
    const huge = "x".repeat(5000);
    const out = buildTranscript(input([log(1, huge)]));
    expect(out.length).toBeLessThan(800);
    expect(out.endsWith("…")).toBe(true);
  });

  it("caps how many entries are sent", () => {
    const many = Array.from({ length: MAX_LOGS_SENT + 40 }, (_, i) =>
      log((i % 29) + 1, `note ${i}`)
    );
    expect(buildTranscript(input(many)).split("\n")).toHaveLength(MAX_LOGS_SENT);
  });
});

describe("buildStats", () => {
  it("counts sessions, distinct days and leagues", () => {
    const sameDay = log(1, "a", 1800);
    const alsoSameDay: Log = { ...sameDay, id: "dup", note: "b" };
    const stats = buildStats(input([sameDay, alsoSameDay, log(2, "c", 3600)]));

    expect(stats.sessions).toBe(3);
    expect(stats.daysWalked).toBe(2);
    expect(stats.leagues).toBeCloseTo(2);
    expect(stats.noted).toBe(3);
  });
});

describe("buildUserPrompt", () => {
  it("names the goal, the period and the notes", () => {
    const prompt = buildUserPrompt(input([log(1, "kanji"), log(2, "grammar"), log(3, "listening")]));
    expect(prompt).toContain("Learn Japanese");
    expect(prompt).toContain("kanji");
    expect(prompt).toContain("Sessions: 3");
  });

  it("never includes a session that had no note", () => {
    const prompt = buildUserPrompt(input([log(1, "kept"), log(2, "")]));
    const transcript = prompt.split("Notes, oldest first:")[1];
    expect(transcript).toContain("kept");
    expect(transcript.trim().split("\n")).toHaveLength(1);
  });
});

describe("parseReflection", () => {
  const good = { summary: "You kept at it.", themes: ["kanji", "listening"], suggestion: "Try shorter sessions." };

  it("accepts a well-formed reply", () => {
    expect(parseReflection(good)).toEqual(good);
  });

  it("trims whitespace", () => {
    expect(parseReflection({ ...good, summary: "  spaced  " })?.summary).toBe("spaced");
  });

  it("rejects anything without a summary", () => {
    expect(parseReflection({ themes: ["a"], suggestion: "b" })).toBeNull();
    expect(parseReflection({ ...good, summary: "   " })).toBeNull();
  });

  it("rejects non-objects rather than passing undefined to the UI", () => {
    expect(parseReflection(null)).toBeNull();
    expect(parseReflection("a string")).toBeNull();
    expect(parseReflection(42)).toBeNull();
    expect(parseReflection(undefined)).toBeNull();
  });

  it("survives a malformed themes field", () => {
    expect(parseReflection({ ...good, themes: "not an array" })?.themes).toEqual([]);
    expect(parseReflection({ ...good, themes: [1, null, "ok"] })?.themes).toEqual(["ok"]);
  });

  it("caps the number of themes", () => {
    const many = { ...good, themes: ["a", "b", "c", "d", "e", "f"] };
    expect(parseReflection(many)?.themes).toHaveLength(4);
  });
});

describe("period helpers", () => {
  it("bounds a calendar month", () => {
    const { from, to } = monthBounds(new Date(2026, 1, 14).getTime());
    expect(new Date(from).getDate()).toBe(1);
    expect(new Date(from).getMonth()).toBe(1);
    // February 2026 has 28 days; `to` is the last instant of the 28th.
    expect(new Date(to).getMonth()).toBe(1);
    expect(new Date(to).getDate()).toBe(28);
  });

  it("bounds a trailing 30 days ending now", () => {
    const { from, to } = trailingMonth(NOW);
    expect(to).toBe(NOW);
    expect(to - from).toBe(30 * DAY);
  });
});
