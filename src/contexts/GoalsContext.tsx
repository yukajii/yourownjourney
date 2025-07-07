import {
  collection,
  doc,
  getDoc,
  setDoc,
  getFirestore,
  type DocumentReference
} from "firebase/firestore";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react";
import { useAuth } from "./AuthContext";
import type { Goal } from "../models";
import { app } from "../firebase";

/* ───────────── LocalStorage keys ───────────── */
const LS_GOALS   = "leagues_goals";
const LS_CURRENT = "leagues_currentGoalId";

/* ───────────── Context shape ───────────── */
type GoalsCtx = {
  goals: Goal[];
  currentGoalId: string | null;
  current: Goal | null;
  createGoal: (name: string) => void;
  renameGoal: (id: string, name: string) => void;
  deleteGoal: (id: string) => void;
  setCurrentGoal: (id: string) => void;
  pushLog: (durationSec: number, note: string) => void;
  resetAll: () => void;
};

const GoalsContext = createContext<GoalsCtx | undefined>(undefined);
export const useGoals = () => {
  const ctx = useContext(GoalsContext);
  if (!ctx)
    throw new Error("useGoals() must be used within <GoalsProvider>");
  return ctx;
};

/* ───────────── Provider ───────────── */
export const GoalsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const db = getFirestore(app);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [currentGoalId, setCurrentGoalId] = useState<string | null>(null);

  /* helper: Firestore doc ref or dummy local path */
  const userDoc = (): DocumentReference =>
    doc(collection(db, "users"), user?.uid ?? "__local__");

  /* ---------- initial load / user switch ---------- */
  useEffect(() => {
    const load = async () => {
      if (user) {
        const snap = await getDoc(userDoc());
        if (snap.exists()) {
          const data = snap.data() as any;
          setGoals(data.goals ?? []);
          setCurrentGoalId(data.currentGoalId ?? null);
          return;
        }
      }
      /* offline or first-time → localStorage */
      const lsGoals: Goal[] =
        JSON.parse(localStorage.getItem(LS_GOALS) ?? "[]");
      setGoals(lsGoals);
      setCurrentGoalId(
        localStorage.getItem(LS_CURRENT) ?? (lsGoals[0]?.id ?? null)
      );
    };
    load();
  }, [user]);

  /* ---------- persistence helper ---------- */
  const persist = async (g: Goal[], current: string | null) => {
    setGoals(g);
    setCurrentGoalId(current);

    if (user) {
      await setDoc(
        userDoc(),
        { goals: g, currentGoalId: current },
        { merge: true }
      );
    }
    localStorage.setItem(LS_GOALS, JSON.stringify(g));
    current
      ? localStorage.setItem(LS_CURRENT, current)
      : localStorage.removeItem(LS_CURRENT);
  };

  /* ---------- CRUD ---------- */
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
    if (goals.length === 1) return;           // keep at least one
    const filtered = goals.filter(g => g.id !== id);
    persist(filtered, filtered[0]?.id ?? null);
  };

  /* ---------- helpers ---------- */
  const setCurrentGoal = (id: string) => persist(goals, id);

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

  const resetAll = async () => {
    if (!confirm("Delete ALL goals and logs?")) return;
    if (user) await setDoc(userDoc(), {});      // wipe remote
    localStorage.clear();                       // wipe local
    setGoals([]);
    setCurrentGoalId(null);
  };

  const value: GoalsCtx = {
    goals,
    currentGoalId,
    current: goals.find(g => g.id === currentGoalId) ?? null,
    createGoal,
    renameGoal,
    deleteGoal,
    setCurrentGoal,
    pushLog,
    resetAll
  };

  return (
    <GoalsContext.Provider value={value}>
      {children}
    </GoalsContext.Provider>
  );
};
