import { useGoals } from "../contexts/GoalsContext";
import { useSession } from "../contexts/SessionContext";
import { useT } from "../i18n";
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
  const t = useT();

  if (loading) {
    return <div className="h-9 w-2/3 animate-pulse rounded bg-white/10" aria-hidden />;
  }

  if (!current) {
    return (
      <h1 className="font-display text-2xl font-semibold text-gray-300">
        {t("session.noGoal")}
      </h1>
    );
  }

  const tier = tierForSeconds(current.totalTime + (isActive ? seconds : 0));

  return (
    <div className="flex flex-col gap-1">
      <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
        {current.name}
      </h1>
      <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
        <span className="font-display text-base text-[color:var(--accent)]">
          {t(tier.nameKey)}
        </span>
        <span className="text-gray-500">— {t(tier.epithetKey)}</span>
      </p>
    </div>
  );
};

export default GoalHeader;
