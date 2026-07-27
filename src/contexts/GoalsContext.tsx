import { getDoc, getDocs, onSnapshot, orderBy, query, setDoc } from "firebase/firestore";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { newId, SCHEMA_VERSION, type Goal, type Log } from "../models";
import {
  clearAll,
  readAll,
  sortLogs,
  writeAll,
  type LocalSnapshot,
} from "../storage/localStore";
import {
  addRemoteLog,
  deleteEverything,
  deleteRemoteGoal,
  deleteRemoteLog,
  goalRef,
  goalsRef,
  logsRef,
  migrateLegacyDoc,
  updateRemoteLog,
  uploadSnapshot,
  userRef,
} from "../storage/remoteStore";

/* ───────────── Context shape ───────────── */
type GoalsCtx = {
  goals: Goal[];
  currentGoalId: string | null;
  current: Goal | null;
  /** Logs for the current goal, newest first. */
  logs: Log[];
  /** True until the first read (local or remote) has settled. */
  loading: boolean;
  createGoal: (name: string) => void;
  renameGoal: (id: string, name: string) => void;
  deleteGoal: (id: string) => void;
  setCurrentGoal: (id: string) => void;
  /** Logs against `goalId` if given, so a session survives switching goals. */
  pushLog: (durationSec: number, note: string, goalId?: string) => void;
  /** Records time that was never timed — a session the user forgot to start. */
  addLog: (timestamp: number, durationSec: number, note: string, goalId?: string) => void;
  editLog: (log: Log) => void;
  removeLog: (log: Log) => void;
  /** Every log for every goal. Fetched on demand; only export needs it. */
  loadAllLogs: () => Promise<Record<string, Log[]>>;
  resetAll: () => Promise<void>;
};

const GoalsContext = createContext<GoalsCtx | undefined>(undefined);
export const useGoals = () => {
  const ctx = useContext(GoalsContext);
  if (!ctx) throw new Error("useGoals() must be used within <GoalsProvider>");
  return ctx;
};

const newest = (logs: Log[]) => [...logs].sort((a, b) => b.timestamp - a.timestamp);

