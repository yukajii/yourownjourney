import React from "react";
import { useSession } from "../contexts/SessionContext";
import { fmt } from "../format";
import { useGoals } from "../contexts/GoalsContext";
import { useLogWalk } from "../hooks/useLogWalk";
import FootstepStrip from "./FootstepStrip";
import GoalHeader from "./GoalHeader";
import LeaguesProgress from "./LeaguesProgress";

/**
 * The hero panel: the goal, the clock, and the road ahead.
 *
 * These were three identical cards in a stack of eight, so the thing you
 * actually look at had no more presence than the export buttons. They are one
 * surface now, and the only one carrying real weight.
 */
const SessionTimer: React.FC = () => {
  const { isActive, seconds, canStart, start, stop } = useSession();
  const { current } = useGoals();
  const logWalk = useLogWalk();

  const handleStop = async () => {
    const stopped = stop();
    if (!stopped) return;
    await logWalk(stopped.durationSec, {
      title: "Session complete",
      goalId: stopped.goalId,
    });
  };

  return (
    <section id="session-timer" className="card-hero flex flex-col gap-5">
      <GoalHeader />

      <div className="flex flex-col items-center gap-3">
        <div
          className="font-display text-6xl leading-none tabular-nums sm:text-7xl"
          aria-live="off"
        >
          {fmt(seconds)}
        </div>

        <FootstepStrip running={isActive} width={280} />

        <button
          onClick={isActive ? handleStop : start}
          disabled={!isActive && !canStart}
          className={`btn w-full max-w-xs text-base ${isActive ? "btn-red" : "btn-green"}`}
        >
          {isActive ? "Stop" : "Start walking"}
        </button>

        {!canStart && (
          <p className="text-sm text-gray-500">Create a goal to start walking.</p>
        )}
      </div>

      {current && (
        <>
          <div className="meander" aria-hidden />
          <LeaguesProgress />
        </>
      )}
    </section>
  );
};

export default SessionTimer;
