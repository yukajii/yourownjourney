import { useState } from "react";
import type { Settings } from "../models";
import { alarm } from "./useAlarm";
import { useTicker } from "./useTicker";

type Phase = "idle" | "focus" | "break";

/** A phase is described by its deadline, never by a tick count. */
export type PomoState = { phase: Phase; endsAt: number };

const LS_STATE = "leagues_pomodoro";
const LS_SETTINGS = "leagues_pomodoroSettings";

export const DEFAULT_SETTINGS: Settings = { pomodoroMinutes: 25, breakMinutes: 5 };

const IDLE: PomoState = { phase: "idle", endsAt: 0 };

export const clampMinutes = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(180, Math.max(1, Math.round(value)))
    : fallback;

const readSettings = (): Settings => {
  try {
    const raw = localStorage.getItem(LS_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      pomodoroMinutes: clampMinutes(parsed.pomodoroMinutes, DEFAULT_SETTINGS.pomodoroMinutes),
      breakMinutes: clampMinutes(parsed.breakMinutes, DEFAULT_SETTINGS.breakMinutes),
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
    cur = cur.phase === "focus" ? { phase: "break", endsAt: cur.endsAt + breakMs } : IDLE;
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
    return catchUp({ phase: parsed.phase, endsAt: parsed.endsAt }, breakMs);
  } catch {
    return IDLE;
  }
};

const secondsUntil = (endsAt: number) => Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));

export const usePomodoro = () => {
  const [settings, setSettingsState] = useState<Settings>(readSettings);

  const focusMs = settings.pomodoroMinutes * 60_000;
  const breakMs = settings.breakMinutes * 60_000;

  const [state, setStateRaw] = useState<PomoState>(() => readState(breakMs));
  const [secondsLeft, setSecondsLeft] = useState(() => secondsUntil(state.endsAt));

  const setState = (next: PomoState) => {
    setStateRaw(next);
    setSecondsLeft(secondsUntil(next.endsAt));
    if (next.phase === "idle") localStorage.removeItem(LS_STATE);
    else localStorage.setItem(LS_STATE, JSON.stringify(next));
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
    setState(state.phase === "focus" ? { phase: "break", endsAt: Date.now() + breakMs } : IDLE);
  });

  const startFocus = () => setState({ phase: "focus", endsAt: Date.now() + focusMs });
  const takeBreak = () => setState({ phase: "break", endsAt: Date.now() + breakMs });
  const stop = () => setState(IDLE);

  const setSettings = (next: Settings) => {
    const clean: Settings = {
      pomodoroMinutes: clampMinutes(next.pomodoroMinutes, DEFAULT_SETTINGS.pomodoroMinutes),
      breakMinutes: clampMinutes(next.breakMinutes, DEFAULT_SETTINGS.breakMinutes),
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
