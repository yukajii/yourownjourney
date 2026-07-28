import { useRef, useState } from "react";
import type { Settings } from "../models";
import { alarm } from "./useAlarm";
import { useTicker } from "./useTicker";

type Phase = "idle" | "focus" | "break";

/**
 * A phase is described by its deadline, never by a tick count. `startedAt` is
 * kept alongside it so the time actually spent focusing can be measured when a
 * block ends early.
 */
export type PomoState = { phase: Phase; startedAt: number; endsAt: number };

const LS_STATE = "leagues_pomodoro";
const LS_SETTINGS = "leagues_pomodoroSettings";

export const DEFAULT_SETTINGS: Settings = {
  pomodoroMinutes: 25,
  breakMinutes: 5,
  linkSessions: true,
};

const IDLE: PomoState = { phase: "idle", startedAt: 0, endsAt: 0 };

export const clampMinutes = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(180, Math.max(1, Math.round(value)))
    : fallback;

const bool = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

const readSettings = (): Settings => {
  try {
    const raw = localStorage.getItem(LS_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      pomodoroMinutes: clampMinutes(parsed.pomodoroMinutes, DEFAULT_SETTINGS.pomodoroMinutes),
      breakMinutes: clampMinutes(parsed.breakMinutes, DEFAULT_SETTINGS.breakMinutes),
      linkSessions: bool(parsed.linkSessions, DEFAULT_SETTINGS.linkSessions),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

/**
 * Replays phases that expired while the app was closed, so relaunching an hour
 * later lands in the right place instead of resuming a stale countdown.
 */
export const catchUp = (state: PomoState, breakMs: number): PomoState => {
  let cur = state;
  while (cur.phase !== "idle" && cur.endsAt <= Date.now()) {
    cur =
      cur.phase === "focus"
        ? { phase: "break", startedAt: cur.endsAt, endsAt: cur.endsAt + breakMs }
        : IDLE;
  }
  return cur;
};

const readState = (breakMs: number): PomoState => {
  try {
    const raw = localStorage.getItem(LS_STATE);
    if (!raw) return IDLE;
    const parsed = JSON.parse(raw) as Partial<PomoState>;
    if (
      (parsed.phase !== "focus" && parsed.phase !== "break") ||
      typeof parsed.endsAt !== "number"
    ) {
      return IDLE;
    }
    // Older stored states predate `startedAt`; fall back to the deadline so the
    // elapsed calculation cannot come out negative.
    const startedAt =
      typeof parsed.startedAt === "number" ? parsed.startedAt : parsed.endsAt;
    return catchUp({ phase: parsed.phase, startedAt, endsAt: parsed.endsAt }, breakMs);
  } catch {
    return IDLE;
  }
};

const secondsUntil = (endsAt: number) => Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));

/** Seconds actually spent in a focus block, never counting past its deadline. */
export const focusElapsedSec = (state: PomoState, now = Date.now()) =>
  state.phase !== "focus"
    ? 0
    : Math.max(0, Math.floor((Math.min(now, state.endsAt) - state.startedAt) / 1000));

export type PomodoroOptions = {
  /**
   * Called when a focus block ends while the app is open — whether it ran to
   * its deadline or was cut short — with the seconds actually focused.
   *
   * A block that expires while the app is closed is deliberately not reported.
   * The app cannot know the person kept working through it, and inventing time
   * they did not confirm is worse than missing it; they can add it by hand.
   */
  onFocusEnded?: (elapsedSec: number) => void;
};

export const usePomodoro = ({ onFocusEnded }: PomodoroOptions = {}) => {
  const [settings, setSettingsState] = useState<Settings>(readSettings);

  const focusMs = settings.pomodoroMinutes * 60_000;
  const breakMs = settings.breakMinutes * 60_000;

  const [state, setStateRaw] = useState<PomoState>(() => readState(breakMs));
  const [secondsLeft, setSecondsLeft] = useState(() => secondsUntil(state.endsAt));

  // Held in a ref so a caller need not memoise the callback to avoid restarting
  // the ticker on every render.
  const report = useRef(onFocusEnded);
  report.current = onFocusEnded;

  const setState = (next: PomoState) => {
    setStateRaw(next);
    setSecondsLeft(secondsUntil(next.endsAt));
    if (next.phase === "idle") localStorage.removeItem(LS_STATE);
    else localStorage.setItem(LS_STATE, JSON.stringify(next));
  };

  /** Moves out of the current phase, reporting focus time on the way. */
  const leaveFocus = (next: PomoState) => {
    const elapsed = focusElapsedSec(state);
    setState(next);
    if (elapsed > 0) report.current?.(elapsed);
  };

  useTicker(state.phase !== "idle", () => {
    const left = secondsUntil(state.endsAt);
    if (left > 0) {
      setSecondsLeft(left);
      return;
    }
    // Deadline reached. Focus rolls straight into a break — the previous
    // implementation set the break's length but never started its countdown,
    // leaving the timer frozen.
    alarm();
    if (state.phase === "focus") {
      leaveFocus({ phase: "break", startedAt: Date.now(), endsAt: Date.now() + breakMs });
    } else {
      setState(IDLE);
    }
  });

  const startFocus = () =>
    setState({ phase: "focus", startedAt: Date.now(), endsAt: Date.now() + focusMs });

  const takeBreak = () =>
    leaveFocus({ phase: "break", startedAt: Date.now(), endsAt: Date.now() + breakMs });

  const stop = () => leaveFocus(IDLE);

  const setSettings = (next: Settings) => {
    const clean: Settings = {
      pomodoroMinutes: clampMinutes(next.pomodoroMinutes, DEFAULT_SETTINGS.pomodoroMinutes),
      breakMinutes: clampMinutes(next.breakMinutes, DEFAULT_SETTINGS.breakMinutes),
      linkSessions: bool(next.linkSessions, DEFAULT_SETTINGS.linkSessions),
    };
    setSettingsState(clean);
    localStorage.setItem(LS_SETTINGS, JSON.stringify(clean));
  };

  return {
    phase: state.phase,
    // Idle shows the configured focus length rather than a hardcoded 25:00.
    secondsLeft: state.phase === "idle" ? settings.pomodoroMinutes * 60 : secondsLeft,
    settings,
    setSettings,
    startFocus,
    takeBreak,
    backToWork: startFocus,
    stop,
  };
};
