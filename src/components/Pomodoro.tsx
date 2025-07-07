import { usePomodoro, mmss } from "../hooks/usePomodoro";

const Pomodoro = () => {
  const {
    phase,
    secondsLeft,
    startFocus,
    takeBreak,
    backToWork,
    stop
  } = usePomodoro();

  return (
    <section className="my-4 p-4 border rounded flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Pomodoro</h2>

      <div className="text-xl font-mono">
        {phase === "idle" ? "25:00" : mmss(secondsLeft)}
      </div>

      <div className="flex flex-wrap gap-2">
        {phase === "idle" && (
          <button
            onClick={startFocus}
            className="flex-1 bg-green-600 text-white rounded p-2"
          >
            Start Focus
          </button>
        )}

        {phase === "focus" && (
          <>
            <button
              onClick={takeBreak}
              className="flex-1 bg-blue-600 text-white rounded p-2"
            >
              Take Break
            </button>
            <button
              onClick={stop}
              className="flex-1 bg-red-600 text-white rounded p-2"
            >
              Stop
            </button>
          </>
        )}

        {phase === "break" && (
          <>
            <button
              onClick={backToWork}
              className="flex-1 bg-green-600 text-white rounded p-2"
            >
              Back to Work
            </button>
            <button
              onClick={stop}
              className="flex-1 bg-red-600 text-white rounded p-2"
            >
              Stop
            </button>
          </>
        )}
      </div>

      <div className="text-sm text-gray-600 capitalize">State: {phase}</div>
    </section>
  );
};

export default Pomodoro;
