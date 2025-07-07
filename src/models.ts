export interface Log {
  timestamp:   number;   // epoch ms
  durationSec: number;   // integer seconds
  note:        string;
}

export interface Goal {
  id:        string;
  name:      string;
  totalTime: number;   // seconds
  logs:      Log[];
  created:   number;
}

export interface Settings {
  pomodoroMinutes: number;
  breakMinutes:    number;
}

export const TIERS = [20, 100, 1000, 10000];   // Leagues (hours)