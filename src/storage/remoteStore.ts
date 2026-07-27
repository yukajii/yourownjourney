import {
  collection,
  deleteField,
  doc,
  getDocs,
  increment,
  setDoc,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { db } from "../firebase";
import { SCHEMA_VERSION, type Goal, type Log } from "../models";
import { splitLegacy } from "./localStore";

/* ───────────── document paths ─────────────
 *
 * users/{uid}                              currentGoalId, schemaVersion
 * users/{uid}/goals/{goalId}               name, totalTime, created
 * users/{uid}/goals/{goalId}/logs/{logId}  timestamp, durationSec, note
 *
 * Logs sit in their own collection so appending one is a single small write
 * rather than a rewrite of the entire history, and so two devices logging at
 * once cannot overwrite each other.
 */
export const userRef = (uid: string) => doc(db, "users", uid);
export const goalsRef = (uid: string) => collection(db, "users", uid, "goals");
export const goalRef = (uid: string, goalId: string) => doc(goalsRef(uid), goalId);
export const logsRef = (uid: string, goalId: string) => collection(goalRef(uid, goalId), "logs");
export const logRef = (uid: string, goalId: string, logId: string) =>
  doc(logsRef(uid, goalId), logId);

/** Firestore refuses a batch of more than 500 writes. */
const BATCH_LIMIT = 450;

const commitInChunks = async (
  writes: ((batch: ReturnType<typeof writeBatch>) => void)[]
): Promise<void> => {
  for (let i = 0; i < writes.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    for (const apply of writes.slice(i, i + BATCH_LIMIT)) apply(batch);
    await batch.commit();
  }
};

/**
 * A log's document id during a migration or upload.
 *
 * Derived from the entry rather than random so that a run interrupted halfway
 * — a closed tab, a dropped connection — can simply be repeated. Re-writing a
 * document that already exists is a no-op; a fresh uuid each time would
 * duplicate every log that had already made it across.
 */
export const stableLogId = (log: Log, index: number) => `${log.timestamp}-${index}`;

const writeGoalWithLogs = (
  uid: string,
  goal: Goal,
  logs: Log[]
): ((batch: ReturnType<typeof writeBatch>) => void)[] => [
  (batch) =>
    batch.set(goalRef(uid, goal.id), {
      name: goal.name,
      totalTime: goal.totalTime,
      created: goal.created,
    }),
  ...logs.map((log, i) => (batch: ReturnType<typeof writeBatch>) => {
    const id = log.id || stableLogId(log, i);
    batch.set(logRef(uid, goal.id, id), {
      timestamp: log.timestamp,
      durationSec: log.durationSec,
      note: log.note,
    });
  }),
];

/** Writes a whole local snapshot into the subcollections. Safe to repeat. */
export const uploadSnapshot = async (
  uid: string,
  goals: Goal[],
  logsByGoal: Record<string, Log[]>,
  currentGoalId: string | null
): Promise<void> => {
  const writes = goals.flatMap((g) => writeGoalWithLogs(uid, g, logsByGoal[g.id] ?? []));
  await commitInChunks(writes);
  await setDoc(userRef(uid), { currentGoalId, schemaVersion: SCHEMA_VERSION }, { merge: true });
};

/**
 * Moves a pre-subcollection user document into the new layout.
 *
 * Returns true when it did something, so the caller knows to expect the goals
 * subscription to start delivering data. The legacy `goals` array is removed
 * only after every goal and log has been committed, so an interruption leaves
 * the old data in place to try again from.
 */
export const migrateLegacyDoc = async (
  uid: string,
  data: DocumentData | undefined
): Promise<boolean> => {
  const legacy = data?.goals;
  if (!Array.isArray(legacy) || legacy.length === 0) return false;

  const { goals, logsByGoal } = splitLegacy(legacy);
  const withStableIds: Record<string, Log[]> = {};
  for (const [goalId, logs] of Object.entries(logsByGoal)) {
    withStableIds[goalId] = logs.map((log, i) => ({ ...log, id: stableLogId(log, i) }));
  }

  const currentGoalId = goals.some((g) => g.id === data?.currentGoalId)
    ? (data!.currentGoalId as string)
    : goals[0]?.id ?? null;

  await commitInChunks(
    goals.flatMap((g) => writeGoalWithLogs(uid, g, withStableIds[g.id] ?? []))
  );

  await setDoc(
    userRef(uid),
    { currentGoalId, schemaVersion: SCHEMA_VERSION, goals: deleteField() },
    { merge: true }
  );

  return true;
};

/* ───────────── log writes ───────────── */

/** Appends a log and moves the goal's running total by the same amount. */
export const addRemoteLog = async (uid: string, goalId: string, log: Log): Promise<void> => {
  const batch = writeBatch(db);
  batch.set(logRef(uid, goalId, log.id), {
    timestamp: log.timestamp,
    durationSec: log.durationSec,
    note: log.note,
  });
  batch.set(goalRef(uid, goalId), { totalTime: increment(log.durationSec) }, { merge: true });
  await batch.commit();
};

/** Rewrites a log, adjusting the goal's total by the difference. */
export const updateRemoteLog = async (
  uid: string,
  goalId: string,
  log: Log,
  previousDurationSec: number
): Promise<void> => {
  const batch = writeBatch(db);
  batch.set(logRef(uid, goalId, log.id), {
    timestamp: log.timestamp,
    durationSec: log.durationSec,
    note: log.note,
  });
  const delta = log.durationSec - previousDurationSec;
  if (delta !== 0) {
    batch.set(goalRef(uid, goalId), { totalTime: increment(delta) }, { merge: true });
  }
  await batch.commit();
};

export const deleteRemoteLog = async (
  uid: string,
  goalId: string,
  log: Log
): Promise<void> => {
  const batch = writeBatch(db);
  batch.delete(logRef(uid, goalId, log.id));
  batch.set(goalRef(uid, goalId), { totalTime: increment(-log.durationSec) }, { merge: true });
  await batch.commit();
};

/* ───────────── deletion ───────────── */

/** Firestore does not cascade, so a goal's logs have to be cleared by hand. */
export const deleteRemoteGoal = async (uid: string, goalId: string): Promise<void> => {
  const logs = await getDocs(logsRef(uid, goalId));
  await commitInChunks([
    ...logs.docs.map((d) => (batch: ReturnType<typeof writeBatch>) => batch.delete(d.ref)),
    (batch) => batch.delete(goalRef(uid, goalId)),
  ]);
};

export const deleteEverything = async (uid: string): Promise<void> => {
  const goals = await getDocs(goalsRef(uid));
  for (const g of goals.docs) await deleteRemoteGoal(uid, g.id);
  await setDoc(
    userRef(uid),
    { currentGoalId: null, schemaVersion: SCHEMA_VERSION, goals: deleteField() },
    { merge: true }
  );
};