/* ───────────── Provider ───────────── */
export const GoalsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [goals, setGoals] = useState<Goal[]>([]);
  const [currentGoalId, setCurrentGoalId] = useState<string | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Signed-out, this device holds everything. Signed in it is still written,
   * so signing out does not appear to erase the journey.
   */
  const localRef = useRef<LocalSnapshot>({ goals: [], logsByGoal: {}, currentGoalId: null });

  /** Guards the one-time local→cloud adoption so a reset cannot resurrect data. */
  const reconciledFor = useRef<string | null>(null);

  const persistLocal = useCallback((next: LocalSnapshot) => {
    localRef.current = next;
    writeAll(localStorage, next);
  }, []);

  /* ---------- load ---------- */
  useEffect(() => {
    // Local first and synchronously: the app is usable before the network is,
    // and an installed PWA is frequently opened with no connection at all.
    const local = readAll(localStorage);
    localRef.current = local;

    if (!uid) {
      setGoals(local.goals);
      setCurrentGoalId(local.currentGoalId);
      setLogs(newest(local.logsByGoal[local.currentGoalId ?? ""] ?? []));
      setLoading(false);
      return;
    }

    setGoals(local.goals);
    setCurrentGoalId(local.currentGoalId);
    setLoading(false);

    let cancelled = false;
    const unsubs: (() => void)[] = [];

    void (async () => {
      /* One-time reconciliation before subscribing, so the subscriptions do
         not race the migration and briefly report an empty journey. */
      if (reconciledFor.current !== uid) {
        reconciledFor.current = uid;
        try {
          const snap = await getDoc(userRef(uid));
          const migrated = await migrateLegacyDoc(uid, snap.data());

          if (!migrated) {
            const remote = await getDocs(goalsRef(uid));
            // First sign-in on a device that already has offline history:
            // adopt it rather than replacing it with an empty cloud document.
            if (remote.empty && localRef.current.goals.length > 0) {
              const { goals: g, logsByGoal, currentGoalId: c } = localRef.current;
              await uploadSnapshot(uid, g, logsByGoal, c);
            } else if (!snap.exists()) {
              await setDoc(userRef(uid), { currentGoalId: null, schemaVersion: SCHEMA_VERSION });
            }
          }
        } catch (e) {
          // Offline, or rules rejected us. The local copy still drives the UI.
          console.error("Could not reconcile with the cloud", e);
        }
      }

      if (cancelled) return;

      unsubs.push(
        onSnapshot(
          userRef(uid),
          (snap) => setCurrentGoalId((prev) => (snap.data()?.currentGoalId as string) ?? prev),
          (e) => console.error("Could not follow the current goal", e)
        )
      );

      unsubs.push(
        onSnapshot(
          goalsRef(uid),
          (snap) => {
            const next = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Goal);
            setGoals(next);
            // Mirror to this device so a later offline launch is not empty.
            persistLocal({ ...localRef.current, goals: next });
          },
          (e) => console.error("Goal sync failed, falling back to this device", e)
        )
      );
    })();

    return () => {
      cancelled = true;
      for (const u of unsubs) u();
    };
  }, [uid, persistLocal]);

  /* ---------- logs for the current goal ---------- */
  useEffect(() => {
    if (!currentGoalId) {
      setLogs([]);
      return;
    }

    if (!uid) {
      setLogs(newest(localRef.current.logsByGoal[currentGoalId] ?? []));
      return;
    }

    // Only the open goal's logs are fetched; the rest stay in the cloud until
    // they are actually needed.
    return onSnapshot(
      query(logsRef(uid, currentGoalId), orderBy("timestamp", "desc")),
      (snap) => {
        const next = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Log);
        setLogs(next);
        persistLocal({
          ...localRef.current,
          logsByGoal: { ...localRef.current.logsByGoal, [currentGoalId]: sortLogs(next) },
        });
      },
      (e) => console.error("Log sync failed, falling back to this device", e)
    );
  }, [uid, currentGoalId, persistLocal]);

  /* ---------- goal writes ---------- */
  const writeGoals = (nextGoals: Goal[], nextCurrent: string | null) => {
    setGoals(nextGoals);
    setCurrentGoalId(nextCurrent);
    persistLocal({ ...localRef.current, goals: nextGoals, currentGoalId: nextCurrent });
  };

  const createGoal = (name: string) => {
    const goal: Goal = { id: newId(), name, totalTime: 0, created: Date.now() };
    const nextGoals = [...goals, goal];

    setGoals(nextGoals);
    setCurrentGoalId(goal.id);
    persistLocal({
      goals: nextGoals,
      currentGoalId: goal.id,
      logsByGoal: { ...localRef.current.logsByGoal, [goal.id]: [] },
    });

    if (!uid) return;
    // Not awaited: with the offline cache a write does not settle until the
    // server acknowledges it, so awaiting would stall every edit made on a train.
    void setDoc(goalRef(uid, goal.id), {
      name: goal.name,
      totalTime: 0,
      created: goal.created,
    }).catch((e) => console.error("Could not sync new goal", e));
    void setDoc(userRef(uid), { currentGoalId: goal.id }, { merge: true }).catch(() => {});
  };

  const renameGoal = (id: string, name: string) => {
    writeGoals(goals.map((g) => (g.id === id ? { ...g, name } : g)), currentGoalId);
    if (!uid) return;
    void setDoc(goalRef(uid, id), { name }, { merge: true }).catch((e) =>
      console.error("Could not sync rename", e)
    );
  };

  const deleteGoal = (id: string) => {
    const filtered = goals.filter((g) => g.id !== id);
    if (filtered.length === goals.length) return;

    const nextCurrent = currentGoalId === id ? filtered[0]?.id ?? null : currentGoalId;
    const restLogs = { ...localRef.current.logsByGoal };
    delete restLogs[id];
    setGoals(filtered);
    setCurrentGoalId(nextCurrent);
    persistLocal({ goals: filtered, logsByGoal: restLogs, currentGoalId: nextCurrent });

    if (!uid) return;
    void deleteRemoteGoal(uid, id).catch((e) => console.error("Could not delete goal", e));
    void setDoc(userRef(uid), { currentGoalId: nextCurrent }, { merge: true }).catch(() => {});
  };

  const setCurrentGoal = (id: string) => {
    writeGoals(goals, id);
    if (!uid) return;
    void setDoc(userRef(uid), { currentGoalId: id }, { merge: true }).catch((e) =>
      console.error("Could not sync current goal", e)
    );
  };

  /* ---------- log writes ---------- */
  const applyLogChange = (goalId: string, nextLogs: Log[], deltaSec: number) => {
    const nextGoals = goals.map((g) =>
      g.id === goalId ? { ...g, totalTime: Math.max(0, g.totalTime + deltaSec) } : g
    );
    setGoals(nextGoals);
    if (goalId === currentGoalId) setLogs(newest(nextLogs));

    persistLocal({
      ...localRef.current,
      goals: nextGoals,
      logsByGoal: { ...localRef.current.logsByGoal, [goalId]: sortLogs(nextLogs) },
    });
  };

  const insert = (timestamp: number, durationSec: number, note: string, goalId?: string) => {
    const target = goalId ?? currentGoalId;
    const seconds = Math.max(0, Math.round(durationSec));
    if (!target || seconds <= 0) return;
    if (!goals.some((g) => g.id === target)) return; // goal deleted mid-session

    const log: Log = { id: newId(), timestamp, durationSec: seconds, note };
    const existing = localRef.current.logsByGoal[target] ?? [];
    applyLogChange(target, [...existing, log], seconds);

    if (!uid) return;
    void addRemoteLog(uid, target, log).catch((e) => console.error("Could not sync log", e));
  };

  const pushLog = (durationSec: number, note: string, goalId?: string) =>
    insert(Date.now(), durationSec, note, goalId);

  const addLog = (timestamp: number, durationSec: number, note: string, goalId?: string) =>
    insert(timestamp, durationSec, note, goalId);

  const editLog = (log: Log) => {
    const target = currentGoalId;
    if (!target) return;

    const existing = localRef.current.logsByGoal[target] ?? [];
    const previous = existing.find((l) => l.id === log.id);
    if (!previous) return;

    const seconds = Math.max(0, Math.round(log.durationSec));
    const next = { ...log, durationSec: seconds };
    applyLogChange(
      target,
      existing.map((l) => (l.id === log.id ? next : l)),
      seconds - previous.durationSec
    );

    if (!uid) return;
    void updateRemoteLog(uid, target, next, previous.durationSec).catch((e) =>
      console.error("Could not sync edit", e)
    );
  };

  const removeLog = (log: Log) => {
    const target = currentGoalId;
    if (!target) return;

    const existing = localRef.current.logsByGoal[target] ?? [];
    if (!existing.some((l) => l.id === log.id)) return;

    applyLogChange(
      target,
      existing.filter((l) => l.id !== log.id),
      -log.durationSec
    );

    if (!uid) return;
    void deleteRemoteLog(uid, target, log).catch((e) =>
      console.error("Could not sync deletion", e)
    );
  };

  /* ---------- bulk read ---------- */
  const loadAllLogs = useCallback(async (): Promise<Record<string, Log[]>> => {
    if (!uid) return localRef.current.logsByGoal;

    const out: Record<string, Log[]> = {};
    for (const goal of goals) {
      const snap = await getDocs(query(logsRef(uid, goal.id), orderBy("timestamp", "asc")));
      out[goal.id] = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Log);
    }
    return out;
  }, [uid, goals]);

  /* ---------- reset ---------- */
  const resetAll = async () => {
    clearAll(localStorage);
    localRef.current = { goals: [], logsByGoal: {}, currentGoalId: null };
    setGoals([]);
    setCurrentGoalId(null);
    setLogs([]);

    if (uid) {
      reconciledFor.current = uid; // do not re-adopt the data we just cleared
      await deleteEverything(uid);
    }
  };

  const value: GoalsCtx = {
    goals,
    currentGoalId,
    current: goals.find((g) => g.id === currentGoalId) ?? null,
    logs,
    loading,
    createGoal,
    renameGoal,
    deleteGoal,
    setCurrentGoal,
    pushLog,
    addLog,
    editLog,
    removeLog,
    loadAllLogs,
    resetAll,
  };

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>;
};
