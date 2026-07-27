import { SCHEMA_VERSION, type Goal, type Log } from "./models";
import { toLeagues } from "./leagues";

export type ExportBundle = {
  app: "leagues";
  schemaVersion: number;
  exportedAt: string;
  goals: (Goal & { logs: Log[] })[];
};

const byTime = (a: Log, b: Log) => a.timestamp - b.timestamp;

/**
 * The whole journey in one object. Logs are nested inside their goal so the
 * file stands on its own and reads sensibly by hand.
 */
export const toBundle = (
  goals: Goal[],
  logsByGoal: Record<string, Log[]>,
  now = Date.now()
): ExportBundle => ({
  app: "leagues",
  schemaVersion: SCHEMA_VERSION,
  exportedAt: new Date(now).toISOString(),
  goals: goals.map((g) => ({ ...g, logs: [...(logsByGoal[g.id] ?? [])].sort(byTime) })),
});

/**
 * RFC 4180 quoting. Notes are free text, so commas, quotes and newlines all
 * turn up in them; without this a single note with a comma silently shifts
 * every column after it.
 */
export const csvCell = (value: string | number): string => {
  const s = String(value);
  if (!/[",\r\n]/.test(s) && s.trim() === s) return s;
  return `"${s.replace(/"/g, '""')}"`;
};

export const CSV_HEADER = [
  "goal",
  "goal_id",
  "logged_at_iso",
  "duration_seconds",
  "leagues",
  "note",
] as const;

/** One row per log, oldest first, grouped by goal. */
export const toCsv = (goals: Goal[], logsByGoal: Record<string, Log[]>): string => {
  const rows: string[] = [CSV_HEADER.join(",")];

  for (const goal of goals) {
    for (const log of [...(logsByGoal[goal.id] ?? [])].sort(byTime)) {
      rows.push(
        [
          csvCell(goal.name),
          csvCell(goal.id),
          csvCell(new Date(log.timestamp).toISOString()),
          csvCell(log.durationSec),
          csvCell(toLeagues(log.durationSec).toFixed(4)),
          csvCell(log.note),
        ].join(",")
      );
    }
  }

  // Trailing newline: POSIX tools expect a final line terminator.
  return rows.join("\r\n") + "\r\n";
};

export const exportFilename = (extension: "json" | "csv", now = Date.now()) => {
  const d = new Date(now);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `leagues-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.${extension}`;
};

/**
 * Hands the file to the browser. The BOM is there for Excel, which otherwise
 * reads a UTF-8 CSV as the system codepage and mangles any note that is not
 * plain ASCII.
 */
export const download = (contents: string, filename: string, mime: string): void => {
  // Written as an escape, not a literal: a bare U+FEFF is invisible in the
  // source and one stray reformat would silently drop it.
  const bom = mime.startsWith("text/csv") ? "\uFEFF" : "";
  const url = URL.createObjectURL(new Blob([bom + contents], { type: `${mime};charset=utf-8` }));

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  // Revoking immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
};
