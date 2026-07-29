import { useState } from "react";
import { usePomodoro } from "../hooks/usePomodoro";
import { mmss } from "../format";
import { useGoals } from "../contexts/GoalsContext";
import { useSession } from "../contexts/SessionContext";
import { useLogWalk } from "../hooks/useLogWalk";
import { useT } from "../i18n";

const PHASE_KEY = {
  idle: "pomodoro.idle",
  focus: "pomodoro.focusing",
  break: "pomodoro.onBreak",
} as const;

const Pomodoro = () => {
  const { current } = useGoals();
  const { isActive } = useSession();
  const logWalk = useLogWalk();
  const t = useT();
  const [showSettings, setShowSettings] = useState(false);

  const { phase, secondsLeft, settings, setSettings, startFocus, takeBreak, backToWork, stop } =
    usePomodoro({
      onFocusEnded: (elapsedSec) => {
        // A pomodoro is a way of walking, so focus time counts as leagues.
        //
        // Except while the session timer is already running: it is measuring
        // the same minutes, and logging both would count that hour twice.
        if (!settings.linkSessions || !current || isActive) return;
        void logWalk(elapsedSec, { title: t("pomodoro.blockComplete") });
      },
    });

  const numberField =
    "w-20 rounded border border-white/10 bg-[color:var(--surface-alt)] p-1 text-gray-100 focus:outline-none";

  return (
    <section id="pomodoro-section" className="card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="section-title">{t("pomodoro.title")}</h2>
        <button
          onClick={() => setShowSettings((s) => !s)}
          aria-expanded={showSettings}
          aria-label={t("pomodoro.settings")}
          className="btn btn-outline px-2 py-1 text-sm"
        >
          ⚙️
        </button>
      </div>

      <div className="font-display text-4xl tabular-nums" aria-live="polite">
        {mmss(secondsLeft)}
      </div>

      {showSettings && (
        <div className="flex flex-wrap gap-4 rounded border border-white/10 p-3 text-sm">
          <label className="flex items-center gap-2">
            {t("pomodoro.focusLabel")}
            <input
              type="number"
              min={1}
              max={180}
              value={settings.pomodoroMinutes}
              onChange={(e) =>
                setSettings({ ...settings, pomodoroMinutes: Number(e.target.value) })
              }
              className={numberField}
            />
            {t("pomodoro.minutes")}
          </label>
          <label className="flex items-center gap-2">
            {t("pomodoro.breakLabel")}
            <input
              type="number"
              min={1}
              max={180}
              value={settings.breakMinutes}
              onChange={(e) => setSettings({ ...settings, breakMinutes: Number(e.target.value) })}
              className={numberField}
            />
            {t("pomodoro.minutes")}
          </label>

          <label className="flex w-full items-start gap-2">
            <input
              type="checkbox"
              checked={settings.linkSessions}
              onChange={(e) => setSettings({ ...settings, linkSessions: e.target.checked })}
              className="mt-0.5"
            />
            <span>
              {t("pomodoro.countAsLeagues")}
              <span className="block text-xs text-gray-500">
                {t("pomodoro.countAsLeaguesHelp")}
              </span>
            </span>
          </label>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {phase === "idle" && (
          <button onClick={startFocus} className="btn btn-green flex-1">
            {t("pomodoro.startFocus")}
          </button>
        )}

        {phase === "focus" && (
          <>
            <button onClick={takeBreak} className="btn btn-blue flex-1">
              {t("pomodoro.takeBreak")}
            </button>
            <button onClick={stop} className="btn btn-red flex-1">
              {t("pomodoro.stop")}
            </button>
          </>
        )}

        {phase === "break" && (
          <>
            <button onClick={backToWork} className="btn btn-green flex-1">
              {t("pomodoro.backToWork")}
            </button>
            <button onClick={stop} className="btn btn-red flex-1">
              {t("pomodoro.stop")}
            </button>
          </>
        )}
      </div>

      <div className="text-sm text-gray-400">{t(PHASE_KEY[phase])}</div>
    </section>
  );
};

export default Pomodoro;
