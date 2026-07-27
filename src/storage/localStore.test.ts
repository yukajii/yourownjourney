import { beforeEach, describe, expect, it } from "vitest";
import { KEYS, type KeyValueStore, readAll, splitLegacy, sumSeconds, writeAll } from "./localStore";
import { SCHEMA_VERSION } from "../models";

class FakeStore implements KeyValueStore {
  map = new Map<string, string>();
  getItem(k: string) {
    return this.map.has(k) ? this.map.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
}

let store: FakeStore;
beforeEach(() => {
  store = new FakeStore();
});

/** A goal in the pre-subcollection shape, logs nested inside. */
const legacyGoal = {
  id: "g1",
  name: "Learn Japanese",
  totalTime: 5400,
  created: 1_700_000_000_000,
  logs: [
    { timestamp: 1_700_000_100_000, durationSec: 3600, note: "kanji" },
    { timestamp: 1_700_000_200_000, durationSec: 1800, note: "" },
  ],
};

describe("splitLegacy", () => {
  it("lifts nested logs out and gives each one an id", () => {
    const { goals, logsByGoal } = splitLegacy([legacyGoal]);

    expect(goals).toEqual([
      { id: "g1", name: "Learn Japanese", totalTime: 5400, created: 1_700_000_000_000 },
    ]);
    expect(logsByGoal.g1).toHaveLength(2);
    for (const log of logsByGoal.g1) expect(log.id).toBeTruthy();
    expect(new Set(logsByGoal.g1.map((l) => l.id)).size).toBe(2);
  });

  it("keeps every log's content intact", () => {
    const { logsByGoal } = splitLegacy([legacyGoal]);
    expect(
      logsByGoal.g1.map((l) => ({
        timestamp: l.timestamp,
        durationSec: l.durationSec,
        note: l.note,
      }))
    ).toEqual(legacyGoal.logs);
  });

  it("makes the logs authoritative for totalTime", () => {
    // A total that disagrees with the logs is corrected, so later edits can
    // adjust it without the two drifting further apart.
    const { goals } = splitLegacy([{ ...legacyGoal, totalTime: 999_999 }]);
    expect(goals[0].totalTime).toBe(5400);
  });

  it("keeps a stored total when there are no logs to recompute from", () => {
    const { goals } = splitLegacy([{ ...legacyGoal, logs: [] }]);
    expect(goals[0].totalTime).toBe(5400);
  });

  it("orders logs oldest first regardless of stored order", () => {
    const shuffled = {
      ...legacyGoal,
      logs: [...legacyGoal.logs].reverse(),
    };
    const { logsByGoal } = splitLegacy([shuffled]);
    expect(logsByGoal.g1.map((l) => l.timestamp)).toEqual([
      1_700_000_100_000, 1_700_000_200_000,
    ]);
  });

  it("survives junk without throwing", () => {
    const { goals } = splitLegacy([null, undefined, 42, "nope", legacyGoal]);
    expect(goals).toHaveLength(1);
    expect(goals[0].id).toBe("g1");
  });

  it("gives duplicate goal ids distinct identities rather than losing one", () => {
    const { goals } = splitLegacy([legacyGoal, { ...legacyGoal, name: "Other" }]);
    expect(goals).toHaveLength(2);
    expect(goals[0].id).not.toBe(goals[1].id);
  });

  it("coerces unusable log fields instead of dropping the entry", () => {
    const { logsByGoal } = splitLegacy([
      { ...legacyGoal, logs: [{ timestamp: "x", durationSec: -5, note: null }] },
    ]);
    expect(logsByGoal.g1[0]).toMatchObject({ timestamp: 0, durationSec: 0, note: "" });
  });
});

describe("readAll", () => {
  it("upgrades a legacy device and rewrites it in the new shape", () => {
    store.setItem(KEYS.goals, JSON.stringify([legacyGoal]));
    store.setItem(KEYS.current, "g1");

    const snap = readAll(store);
    expect(snap.goals[0].name).toBe("Learn Japanese");
    expect(snap.logsByGoal.g1).toHaveLength(2);
    expect(snap.currentGoalId).toBe("g1");

    // Persisted, so the split is not redone on every read.
    expect(store.getItem(KEYS.schema)).toBe(String(SCHEMA_VERSION));
    const rewritten = JSON.parse(store.getItem(KEYS.goals)!);
    expect(rewritten[0]).not.toHaveProperty("logs");
    expect(JSON.parse(store.getItem(KEYS.logs)!).g1).toHaveLength(2);
  });

  it("is idempotent — a second read returns the same thing", () => {
    store.setItem(KEYS.goals, JSON.stringify([legacyGoal]));
    const first = readAll(store);
    const second = readAll(store);
    expect(second).toEqual(first);
  });

  it("reads back what writeAll wrote", () => {
    const snap = {
      goals: [{ id: "g1", name: "A", totalTime: 60, created: 1 }],
      logsByGoal: { g1: [{ id: "l1", timestamp: 5, durationSec: 60, note: "n" }] },
      currentGoalId: "g1",
    };
    writeAll(store, snap);
    expect(readAll(store)).toEqual(snap);
  });

  it("drops a current-goal pointer left over from a deleted goal", () => {
    store.setItem(KEYS.goals, JSON.stringify([legacyGoal]));
    store.setItem(KEYS.current, "deleted-goal");
    expect(readAll(store).currentGoalId).toBe("g1");
  });

  it("returns empty for a device that has never stored anything", () => {
    expect(readAll(store)).toEqual({ goals: [], logsByGoal: {}, currentGoalId: null });
  });

  it("returns empty rather than throwing on corrupt JSON", () => {
    store.setItem(KEYS.goals, "{not json");
    expect(readAll(store).goals).toEqual([]);
  });
});

describe("sumSeconds", () => {
  it("totals durations", () => {
    expect(sumSeconds([])).toBe(0);
    expect(
      sumSeconds([
        { id: "a", timestamp: 0, durationSec: 60, note: "" },
        { id: "b", timestamp: 1, durationSec: 90, note: "" },
      ])
    ).toBe(150);
  });
});
