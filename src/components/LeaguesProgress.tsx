import { useGoals } from "../contexts/GoalsContext";
import { useSession } from "../contexts/SessionContext";
import { nextTier, pacePerWeek, projectArrival, waypointProgress } from "../journey";
import Trail from "./Trail";
import { useI18n } from "../i18n";

const arrival = (ms: number, locale: string) =>
  new Date(ms).toLocaleDateString(locale, {
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
  const { t, locale } = useI18n();
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
          <span className="font-display text-2xl font-semibold tabular-nums text-[color:var(--ink)]">
            {leagues.toFixed(2)}
          </span>{" "}
          {t("progress.walked")}
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
          {toIsTier
            ? t("progress.toNextTier", { n: remaining.toFixed(2) })
            : t("progress.toNextWaypoint", { n: remaining.toFixed(2) })}
          {eta && (
            <span className="text-gray-500"> — {t("progress.around", { date: arrival(eta, locale) })}</span>
          )}
        </p>

        {pace > 0 && (
          <p className="text-gray-500">
            {t("progress.pace", { n: pace.toFixed(1) })}
            {tier !== null && !toIsTier && tierEta && (
              <> — {t("progress.tierBy", { tier, date: arrival(tierEta, locale) })}</>
            )}
          </p>
        )}
      </div>
    </div>
  );
};

export default LeaguesProgress;
