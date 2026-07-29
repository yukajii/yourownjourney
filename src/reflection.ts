import { humanDuration } from "./format";
import { dayKey } from "./journey";
import { toLeagues } from "./leagues";
import type { Log } from "./models";

/**
 * Reads the user's own notes back to them.
 *
 * The note field has always been write-only — nothing in the app ever looked
 * at it again. This is the one thing a model can do here that the rest of the
 * app cannot: find the threads running through a month of your own words.
 *
 * Everything in this module is pure. The network call lives in the Worker; the
 * prompt, the guards and the parsing are testable without it.
 */

export const REFLECTION_MODEL = "gpt-5.6-luna";

/** Below this there is nothing worth spending a request on. */
export const MIN_NOTES = 3;

export type ReflectionInput = {
  goalName: string;
  from: number;
  to: number;
  logs: Log[];
};

export type Reflection = {
  summary: string;
  themes: string[];
  suggestion: string;
};

export const periodLogs = (logs: Log[], from: number, to: number): Log[] =>
  logs
    .filter((l) => l.timestamp >= from && l.timestamp <= to)
    .sort((a, b) => a.timestamp - b.timestamp);

/** Logs carrying an actual note. An empty note has nothing to reflect on. */
export const notedLogs = (logs: Log[]): Log[] =>
  logs.filter((l) => l.note.trim().length > 0);

export type Readiness =
  | { ready: true }
  /** A translation key and its values, so the reason can be localised. */
  | { ready: false; key: string; params?: Record<string, number> };

/**
 * Whether a reflection is worth asking for. Checked before the request rather
 * than after, so a month with two words in it costs nothing.
 */
export const canReflect = (input: ReflectionInput): Readiness => {
  const noted = notedLogs(periodLogs(input.logs, input.from, input.to));

  if (noted.length === 0) return { ready: false, key: "reflection.noNotes" };
  if (noted.length < MIN_NOTES) {
    return { ready: false, key: "reflection.tooFew", params: { count: noted.length } };
  }
  return { ready: true };
};

/** Keeps a runaway note from dominating the request. */
const MAX_NOTE_CHARS = 600;
export const MAX_LOGS_SENT = 120;

const clip = (s: string) =>
  s.length <= MAX_NOTE_CHARS ? s : `${s.slice(0, MAX_NOTE_CHARS)}…`;

/**
 * The user's notes, oldest first, as dated lines. Only noted sessions are
 * sent — a silent hour tells the model nothing and costs tokens.
 */
export const buildTranscript = (input: ReflectionInput): string => {
  const noted = notedLogs(periodLogs(input.logs, input.from, input.to));
  const recent = noted.slice(-MAX_LOGS_SENT);

  return recent
    .map((l) => `${dayKey(l.timestamp)} (${humanDuration(l.durationSec)}): ${clip(l.note.trim())}`)
    .join("\n");
};

export const buildStats = (input: ReflectionInput) => {
  const inPeriod = periodLogs(input.logs, input.from, input.to);
  const seconds = inPeriod.reduce((t, l) => t + l.durationSec, 0);
  const days = new Set(inPeriod.map((l) => dayKey(l.timestamp))).size;

  return {
    sessions: inPeriod.length,
    daysWalked: days,
    leagues: toLeagues(seconds),
    noted: notedLogs(inPeriod).length,
  };
};

export const SYSTEM_PROMPT = [
  "You are a reflective companion inside a focus-tracking app called Leagues,",
  "where one league is one hour of focused work.",
  "",
  "You will be given a person's own session notes from one period, with dates",
  "and durations. Read them back to them: name the threads that actually run",
  "through the notes, and what appears to have shifted over the period.",
  "",
  "Rules:",
  "- Ground every observation in the notes provided. Do not invent activities,",
  "  feelings or events that are not there.",
  "- If the notes are thin or repetitive, say so plainly rather than padding.",
  "- Address the person as 'you'. Be direct and warm, never fawning.",
  "- No headings, no bullet points, no emoji in the summary.",
  "- Do not congratulate them merely for logging time.",
].join("\n");

export const buildUserPrompt = (input: ReflectionInput): string => {
  const stats = buildStats(input);
  const period = `${dayKey(input.from)} to ${dayKey(input.to)}`;

  return [
    `Goal: ${input.goalName}`,
    `Period: ${period}`,
    `Sessions: ${stats.sessions} across ${stats.daysWalked} days, ${stats.leagues.toFixed(1)} leagues.`,
    "",
    "Notes, oldest first:",
    buildTranscript(input),
  ].join("\n");
};

/** Shape asked of the model, enforced by the API rather than by hope. */
export const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "themes", "suggestion"],
  properties: {
    summary: {
      type: "string",
      description: "Two to four sentences reading the period back to them.",
    },
    themes: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: { type: "string" },
      description: "Short phrases naming threads that recur in the notes.",
    },
    suggestion: {
      type: "string",
      description: "One concrete thing to try next period, drawn from the notes.",
    },
  },
} as const;

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/**
 * Validates what came back. Structured output makes the shape very likely, not
 * certain, and a malformed reply must not reach the UI as `undefined`.
 */
export const parseReflection = (raw: unknown): Reflection | null => {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const summary = str(r.summary);
  const suggestion = str(r.suggestion);
  const themes = Array.isArray(r.themes)
    ? r.themes.map(str).filter((t) => t.length > 0).slice(0, 4)
    : [];

  if (!summary) return null;
  return { summary, themes, suggestion };
};

/** Start of the calendar month containing `ms`, and the moment before the next. */
export const monthBounds = (ms: number): { from: number; to: number } => {
  const d = new Date(ms);
  const from = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  const to = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime() - 1;
  return { from, to };
};

/** The 30 days ending now — the default period offered in the UI. */
export const trailingMonth = (now: number): { from: number; to: number } => ({
  from: now - 30 * 86_400_000,
  to: now,
});
