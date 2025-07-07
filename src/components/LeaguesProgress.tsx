import { useGoals } from "../contexts/GoalsContext";
import { useSession } from "../hooks/useSession";
import { TIERS } from "../models";

/** gradient colours */
const BG = "from-cyan-300/20 to-cyan-500/20";
const FG = "from-cyan-400 to-cyan-500";

const LeaguesProgress = () => {
  const { current } = useGoals();
  const { isActive } = useSession();
  if (!current) return null;

  const leagues = current.totalTime / 3600;
  const nextTier = TIERS.find((t) => t > leagues) ?? TIERS.at(-1)!;
  const prevTier = [...TIERS].reverse().find((t) => t <= leagues) ?? 0;
  const pct =
    nextTier === prevTier
      ? 100
      : ((leagues - prevTier) / (nextTier - prevTier)) * 100;

  return (
    <section id="leagues-progress" className="card flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Leagues Progress</h2>

      <div className={`w-full h-4 rounded bg-gradient-to-r ${BG} overflow-hidden`}>
        <div
          style={{ width: `${pct}%` }}
          className={`h-full bg-gradient-to-r ${FG} transition-all ${
            isActive ? "running-pulse" : ""
          }`}
        />
      </div>

      <div className="text-sm text-gray-400">
        {leagues.toFixed(1)} / {nextTier} Leagues
      </div>
    </section>
  );
};

export default LeaguesProgress;
