import { useGoals } from "../contexts/GoalsContext";
import { fmt } from "../format";

const when = (ts: number) =>
  new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const Logs = () => {
  const { current, logs } = useGoals();
  if (!current) return null;

  return (
    <section id="logs-section" className="card flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Logs</h2>
        <span className="text-sm text-gray-400">
          {(current.totalTime / 3600).toFixed(2)} L total
        </span>
      </div>

      {logs.length === 0 ? (
        <p className="text-sm text-gray-400">No logs yet. Start walking!</p>
      ) : (
        <ol className="-mx-1 max-h-72 space-y-1 overflow-y-auto">
          {logs.map((l) => (
            <li
              key={l.id}
              className="rounded px-3 py-1.5 text-sm odd:bg-[color:var(--surface-alt)]"
            >
              <div className="flex justify-between gap-3">
                <span className="shrink-0 font-mono text-gray-400">{when(l.timestamp)}</span>
                <span className="shrink-0 font-mono tabular-nums">
                  {fmt(l.durationSec)}
                  <span className="ml-2 text-[color:var(--accent)]">
                    {(l.durationSec / 3600).toFixed(2)} L
                  </span>
                </span>
              </div>
              {l.note && <p className="mt-0.5 italic text-gray-300">{l.note}</p>}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};

export default Logs;
