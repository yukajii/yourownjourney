import { toLeagues } from "./leagues";
import { TIERS, type Log } from "./models";

const DAY_MS = 86_400_000;

/* ───────────── waypoints ─────────────
 *
 * The tiers — 20, 100, 1000, 10000 — are the frame of the whole journey, but
 * they are a terrible progress bar. Between 100 and 1000 an hour a day moves
 * the bar by a tenth of a percent, so it reads as motionless for years.
 *
 * Waypoints sit between them and widen as the total grows, so there is always
 * a near horizon. Every tier is also a waypoint, so the bar lands exactly on
 * one when a tier is reached rather than sailing past it.
 */
const STEPS: { below: number; step: number }[] = [
  { below: 20, step: 5 },
  { below: 100, step: 20 },
  { below: 1000, step: 100 },
  { below: Infinity, step: 1000 },
];

const stepFor = (leagues: number) => STEPS.find((s) => leagues < s.below)!.step;

export const nextTier = (leagues: number): number | null =>
  TIERS.find((t) => t > leagues) ?? null;

export const prevTier = (leagues: number): number =>
  [...TIERS].reverse().find((t) => t <= leagues) ?? 0;

/** The next mark ahead. Never overshoots a tier. */
export const nextWaypoint = (leagues: number): number => {
  const step = stepFor(leagues);
  const candidate = (Math.floor(leagues / step) + 1) * step;
  const tier = nextTier(leagues);
  return tier !== null ? Math.min(candidate, tier) : candidate;
};

/** The mark just passed, which the bar fills from. */
export const prevWaypoint = (leagues: number): number => {
  const step = stepFor(leagues);
  return Math.max(Math.floor(leagues / step) * step, prevTier(leagues));
};

export type WaypointProgress = {
  leagues: number;
  from: number;
  to: number;
  /** 0–100 between `from` and `to`. */
  pct: number;
  /** True when the next mark is itself a tier. */
  toIsTier: boolean;
  remaining: number;
};

export const waypointProgress = (totalSeconds: number): WaypointProgress => {
  const leagues = toLeagues(Math.max(0, totalSeconds));
  const from = prevWaypoint(leagues);
  const to = nextWaypoint(leagues);
  const span = to - from;

  return {
    leagues,
    from,
    to,
    pct: span <= 0 ? 100 : Math.min(100, Math.max(0, ((leagues - from) / span) * 100)),
    toIsTier: TIERS.includes(to),
    remaining: Math.max(0, to - leagues),
  };
};

/* ───────────── pace ───────────── */

/**
 * Leagues per week over a trailing window.
 *
 * A trailing window rather than a lifetime average: a goal picked up again
 * after a fallow month should reflect this month, not be dragged down by it
 * forever.
 */
export const pacePerWeek = (logs: Log[], now = Date.now(), windowDays = 28): number => {
  const cutoff = now - windowDays * DAY_MS;
  const seconds = logs
    .filter((l) => l.timestamp >= cutoff && l.timestamp <= now)
    .reduce((t, l) => t + l.durationSec, 0);

  return toLeagues(seconds) / (windowDays / 7);
};

/** Milliseconds until `remaining` leagues are walked, or null at a standstill. */
export const projectArrival = (
  remainingLeagues: number,
  leaguesPerWeek: number,
  now = Date.now()
): number | null => {
  if (leaguesPerWeek <= 0 || remainingLeagues <= 0) return null;
  const ms = (remainingLeagues / leaguesPerWeek) * 7 * DAY_MS;
  // Past a decade the estimate says nothing useful; the caller shows a hint
  // rather than a date in the 2050s.
  return ms > 10 * 365 * DAY_MS ? null : now + ms;
};

/* ───────────── days ───────────── */

/**
 * Local calendar day, as YYYY-MM-DD.
 *
 * Deliberately built from the Date's local getters: bucketing on the UTC date
 * would push an evening session in a positive offset into tomorrow, and a
 * morning one in a negative offset into yesterday, quietly breaking both the
 * heatmap and the streak.
 */
export const dayKey = (ms: number): string => {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const secondsByDay = (logs: Log[]): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const l of logs) {
    const key = dayKey(l.timestamp);
    out[key] = (out[key] ?? 0) + l.durationSec;
  }
  return out;
};

/** Midnight, local time, on the day containing `ms`. */
export const startOfDay = (ms: number): Date => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Consecutive days walked, counting back from today.
 *
 * Today not being walked yet does not break a streak — it is only broken once
 * a whole day has passed with nothing logged.
 */
export const currentStreak = (logs: Log[], now = Date.now()): number => {
  const days = secondsByDay(logs);
  if (Object.keys(days).length === 0) return 0;

  const cursor = startOfDay(now);
  if (!days[dayKey(cursor.getTime())]) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (days[dayKey(cursor.getTime())]) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

/* ───────────── heatmap ───────────── */

export type HeatCell = {
  key: string;
  ms: number;
  seconds: number;
  /** 0 when nothing was walked, else 1–4 by intensity. */
  level: 0 | 1 | 2 | 3 | 4;
  inFuture: boolean;
};

/** Thresholds in seconds: under 30m, under 1h, under 2h, then beyond. */
const level = (seconds: number): HeatCell["level"] => {
  if (seconds <= 0) return 0;
  if (seconds < 1800) return 1;
  if (seconds < 3600) return 2;
  if (seconds < 7200) return 3;
  return 4;
};

/**
 * Columns of seven days, oldest column first, each starting on a Monday, up to
 * and including the week containing `now`.
 */
export const heatmapWeeks = (logs: Log[], now = Date.now(), weeks = 26): HeatCell[][] => {
  const byDay = secondsByDay(logs);

  // Walk back to the Monday of the current week. getDay() is 0 for Sunday.
  const monday = startOfDay(now);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));

  const first = new Date(monday);
  first.setDate(first.getDate() - (weeks - 1) * 7);

  const endOfToday = startOfDay(now).getTime();

  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const cell = new Date(first);
      cell.setDate(cell.getDate() + w * 7 + d);
      const ms = cell.getTime();
      const seconds = byDay[dayKey(ms)] ?? 0;

      return {
        key: dayKey(ms),
        ms,
        seconds,
        level: level(seconds),
        inFuture: ms > endOfToday,
      };
    })
  );
};
