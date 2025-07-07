import { useGoals } from "../contexts/GoalsContext";

const toLeagues = (sec: number) => (sec / 3600).toFixed(1);

const Logs = () => {
  const { current } = useGoals();
  if (!current) return null;

  const logs = [...current.logs].sort(
    (a, b) => b.timestamp - a.timestamp
  ); // newest first

  return (
    <section className="my-4 p-4 border rounded max-h-64 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-2">Logs</h2>

      {logs.length === 0 && (
        <p className="text-sm text-gray-500">No logs yet. Start walking!</p>
      )}

      {logs.map(l => (
        <p key={l.timestamp} className="text-sm mb-1">
          {new Date(l.timestamp).toLocaleString()} – Walked{" "}
          {toLeagues(l.durationSec)} Leagues
          {l.note && <> – <i>{l.note}</i></>}
        </p>
      ))}
    </section>
  );
};

export default Logs;
