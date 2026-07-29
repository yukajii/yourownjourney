import { currentStreak, dayKey, pacePerWeek, startOfDay, waypointProgress } from "./journey";
import type { Goal, Log } from "./models";

/**
 * What the mentor is allowed to know.
 *
 * Everything here is derived from logs the user actually walked. The previous
 * set of sayings asserted things the app had no way of knowing — "Missed a
 * session? That is past" was shown to someone on a twelve-day streak — which
 * is the fastest way to make a guide feel like wallpaper.
 */
export type MentorSignals = {
  hasGoal: boolean;
  isSessionActive: boolean;
  sessionSeconds: number;
  /** Consecutive days walked, counting back from today. */
  streakDays: number;
  /** Whole days since the last entry; null when nothing has ever been walked. */
  daysSinceLast: number | null;
  walkedToday: boolean;
  leagues: number;
  /** Leagues still to walk before the next mark. */
  remaining: number;
  /** The next mark, and whether it is one of the great tiers. */
  next: number;
  nextIsTier: boolean;
  leaguesPerWeek: number;
};

const DAY_MS = 86_400_000;

export const buildSignals = (
  goal: Goal | null,
  logs: Log[],
  session: { isActive: boolean; seconds: number },
  now = Date.now()
): MentorSignals => {
  const totalSeconds = (goal?.totalTime ?? 0) + (session.isActive ? session.seconds : 0);
  const { leagues, remaining, to, toIsTier } = waypointProgress(totalSeconds);

  const latest = logs.reduce((max, l) => Math.max(max, l.timestamp), 0);
  const today = dayKey(now);

  return {
    hasGoal: goal !== null,
    isSessionActive: session.isActive,
    sessionSeconds: session.seconds,
    streakDays: currentStreak(logs, now),
    // Counted in calendar days, not elapsed milliseconds: a session at 23:00
    // last night is "yesterday", not "0 days ago", which is how the streak and
    // the heatmap already think about it. Rounding absorbs 23- and 25-hour
    // days across a daylight-saving change.
    daysSinceLast:
      latest === 0
        ? null
        : Math.round((startOfDay(now).getTime() - startOfDay(latest).getTime()) / DAY_MS),
    walkedToday: logs.some((l) => dayKey(l.timestamp) === today),
    leagues,
    remaining,
    next: to,
    nextIsTier: toIsTier,
    leaguesPerWeek: pacePerWeek(logs, now),
  };
};

/**
 * A line the mentor could say: a translation key plus its values, never the
 * finished sentence. The module stays pure and testable, and the same logic
 * serves every language.
 */
export type MentorLine = {
  id: string;
  key: string;
  params?: Record<string, string | number>;
  priority: number;
};

const round = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

/** Roughly how much longer, at the current pace. Returns a key to translate. */
export const minutesLeftKey = (
  remainingLeagues: number
): { key: string; params?: Record<string, number> } => {
  const minutes = Math.ceil(remainingLeagues * 60);
  if (minutes <= 1) return { key: "mentor.minute" };
  if (minutes < 60) return { key: "mentor.minutes", params: { n: minutes } };
  return { key: "mentor.anHour" };
};

/**
 * Every line that is true of the current state, most pressing first.
 *
 * Returning the whole set rather than one line lets the widget keep rotating
 * without ever saying something false.
 */
export const mentorLines = (s: MentorSignals): MentorLine[] => {
  const lines: MentorLine[] = [];
  const add = (
    id: string,
    key: string,
    priority: number,
    params?: Record<string, string | number>
  ) => lines.push({ id, key, priority, params });

  if (!s.hasGoal) {
    add("no-goal", "mentor.noGoal", 100);
    return lines;
  }

  /* ── at sea ────────────────────────────────────────────────── */
  if (s.isSessionActive) {
    if (s.sessionSeconds >= 90 * 60) add("long-session", "mentor.longSession", 90);

    if (s.remaining <= 0.5) {
      // The time phrase is itself translated, so it is passed as a key for the
      // caller to resolve before interpolating.
      const left = minutesLeftKey(s.remaining);
      add("almost-there", "mentor.almostThere", 88, {
        timeKey: left.key,
        timeN: left.params?.n ?? 0,
        next: round(s.next),
      });
    }

    add("walking", "mentor.walking", 80);
    add("walking-2", "mentor.walking2", 80);
    return lines.sort((a, b) => b.priority - a.priority);
  }

  /* ── nothing walked yet ────────────────────────────────────── */
  if (s.daysSinceLast === null) {
    add("never-walked", "mentor.neverWalked", 95);
    return lines;
  }

  /* ── returning after a gap ─────────────────────────────────── */
  if (s.daysSinceLast >= 14) {
    add("long-absence", "mentor.longAbsence", 70, {
      days: s.daysSinceLast,
      leagues: round(s.leagues),
    });
  } else if (s.daysSinceLast >= 7) {
    add("week-absence", "mentor.weekAbsence", 65);
  } else if (s.daysSinceLast >= 2) {
    add("short-absence", "mentor.shortAbsence", 60, { days: s.daysSinceLast });
  }

  /* ── close to a mark ───────────────────────────────────────── */
  if (s.remaining <= 1) {
    add(
      "near-mark",
      s.nextIsTier ? "mentor.nearTier" : "mentor.nearWaypoint",
      s.nextIsTier ? 75 : 55,
      { n: round(s.remaining), next: round(s.next) }
    );
  }

  /* ── streaks ───────────────────────────────────────────────── */
  if (s.streakDays >= 7) {
    add("long-streak", "mentor.longStreak", 50, { days: s.streakDays });
  } else if (s.streakDays >= 3) {
    add("streak", "mentor.streak", 45, { days: s.streakDays });
  }

  if (s.walkedToday) {
    add("walked-today", "mentor.walkedToday", 40);
  } else if (s.streakDays > 0) {
    add("keep-streak", "mentor.keepStreak", 48, { days: s.streakDays });
  }

  if (s.leaguesPerWeek > 0) {
    add("pace", "mentor.pace", 30, { n: s.leaguesPerWeek.toFixed(1) });
  }

  /* ── evergreen, so the mentor never runs dry ───────────────── */
  add("evergreen-1", "mentor.evergreen1", 10);
  add("evergreen-2", "mentor.evergreen2", 10);
  add("evergreen-3", "mentor.evergreen3", 10);
  add("evergreen-4", "mentor.evergreen4", 10);

  return lines.sort((a, b) => b.priority - a.priority);
};

/**
 * A stable key for "has the mentor's situation changed?". When it does the
 * widget restarts its rotation, so the most pressing line is seen at once
 * rather than up to fifteen seconds later.
 */
export const situationKey = (lines: MentorLine[]) => lines.map((l) => l.id).join("|");
