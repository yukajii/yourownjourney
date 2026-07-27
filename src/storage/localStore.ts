import { type Goal, type LegacyGoal, type Log, SCHEMA_VERSION, newId } from "../models";

/** The slice of the Storage API used here — narrowed so tests can fake it. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const KEYS = {
  goals: "leagues_goals",
  logs: "leagues_logs",
  current: "leagues_currentGoalId",
  schema: "leagues_schema",
  activeSession: "leagues_activeSession",
} as const;

export type LocalSnapshot = {
  goals: Goal[];
  /** Logs per goal id, newest last. */
  logsByGoal: Record<string, Log[]>;
  currentGoalId: string | null;
};

export const EMPTY: LocalSnapshot = { goals: [], logsByGoal: {}, currentGoalId: null };

const num = (v: unknown, fallback = 0) =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);

export const sanitizeLog = (raw: Partial<Log> | undefined, seen: Set<string>): Log => {
  // Duplicate or missing ids would make edit and delete act on the wrong row.
  let id = str(raw?.id);
  if (!id || seen.has(id)) id = newId();
  seen.add(id);

  return {
    id,
    timestamp: num(raw?.timestamp, 0),
    durationSec: Math.max(0, Math.round(num(raw?.durationSec, 0))),
    note: str(raw?.note),
  };
};

export const sumSeconds = (logs: Log[]) => logs.reduce((t, l) => t + l.durationSec, 0);

export const sortLogs = (logs: Log[]) => [...logs].sort((a, b) => a.timestamp - b.timestamp);

/** Coerces a stored goal, dropping anything unusable. Ids are made unique. */
const sanitizeGoals = (raw: unknown[]): LegacyGoal[] => {
  const seen = new Set<string>();
  const out: LegacyGoal[] = [];

  for (const g of raw) {
    if (!g || typeof g !== "object") continue;
    const goal = g as LegacyGoal;

    let id = str(goal.id);
    if (!id || seen.has(id)) id = newId();
    seen.add(id);

    out.push({
      id,
      name: str(goal.name, "Untitled goal"),
      created: num(goal.created, Date.now()),
      totalTime: Math.max(0, num(goal.totalTime)),
      logs: Array.isArray(goal.logs) ? goal.logs : undefined,
    });
  }

  return out;
};

/**
 * Splits the old shape — goals with their logs nested inside — into the two
 * collections used now.
 *
 * Where a goal has logs, its `totalTime` is recomputed from them. The two were
 * always written together so they should already agree, and making the logs
 * authoritative here is what lets a later edit or deletion adjust the total
 * without the two drifting apart.
 */
export const splitLegacy = (
  legacy: unknown[]
): { goals: Goal[]; logsByGoal: Record<string, Log[]> } => {
  const goals: Goal[] = [];
  const logsByGoal: Record<string, Log[]> = {};

  for (const raw of sanitizeGoals(legacy)) {
    const seenLogIds = new Set<string>();
    const logs = sortLogs((raw.logs ?? []).map((l) => sanitizeLog(l, seenLogIds)));

    logsByGoal[raw.id] = logs;
    goals.push({
      id: raw.id,
      name: raw.name,
      created: raw.created,
      totalTime: logs.length > 0 ? sumSeconds(logs) : raw.totalTime,
    });
  }

  return { goals, logsByGoal };
};

const parse = <T,>(store: KeyValueStore, key: string, fallback: T): T => {
  try {
    const raw = store.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
};

/**
 * Reads everything this device knows, upgrading the pre-subcollection layout in
 * place the first time it is seen.
 */
export const readAll = (store: KeyValueStore): LocalSnapshot => {
  const storedGoals = parse<unknown>(store, KEYS.goals, []);
  if (!Array.isArray(storedGoals)) return EMPTY;

  const version = num(parse<unknown>(store, KEYS.schema, 1), 1);
  const nested = storedGoals.some(
    (g) => g && typeof g === "object" && Array.isArray((g as LegacyGoal).logs)
  );

  const needsUpgrade = version < SCHEMA_VERSION || nested;
  const split = splitLegacy(storedGoals);
  const goals = split.goals;
  let logsByGoal = split.logsByGoal;

  if (!needsUpgrade) {
    // Already split: the logs live under their own key, not inside the goals.
    const stored = parse<Record<string, Partial<Log>[]>>(store, KEYS.logs, {});
    logsByGoal = {};
    for (const g of goals) {
      const seen = new Set<string>();
      const raw = Array.isArray(stored?.[g.id]) ? stored[g.id] : [];
      logsByGoal[g.id] = sortLogs(raw.map((l) => sanitizeLog(l, seen)));
    }
  }

  // A pointer left over from a deleted goal would render an empty header forever.
  const storedCurrent = store.getItem(KEYS.current);
  const currentGoalId = goals.some((g) => g.id === storedCurrent)
    ? storedCurrent
    : goals[0]?.id ?? null;

  const snapshot: LocalSnapshot = { goals, logsByGoal, currentGoalId };
  if (needsUpgrade) writeAll(store, snapshot);
  return snapshot;
};

export const writeAll = (store: KeyValueStore, snap: LocalSnapshot): void => {
  store.setItem(KEYS.goals, JSON.stringify(snap.goals));
  store.setItem(KEYS.logs, JSON.stringify(snap.logsByGoal));
  store.setItem(KEYS.schema, String(SCHEMA_VERSION));
  if (snap.currentGoalId) store.setItem(KEYS.current, snap.currentGoalId);
  else store.removeItem(KEYS.current);
};

export const clearAll = (store: KeyValueStore): void => {
  store.removeItem(KEYS.goals);
  store.removeItem(KEYS.logs);
  store.removeItem(KEYS.current);
  store.removeItem(KEYS.activeSession);
  store.setItem(KEYS.schema, String(SCHEMA_VERSION));
};
