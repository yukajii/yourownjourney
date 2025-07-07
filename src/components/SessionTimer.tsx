import React from "react";
import { useSession, fmt } from "../hooks/useSession";
import { useGoals } from "../contexts/GoalsContext";
import FootstepStrip from "./FootstepStrip";

const SessionTimer: React.FC = () => {
  const { isActive, seconds, start, stop } = useSession();
  const { current } = useGoals();

  const leaguesPreview = current
    ? ((current.totalTime + seconds) / 3600).toFixed(1)
    : "0.0";

  return (
    <section id="session-timer" className="card flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Current Session</h2>

      <div className="text-4xl font-mono tracking-wide">{fmt(seconds)}</div>

      <FootstepStrip running={isActive} width={320} />

      <button
        onClick={isActive ? stop : start}
        className={`btn ${isActive ? "btn-red" : "btn-green"}`}
      >
        {isActive ? "Stop" : "Start"}
      </button>

      <div className="text-sm text-gray-400">
        Leagues Walked (preview): {leaguesPreview}
      </div>
    </section>
  );
};

export default SessionTimer;
