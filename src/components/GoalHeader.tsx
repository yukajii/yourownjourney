import { useGoals } from "../contexts/GoalsContext";
import { useSession } from "../contexts/SessionContext";
import { tierForSeconds } from "../tiers";

/**
 * Names the goal and the stage of the journey it has reached.
 *
 * The stage is the reward for the long climb between tiers: 20, 100, 1000 and
 * 10000 leagues were previously only numbers on a bar, which is thin thanks for
 * years of work.
 */
const GoalHeader = () => {
  const { current, loading } = useGoals();
  const { isActive, seconds } = useSession();

  if (loading) {
    return <div className="h-9 w-2/3 animate-pulse rounded bg-white/10" aria-hidden />;
  }

  if (!current) {
    return (
      <h1 className="text-2xl font-semibold tracking-tight text-gray-300">
        No goal selected
      </h1>
    );
  }

  const tier = tierForSeconds(current.totalTime + (isActive ? seconds : 0));

  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
        {current.name}
      </h1>
      <p className="flex items-baseline gap-2 text-sm">
        <span className="font-medium text-[color:var(--accent)]">{tier.name}</span>
        <span className="text-gray-500">— {tier.epithet}</span>
      </p>
    </div>
  );
};

export default GoalHeader;
