import {
  collection,
  doc,
  getDoc,
  setDoc,
  getFirestore,
  type DocumentReference
} from "firebase/firestore";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import type { Goal } from "../models";
import { app } from "../firebase";

/* ---------- Context shape ---------- */
type GoalsCtx = {
  goals: Goal[];
  currentGoalId: string | null;
  /** the current goal object (null if none yet) */
  current: Goal | null;
  createGoal: (name: string) => void;
  renameGoal: (id: string, name: string) => void;
  deleteGoal: (id: string) => void;
  setCurrentGoal: (id: string) => void;
  /** append a log + duration to the current goal */
  pushLog: (durationSec: number, note: string) => void;
};

const GoalsContext = createContext<GoalsCtx | undefined>(undefined);
export const useGoals = () => {
  const ctx = useContext(GoalsContext);
  if (!ctx) throw new Error("useGoals must be within <GoalsProvider>");
  return ctx;
};

/* ---------- Provider ---------- */
export const GoalsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const db = getFirestore(app);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [currentGoalId, setCurrentGoalId] = useState<string | null>(null);

  /** helper to get user doc ref (handles signed-out case) */
  const userDoc = (): DocumentReference =>
    doc(collection(db, "users"), user?.uid ?? "__local__");

  /* initial load / sync */
  useEffect(() => {
    (async () => {
      const snap = await getDoc(userDoc());
      if (snap.exists()) {
        const data = snap.data() as any;
        setGoals(data.goals ?? []);
        setCurrentGoalId(data.currentGoalId ?? null);
      } else {
        /* first time user – create starter goal */
        const starter: Goal = {
          id: Date.now().toString(),
          name: "My First Goal",
          totalTime: 0,
          logs: [],
          created: Date.now()
        };
        setGoals([starter]);
        setCurrentGoalId(starter.id);
        await setDoc(userDoc(), { goals: [starter], currentGoalId: starter.id });
      }
    })();
    // re-run when user changes
  }, [user]);

  /* save helper */
  const persist = async (g: Goal[], current: string | null) => {
    setGoals(g);
    setCurrentGoalId(current);
    await setDoc(userDoc(), { goals: g, currentGoalId: current }, { merge: true });
  };


  /* pushLog implementation for useSession() */
  const pushLog = (durationSec: number, note: string) => {
    if (!currentGoalId) return;
    const updated = goals.map(g =>
      g.id === currentGoalId
        ? {
            ...g,
            totalTime: g.totalTime + durationSec,
            logs: [
              ...g.logs,
              { timestamp: Date.now(), durationSec, note }
            ]
          }
        : g
    );
    persist(updated, currentGoalId);
  };

  /* CRUD exposed to UI (TODO: flesh out later) */
  const createGoal = (name: string) => {
    const newGoal: Goal = {
      id: Date.now().toString(),
      name,
      totalTime: 0,
      logs: [],
      created: Date.now()
    };
    persist([...goals, newGoal], newGoal.id);
  };
  const renameGoal = (id: string, name: string) =>
    persist(
      goals.map(g => (g.id === id ? { ...g, name } : g)),
      currentGoalId
    );
  const deleteGoal = (id: string) => {
    if (goals.length === 1) return;
    const filtered = goals.filter(g => g.id !== id);
    persist(filtered, filtered[0].id);
  };

  const value: GoalsCtx = {
    goals,
    currentGoalId,
    current: goals.find(g => g.id === currentGoalId) ?? null,
    createGoal,
    renameGoal,
    deleteGoal,
    setCurrentGoal: id => persist(goals, id),
    pushLog
  };

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>;
};
