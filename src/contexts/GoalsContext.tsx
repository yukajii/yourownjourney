import { doc, onSnapshot, setDoc, type DocumentReference } from "firebase/firestore";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import type { Goal } from "../models";
import { db } from "../firebase";

/* ───────────── LocalStorage keys ───────────── */
const LS_GOALS = "leagues_goals";
const LS_CURRENT = "leagues_currentGoalId";
const LS_ACTIVE_SESSION = "leagues_activeSession";

/* ───────────── Context shape ───────────── */
type GoalsCtx = {
  goals: Goal[];
  currentGoalId: string | null;
  current: Goal | null;
  /** True until the first read (local or remote) has settled. */
  loading: boolean;
  createGoal: (name: string) => void;
  renameGoal: (id: string, name: string) => void;
  deleteGoal: (id: string) => void;
  setCurrentGoal: (id: string) => void;
  /** Logs against `goalId` if given, so a session survives switching goals. */
  pushLog: (durationSec: number, note: string, goalId?: string) => void;
  resetAll: () => Promise<void>;
};

const GoalsContext = createContext<GoalsCtx | undefined>(undefined);
export const useGoals = () => {
  const ctx = useContext(GoalsContext);
  if (!ctx) throw new Error("useGoals() must be used within <GoalsProvider>");
  return ctx;
};

/* ───────────── LocalStorage helpers ───────────── */
type Stored = { goals: Goal[]; currentGoalId: string | null };

const readLocal = (): Stored => {
  try {
    const goals = JSON.parse(localStorage.getItem(LS_GOALS) ?? "[]") as Goal[];
    if (!Array.isArray(goals)) return { goals: [], currentGoalId: null };
    const stored = localStorage.getItem(LS_CURRENT);
    // A stale pointer to a deleted goal would render an empty header forever.
    const currentGoalId = goals.some((g) => g.id === stored)
      ? stored
      : goals[0]?.id ?? null;
    return { goals, currentGoalId };
  } catch {
    return { goals: [], currentGoalId: null };
  }
};

const writeLocal = ({ goals, currentGoalId }: Stored) => {
  localStorage.setItem(LS_GOALS, JSON.stringify(goals));
  if (currentGoalId) localStorage.setItem(LS_CURRENT, currentGoalId);
  else localStorage.removeItem(LS_CURRENT);
};

/* ───────────── Provider ───────────── */
export const GoalsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [currentGoalId, setCurrentGoalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /** Guards the one-time local→cloud adoption so a reset can't resurrect data. */
  const migratedFor = useRef<string | null>(null);

  const userDoc = (uid: string): DocumentReference => doc(db, "users", uid);

  /* ---------- load, and stay subscribed while signed in ---------- */
  useEffect(() => {
    if (!user) {
      const local = readLocal();
      setGoals(local.goals);
      setCurrentGoalId(local.currentGoalId);
      setLoading(false);
      return;
    }

    setLoading(true);
    const ref = userDoc(user.uid);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        const remote = snap.data() as Partial<Stored> | undefined;
        const remoteGoals = Array.isArray(remote?.goals) ? remote.goals : [];

        /* First sign-in on a device that already has offline history: adopt it
           rather than silently replacing it with an empty cloud document. */
        if (remoteGoals.length === 0 && migratedFor.current !== user.uid) {
          migratedFor.current = user.uid;
          const local = readLocal();
          if (local.goals.length > 0) {
            setGoals(local.goals);
            setCurrentGoalId(local.currentGoalId);
            setLoading(false);
            void setDoc(ref, local, { merge: true }).catch((e) =>
              console.error("Could not upload local goals", e)
            );
            return;
          }
        }

        migratedFor.current = user.uid;
        const nextCurrent = remoteGoals.some((g) => g.id === remote?.currentGoalId)
          ? remote!.currentGoalId!
          : remoteGoals[0]?.id ?? null;

        setGoals(remoteGoals);
        setCurrentGoalId(nextCurrent);
        writeLocal({ goals: remoteGoals, currentGoalId: nextCurrent });
        setLoading(false);
      },
      (err) => {
        // Rules rejection, or an unreachable backend with a cold cache.
        console.error("Goal sync failed, falling back to this device", err);
        const local = readLocal();
        setGoals(local.goals);
        setCurrentGoalId(local.currentGoalId);
        setLoading(false);
      }
    );

    return unsub;
  }, [user]);

  /* ---------- persistence ---------- */
  const persist = (nextGoals: Goal[], nextCurrent: string | null) => {
    setGoals(nextGoals);
    setCurrentGoalId(nextCurrent);
    // Local first and synchronously: with the offline cache enabled the
    // Firestore promise does not settle until the server acknowledges, so
    // awaiting it would stall every edit made without a connection.
    writeLocal({ goals: nextGoals, currentGoalId: nextCurrent });

    if (user) {
      void setDoc(
        userDoc(user.uid),
        { goals: nextGoals, currentGoalId: nextCurrent },
        { merge: true }
      ).catch((e) => console.error("Could not sync goals", e));
    }
  };

  /* ---------- CRUD ---------- */
  const createGoal = (name: string) => {
    const newGoal: Goal = {
      id:
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name,
      totalTime: 0,
      logs: [],
      created: Date.now(),
    };
    persist([...goals, newGoal], newGoal.id);
  };

  const renameGoal = (id: string, name: string) =>
    persist(goals.map((g) => (g.id === id ? { ...g, name } : g)), currentGoalId);

  const deleteGoal = (id: string) => {
    const filtered = goals.filter((g) => g.id !== id);
    if (filtered.length === goals.length) return;
    persist(filtered, currentGoalId === id ? filtered[0]?.id ?? null : currentGoalId);
  };

  const setCurrentGoal = (id: string) => persist(goals, id);

  const pushLog = (durationSec: number, note: string, goalId?: string) => {
    const target = goalId ?? currentGoalId;
    if (!target || durationSec <= 0) return;
    if (!goals.some((g) => g.id === target)) return; // goal deleted mid-session

    persist(
      goals.map((g) =>
        g.id === target
          ? {
              ...g,
              totalTime: g.totalTime + durationSec,
              logs: [...g.logs, { timestamp: Date.now(), durationSec, note }],
            }
          : g
      ),
      currentGoalId
    );
  };

  const resetAll = async () => {
    localStorage.removeItem(LS_GOALS);
    localStorage.removeItem(LS_CURRENT);
    localStorage.removeItem(LS_ACTIVE_SESSION);
    setGoals([]);
    setCurrentGoalId(null);

    if (user) {
      migratedFor.current = user.uid; // do not re-adopt the data we just cleared
      await setDoc(userDoc(user.uid), { goals: [], currentGoalId: null });
    }
  };

  const value: GoalsCtx = {
    goals,
    currentGoalId,
    current: goals.find((g) => g.id === currentGoalId) ?? null,
    loading,
    createGoal,
    renameGoal,
    deleteGoal,
    setCurrentGoal,
    pushLog,
    resetAll,
  };

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>;
};
