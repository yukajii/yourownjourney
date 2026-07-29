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

export type MentorLine = { id: string; text: string; priority: number };

const round = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

/** Roughly how much longer, in plain words, at the current pace of the walk. */
const minutesLeft = (remainingLeagues: number) => {
  const minutes = Math.ceil(remainingLeagues * 60);
  if (minutes <= 1) return "a minute";
  if (minutes < 60) return `${minutes} minutes`;
  return "an hour or so";
};

/**
 * Every line that is true of the current state, most pressing first.
 *
 * Returning the whole set rather than one line lets the widget keep rotating
 * without ever saying something false.
 */
export const mentorLines = (s: MentorSignals): MentorLine[] => {
  const lines: MentorLine[] = [];
  const add = (id: string, text: string, priority: number) =>
    lines.push({ id, text, priority });

  if (!s.hasGoal) {
    add(
      "no-goal",
      "Every journey needs a destination. Name the mountain you intend to climb.",
      100
    );
    return lines;
  }

  /* ── while walking ─────────────────────────────────────────── */
  if (s.isSessionActive) {
    if (s.sessionSeconds >= 90 * 60) {
      add(
        "long-session",
        "You have walked over ninety minutes without pause. Rest is not a retreat — it is what makes tomorrow possible.",
        90
      );
    }
    if (s.remaining <= 0.5) {
      add(
        "almost-there",
        `${minutesLeft(s.remaining)} more and you reach ${round(s.next)} Leagues. Stay with it.`,
        88
      );
    }
    add("walking", "You are walking now. Nothing else needs your attention.", 80);
    add("walking-2", "The hour you are in is the only one you control.", 80);
    return lines.sort((a, b) => b.priority - a.priority);
  }

  /* ── nothing walked yet ────────────────────────────────────── */
  if (s.daysSinceLast === null) {
    add(
      "never-walked",
      "A league is one focused hour. You are one hour from your first.",
      95
    );
    return lines;
  }

  /* ── returning after a gap ─────────────────────────────────── */
  if (s.daysSinceLast >= 14) {
    add(
      "long-absence",
      `${s.daysSinceLast} days among the Lotus Eaters. The sea did not go anywhere, and neither did the ${round(s.leagues)} Leagues already behind you.`,
      70
    );
  } else if (s.daysSinceLast >= 7) {
    add(
      "week-absence",
      "A week becalmed is not a wreck. Put out again today and the wind is yours.",
      65
    );
  } else if (s.daysSinceLast >= 2) {
    add(
      "short-absence",
      `${s.daysSinceLast} days since your last league. The shortest way back to sea is a single hour.`,
      60
    );
  }

  /* ── close to a mark ───────────────────────────────────────── */
  if (s.remaining <= 1) {
    add(
      "near-mark",
      s.nextIsTier
        ? `${round(s.remaining)} Leagues from landfall at ${round(s.next)}. That one is worth the oars.`
        : `${round(s.remaining)} Leagues to ${round(s.next)}. One good crossing away.`,
      s.nextIsTier ? 75 : 55
    );
  }

  /* ── streaks ───────────────────────────────────────────────── */
  if (s.streakDays >= 7) {
    add(
      "long-streak",
      `${s.streakDays} days without breaking stride. This is what mastery looks like from the inside — unremarkable, and daily.`,
      50
    );
  } else if (s.streakDays >= 3) {
    add("streak", `${s.streakDays} days in a row. Do not break the chain today.`, 45);
  }

  if (s.walkedToday) {
    add("walked-today", "Today is already walked. Anything further is surplus.", 40);
  } else if (s.streakDays > 0) {
    add(
      "keep-streak",
      `Your ${s.streakDays}-day streak is intact. One hour keeps it so.`,
      48
    );
  }

  if (s.leaguesPerWeek > 0) {
    add(
      "pace",
      `You are walking ${s.leaguesPerWeek.toFixed(1)} Leagues a week. Steady beats sudden.`,
      30
    );
  }

  /* ── evergreen, so the mentor never runs dry ───────────────── */
  add("evergreen-1", "Focus not on how far you have to go, but on the hour in front of you.", 10);
  add("evergreen-2", "Greatness is merely good practice, repeated past the point of novelty.", 10);
  add("evergreen-3", "You cannot walk a thousand leagues today. You can walk one.", 10);
  add("evergreen-4", "Progress is the simple thing, done again.", 10);

  return lines.sort((a, b) => b.priority - a.priority);
};

/**
 * A stable key for "has the mentor's situation changed?". When it does the
 * widget restarts its rotation, so the most pressing line is seen at once
 * rather than up to fifteen seconds later.
 */
export const situationKey = (lines: MentorLine[]) => lines.map((l) => l.id).join("|");
