import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useGoals } from "./GoalsContext";
import { useTicker } from "../hooks/useTicker";

const LS_ACTIVE = "leagues_activeSession";

type ActiveSession = {
  goalId: string;
  startTime: number; // epoch ms
};

export type StoppedSession = {
  goalId: string;
  durationSec: number;
};

type SessionCtx = {
  isActive: boolean;
  seconds: number;
  /** True once a goal exists to attribute the session to. */
  canStart: boolean;
  start: () => void;
  /**
   * Ends the session and hands back what was walked, so the caller can ask for
   * a note before committing it. Returns null if nothing was running.
   */
  stop: () => StoppedSession | null;
};

const SessionContext = createContext<SessionCtx | undefined>(undefined);

export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession() must be used within <SessionProvider>");
  return ctx;
};

const readStored = (): ActiveSession | null => {
  try {
    const raw = localStorage.getItem(LS_ACTIVE);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ActiveSession>;
    if (typeof parsed?.goalId !== "string" || typeof parsed?.startTime !== "number") {
      return null;
    }
    return { goalId: parsed.goalId, startTime: parsed.startTime };
  } catch {
    localStorage.removeItem(LS_ACTIVE);
    return null;
  }
};

const elapsed = (startTime: number) =>
  Math.max(0, Math.floor((Date.now() - startTime) / 1000));

/**
 * Holds the one and only walking session. It lives in a provider rather than a
 * hook so that every card — the timer, the progress bar — reads the same state
 * instead of each spinning up its own private copy.
 */
export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const { current } = useGoals();

  // Restored synchronously: a session outlives reloads and app relaunches.
  const [session, setSession] = useState<ActiveSession | null>(readStored);
  const [seconds, setSeconds] = useState(() => {
    const stored = readStored();
    return stored ? elapsed(stored.startTime) : 0;
  });

  useTicker(session !== null, () => {
    if (session) setSeconds(elapsed(session.startTime));
  });

  const start = () => {
    if (session || !current) return;
    const next: ActiveSession = { goalId: current.id, startTime: Date.now() };
    localStorage.setItem(LS_ACTIVE, JSON.stringify(next));
    setSession(next);
    setSeconds(0);
  };

  const stop = (): StoppedSession | null => {
    if (!session) return null;
    const stopped: StoppedSession = {
      goalId: session.goalId,
      // Read the clock rather than the once-a-second `seconds` state, which
      // can trail the real elapsed time by up to a second.
      durationSec: elapsed(session.startTime),
    };
    localStorage.removeItem(LS_ACTIVE);
    setSession(null);
    setSeconds(0);
    return stopped;
  };

  /* The manifest's "Start a session" shortcut launches /?start=1. */
  const shortcutHandled = useRef(false);
  useEffect(() => {
    if (shortcutHandled.current || !current) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("start") !== "1") return;

    shortcutHandled.current = true;
    url.searchParams.delete("start");
    window.history.replaceState({}, "", url.pathname + url.search);
    start();
    // `start` closes over the freshly loaded goal; re-running on every render
    // is neither needed nor wanted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const value: SessionCtx = {
    isActive: session !== null,
    seconds,
    canStart: current !== null,
    start,
    stop,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};
