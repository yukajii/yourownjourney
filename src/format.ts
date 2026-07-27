/**
 * Duration formatters. They live apart from the timer contexts so that tests —
 * and any future non-React consumer — can reach them without pulling in
 * Firebase.
 */

const pad = (n: number) => Math.floor(n).toString().padStart(2, "0");

/** hh:mm:ss */
export const fmt = (s: number) => {
  const safe = Math.max(0, Math.floor(s));
  return `${pad(safe / 3600)}:${pad((safe % 3600) / 60)}:${pad(safe % 60)}`;
};

/** mm:ss — minutes keep counting past 59 rather than rolling into hours. */
export const mmss = (s: number) => {
  const safe = Math.max(0, Math.floor(s));
  return `${pad(safe / 60)}:${pad(safe % 60)}`;
};

/* ───────────── <input type="datetime-local"> ─────────────
 *
 * The control speaks local wall-clock time with no zone attached, so both
 * directions go through the Date's local getters. Building the string from
 * toISOString() instead would silently shift every entry by the UTC offset.
 */

export const toDateTimeInput = (ms: number) => {
  const d = new Date(ms);
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
};

/** Returns null for a value the control could not produce. */
export const fromDateTimeInput = (value: string): number | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const [, y, mo, d, h, mi] = match.map(Number);
  const ms = new Date(y, mo - 1, d, h, mi).getTime();
  return Number.isFinite(ms) ? ms : null;
};

/** "1h 30m", for showing a duration outside a running clock. */
export const humanDuration = (seconds: number) => {
  const safe = Math.max(0, Math.round(seconds));
  const h = Math.floor(safe / 3600);
  const m = Math.round((safe % 3600) / 60);
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
};
