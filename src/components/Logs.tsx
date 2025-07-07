import { useGoals } from "../contexts/GoalsContext";

const toLeagues = (sec: number) => (sec / 3600).toFixed(1);

const Logs = () => {
  const { current } = useGoals();
  if (!current) return null;

  const logs = [...current.logs].sort(
    (a, b) => b.timestamp - a.timestamp
  ); // newest first

  return (
    <section id="logs-section" className="card flex flex-col gap-3 max-h-72 overflow-y-auto">
      <h2 className="text-lg font-semibold">Logs</h2>

      {logs.length === 0 && (
        <p className="text-sm text-gray-400">No logs yet. Start walking!</p>
      )}

      {logs.map((l) => (
        <div
          key={l.timestamp}
          className="flex justify-between px-3 py-1 text-sm odd:bg-[color:var(--surface-alt)] rounded"
        >
          <span className="font-mono shrink-0 mr-4">
            {new Date(l.timestamp).toLocaleString()}
          </span>
          <span className="flex-1">
            {toLeagues(l.durationSec)} L
            {l.note && (
              <>
                {" "}&ndash; <i className="text-gray-300">{l.note}</i>
              </>
            )}
          </span>
        </div>
      ))}
    </section>
  );
};

export default Logs;
