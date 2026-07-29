import { useGoals } from "../contexts/GoalsContext";
import { useSession } from "../contexts/SessionContext";
import { nextTier, pacePerWeek, projectArrival, waypointProgress } from "../journey";
import Trail from "./Trail";

const arrival = (ms: number) =>
  new Date(ms).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: new Date(ms).getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });

const round = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

/**
 * The road between the last mark and the next. Lives inside the hero panel
 * rather than in a card of its own — it is part of the walk, not a report on it.
 */
const LeaguesProgress = () => {
  const { current, logs } = useGoals();
  const { isActive, seconds } = useSession();
  if (!current) return null;

  // Count the running session so the trail advances live.
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
    <div id="leagues-progress" className="flex flex-col gap-2 border-t border-white/[0.07] pt-5">
      <div className="flex items-baseline justify-between font-mono text-xs text-gray-500">
        <span>{round(from)}</span>
        <span className="text-gray-300">
          <span className="text-lg font-semibold tabular-nums text-gray-100">
            {leagues.toFixed(2)}
          </span>{" "}
          Leagues walked
        </span>
        <span>{round(to)}</span>
      </div>

      <Trail
        pct={pct}
        toIsTier={toIsTier}
        walking={isActive}
        label={`Progress toward ${to} leagues`}
      />

      <div className="flex flex-col gap-1 text-sm">
        <p className="text-gray-400">
          {remaining.toFixed(2)} to {toIsTier ? "the next tier" : "the next waypoint"}
          {eta && <span className="text-gray-500"> — around {arrival(eta)}</span>}
        </p>

        {pace > 0 && (
          <p className="text-gray-500">
            {pace.toFixed(1)} Leagues a week
            {tier !== null && !toIsTier && tierEta && (
              <> — {tier} Leagues by {arrival(tierEta)}</>
            )}
          </p>
        )}
      </div>
    </div>
  );
};

export default LeaguesProgress;
