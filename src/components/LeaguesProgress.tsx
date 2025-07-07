import { useGoals } from "../contexts/GoalsContext";

/** Tier ladder (20 → 100 → 1 000 → 10 000 Leagues) */
const TIERS = [20, 100, 1_000, 10_000];

const LeaguesProgress = () => {
  const { current } = useGoals();
  if (!current) return null;

  const leagues = current.totalTime / 3600;
  const nextTier = TIERS.find(t => t > leagues) ?? TIERS[TIERS.length - 1];
  const prevTier =
    TIERS
      .slice()
      .reverse()
      .find(t => t <= leagues) ?? 0;

  const pct =
    nextTier === prevTier
      ? 100
      : ((leagues - prevTier) / (nextTier - prevTier)) * 100;

  return (
    <section className="my-4 p-4 border rounded flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Leagues Progress</h2>

      <div className="w-full h-4 bg-gray-200 rounded overflow-hidden">
        <div
          className="h-full bg-green-600 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="text-sm text-gray-700">
        {leagues.toFixed(1)} / {nextTier} Leagues
      </div>
    </section>
  );
};

export default LeaguesProgress;
