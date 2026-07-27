import { useState } from "react";
import { fromDateTimeInput, toDateTimeInput } from "../format";
import type { Log } from "../models";

export type LogDraft = { timestamp: number; durationSec: number; note: string };

const field =
  "w-full rounded-md border border-white/10 bg-[color:var(--surface-alt)] p-2 " +
  "text-gray-100 placeholder:text-gray-500 focus:border-[color:var(--accent)] focus:outline-none";

/**
 * Collects a log by hand — either time that was never timed, or a correction
 * to an entry already walked.
 *
 * Duration is split into hours and minutes rather than asked for as a single
 * number: "1h 45m" is how the time was actually experienced, and it removes
 * the question of whether the field wants minutes or seconds.
 */
const LogEditor = ({
  existing,
  done,
}: {
  existing?: Log;
  done: (draft: LogDraft | null) => void;
}) => {
  const [when, setWhen] = useState(() => toDateTimeInput(existing?.timestamp ?? Date.now()));
  const [hours, setHours] = useState(() =>
    existing ? String(Math.floor(existing.durationSec / 3600)) : "1"
  );
  const [minutes, setMinutes] = useState(() =>
    existing ? String(Math.round((existing.durationSec % 3600) / 60)) : "0"
  );
  const [note, setNote] = useState(existing?.note ?? "");

  const timestamp = fromDateTimeInput(when);
  const durationSec =
    (Math.max(0, Math.floor(Number(hours) || 0)) * 3600) +
    (Math.max(0, Math.floor(Number(minutes) || 0)) * 60);

  const inFuture = timestamp !== null && timestamp > Date.now();
  const canSubmit = timestamp !== null && durationSec > 0 && !inFuture;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) done({ timestamp: timestamp!, durationSec, note: note.trim() });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-lg font-semibold">
        {existing ? "Edit entry" : "Add walked time"}
      </h2>
      {!existing && (
        <p className="text-sm text-gray-400">
          For a stretch of focused work you did not time.
        </p>
      )}

      <label className="block space-y-1">
        <span className="text-sm text-gray-400">When</span>
        <input
          type="datetime-local"
          value={when}
          max={toDateTimeInput(Date.now())}
          onChange={(e) => setWhen(e.target.value)}
          className={field}
        />
      </label>

      <fieldset className="space-y-1">
        <legend className="text-sm text-gray-400">How long</legend>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={24}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            aria-label="Hours"
            className={`${field} w-20`}
          />
          <span className="text-sm text-gray-400">h</span>
          <input
            type="number"
            min={0}
            max={59}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            aria-label="Minutes"
            className={`${field} w-20`}
          />
          <span className="text-sm text-gray-400">m</span>
        </div>
      </fieldset>

      <label className="block space-y-1">
        <span className="text-sm text-gray-400">What did you accomplish?</span>
        <textarea
          rows={3}
          value={note}
          placeholder="Optional"
          onChange={(e) => setNote(e.target.value)}
          className={field}
        />
      </label>

      {inFuture && (
        <p className="text-sm text-red-400">You cannot log a walk you have not taken yet.</p>
      )}
      {!inFuture && durationSec === 0 && (
        <p className="text-sm text-gray-500">Set a duration to save.</p>
      )}

      <div className="flex gap-2">
        <button type="button" onClick={() => done(null)} className="btn btn-outline flex-1">
          Cancel
        </button>
        <button type="submit" disabled={!canSubmit} className="btn btn-green flex-1">
          {existing ? "Save" : "Add"}
        </button>
      </div>
    </form>
  );
};

export default LogEditor;
