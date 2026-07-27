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
