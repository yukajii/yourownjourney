import React from "react";
import { useSession } from "../contexts/SessionContext";
import { fmt } from "../format";
import { useGoals } from "../contexts/GoalsContext";
import { useModal } from "../modals/ModalProvider";
import FootstepStrip from "./FootstepStrip";

const SessionTimer: React.FC = () => {
  const { isActive, seconds, canStart, start, stop } = useSession();
  const { current, pushLog } = useGoals();
  const { prompt } = useModal();

  const leaguesPreview = current ? ((current.totalTime + seconds) / 3600).toFixed(2) : "0.00";

  const handleStop = async () => {
    const stopped = stop();
    if (!stopped) return;

    const note = await prompt({
      title: "Session complete",
      label: `${fmt(stopped.durationSec)} — what did you accomplish?`,
      placeholder: "Optional",
      confirmLabel: "Log it",
      multiline: true,
      allowEmpty: true,
    });

    // Dismissing the note must not throw the walked time away.
    pushLog(stopped.durationSec, note ?? "", stopped.goalId);
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
