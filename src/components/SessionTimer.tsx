import { useSession, fmt } from "../hooks/useSession";
import { useGoals } from "../contexts/GoalsContext";

const SessionTimer = () => {
  const { isActive, seconds, start, stop } = useSession();
  const { current } = useGoals();

  const leaguesPreview = current
    ? ((current.totalTime + seconds) / 3600).toFixed(1)
    : "0.0";

  return (
    <section className="my-4 p-4 border rounded flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Current Session</h2>

      <div className="text-3xl font-mono">{fmt(seconds)}</div>

      <button
        onClick={isActive ? stop : start}
        className={`p-3 rounded text-white ${
          isActive ? "bg-red-600" : "bg-green-600"
        }`}
      >
        {isActive ? "Stop" : "Start"}
      </button>

      <div className="text-sm text-gray-600">
        Leagues Walked (preview): {leaguesPreview}
      </div>
    </section>
  );
};

export default SessionTimer;
