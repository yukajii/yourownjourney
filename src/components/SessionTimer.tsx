import React from "react";
import { useSession } from "../contexts/SessionContext";
import { fmt } from "../format";
import { useGoals } from "../contexts/GoalsContext";
import { useLogWalk } from "../hooks/useLogWalk";
import FootstepStrip from "./FootstepStrip";

const SessionTimer: React.FC = () => {
  const { isActive, seconds, canStart, start, stop } = useSession();
  const { current } = useGoals();
  const logWalk = useLogWalk();

  const leaguesPreview = current ? ((current.totalTime + seconds) / 3600).toFixed(2) : "0.00";

  const handleStop = async () => {
    const stopped = stop();
    if (!stopped) return;
    await logWalk(stopped.durationSec, {
      title: "Session complete",
      goalId: stopped.goalId,
    });
  };

  return (
    <section id="session-timer" className="card flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Current Session</h2>

      <div className="font-mono text-4xl tracking-wide tabular-nums" aria-live="off">
        {fmt(seconds)}
      </div>

      <FootstepStrip running={isActive} width={320} />

      <button
        onClick={isActive ? handleStop : start}
        disabled={!isActive && !canStart}
        className={`btn ${isActive ? "btn-red" : "btn-green"}`}
      >
        {isActive ? "Stop" : "Start"}
      </button>

      <div className="text-sm text-gray-400">
        {canStart
          ? `Leagues walked (preview): ${leaguesPreview}`
          : "Create a goal to start walking."}
      </div>
    </section>
  );
};

export default SessionTimer;
