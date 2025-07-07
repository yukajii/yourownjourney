import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Goal } from "../models";
import { db } from '../firebase';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

interface GoalsCtx {
  goals: Goal[];
  current: Goal | null;
  createGoal: (name: string) => void;
  renameGoal: (id: string, name: string) => void;
  deleteGoal: (id: string) => void;
  selectGoal: (id: string) => void;
  pushLog: (goalId: string, durationSec: number, note: string) => void;
}

const Ctx = createContext<GoalsCtx | null>(null);

export const GoalsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [currentGoalId, setCurrentGoalId] = useState<string | null>(null);

  /* TODO: Firestore + LocalStorage sync logic
     – onAuth change, load correct source
     – save on state change */

  const createGoal = (name: string) => {
    const g: Goal = {
      id: crypto.randomUUID(),
      name,
      totalTime: 0,
      logs: [],
      created: Date.now(),
    };
    setGoals(prev => [...prev, g]);
    setCurrentGoalId(g.id);
  };

  const current = goals.find(g => g.id === currentGoalId) || null;

  return (
    <Ctx.Provider
      value={{
        goals,
        current,
        createGoal,
        renameGoal: () => {}, // TODO
        deleteGoal: () => {}, // TODO
        selectGoal: setCurrentGoalId,
        pushLog: () => {},    // TODO
      }}>
      {children}
    </Ctx.Provider>
  );
};

export const useGoals = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useGoals must be inside GoalsProvider');
  return ctx;
};