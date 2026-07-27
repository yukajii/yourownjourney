export interface Log {
  /** Stable id, so a single entry can be edited or deleted. */
  id:          string;
  timestamp:   number;   // epoch ms
  durationSec: number;   // integer seconds
  note:        string;
}

/**
 * A goal no longer carries its logs. They live in their own collection so that
 * appending one does not rewrite the whole history, and so that opening the app
 * does not download years of it.
 */
export interface Goal {
  id:        string;
  name:      string;
  totalTime: number;   // seconds — a running total, kept in step with the logs
  created:   number;
}

/** The pre-subcollection shape, still present in old storage and documents. */
export interface LegacyGoal {
  id:        string;
  name:      string;
  totalTime: number;
  created:   number;
  logs?:     Partial<Log>[];
}

export interface Settings {
  pomodoroMinutes: number;
  breakMinutes:    number;
}

export const TIERS = [20, 100, 1000, 10000];   // Leagues (hours)

/** Bumped when the stored shape changes. See storage/localStore.ts. */
export const SCHEMA_VERSION = 2;

export const newId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;
