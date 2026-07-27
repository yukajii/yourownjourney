import { useGoals } from "../contexts/GoalsContext";
import { useSession } from "../contexts/SessionContext";
import { TIERS } from "../models";

/** gradient colours */
const BG = "from-cyan-300/20 to-cyan-500/20";
const FG = "from-cyan-400 to-cyan-500";

const LeaguesProgress = () => {
  const { current } = useGoals();
  const { isActive, seconds } = useSession();
  if (!current) return null;

  // Count the running session so the bar advances live.
  const leagues = (current.totalTime + (isActive ? seconds : 0)) / 3600;
  const nextTier = TIERS.find((t) => t > leagues) ?? TIERS.at(-1)!;
  const prevTier = [...TIERS].reverse().find((t) => t <= leagues) ?? 0;
  const pct =
    nextTier <= prevTier ? 100 : ((leagues - prevTier) / (nextTier - prevTier)) * 100;

  return (
    <section id="leagues-progress" className="card flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Leagues Progress</h2>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-label={`Progress toward ${nextTier} leagues`}
        className={`h-4 w-full overflow-hidden rounded bg-gradient-to-r ${BG}`}
      >
        <div
          style={{ width: `${Math.min(100, pct)}%` }}
          className={`h-full bg-gradient-to-r ${FG} transition-all ${
            isActive ? "running-pulse" : ""
          }`}
        />
      </div>

      <div className="text-sm text-gray-400">
        {leagues.toFixed(2)} / {nextTier} Leagues
      </div>
    </section>
  );
};

export default LeaguesProgress;
