import { useGoals } from "../contexts/GoalsContext";
import { useSession } from "../contexts/SessionContext";
import { nextTier, pacePerWeek, projectArrival, waypointProgress } from "../journey";

/** gradient colours */
const BG = "from-cyan-300/20 to-cyan-500/20";
const FG = "from-cyan-400 to-cyan-500";

const arrival = (ms: number) =>
  new Date(ms).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: new Date(ms).getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });

const round = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

const LeaguesProgress = () => {
  const { current, logs } = useGoals();
  const { isActive, seconds } = useSession();
  if (!current) return null;

  // Count the running session so the bar advances live.
  const { leagues, from, to, pct, toIsTier, remaining } = waypointProgress(
    current.totalTime + (isActive ? seconds : 0)
  );

  const pace = pacePerWeek(logs);
  const eta = projectArrival(remaining, pace);

  // The waypoint is the near horizon; the tier is still the frame of the whole
  // journey, so it stays on screen even when it is a long way off.
  const tier = nextTier(leagues);
  const tierEta = tier === null ? null : projectArrival(tier - leagues, pace);

  return (
    <section id="leagues-progress" className="card flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">Leagues Progress</h2>
        <span className="font-mono text-sm text-gray-400">
          {round(from)} → {round(to)}
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-label={`Progress toward ${to} leagues`}
        className={`h-4 w-full overflow-hidden rounded bg-gradient-to-r ${BG}`}
      >
        <div
          style={{ width: `${pct}%` }}
          className={`h-full bg-gradient-to-r ${FG} transition-all ${
            isActive ? "running-pulse" : ""
          }`}
        />
      </div>

      <div className="flex flex-col gap-1 text-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="text-gray-300">
            {leagues.toFixed(2)} Leagues walked
          </span>
          <span className="text-gray-400">
            {remaining.toFixed(2)} to {toIsTier ? "the next tier" : "the next waypoint"}
          </span>
        </div>

        {pace > 0 && (
          <p className="text-gray-500">
            {pace.toFixed(1)} Leagues a week
            {eta && ` — ${round(to)} by ${arrival(eta)}`}
          </p>
        )}

        {tier !== null && !toIsTier && (
          <p className="text-gray-500">
            Next tier: {tier} Leagues
            {tierEta && ` — around ${arrival(tierEta)}`}
          </p>
        )}
      </div>
    </section>
  );
};

export default LeaguesProgress;
