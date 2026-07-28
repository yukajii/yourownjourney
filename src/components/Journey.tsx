import { useMemo } from "react";
import { useGoals } from "../contexts/GoalsContext";
import { humanDuration } from "../format";
import { currentStreak, heatmapWeeks } from "../journey";

/** Cyan at four strengths, plus an empty cell. Index is HeatCell.level. */
const LEVELS = [
  "bg-white/5",
  "bg-cyan-500/25",
  "bg-cyan-500/45",
  "bg-cyan-400/70",
  "bg-cyan-300",
];

const WEEKS = 26;

const dayLabel = (ms: number) =>
  new Date(ms).toLocaleDateString(undefined, { day: "numeric", month: "short" });

/**
 * The shape of the journey so far: a cell per day, darker the longer that day
 * was walked. A flat progress bar cannot show a fallow month or a good run;
 * this can.
 */
const Journey = () => {
  const { current, logs } = useGoals();

  const grid = useMemo(() => heatmapWeeks(logs, Date.now(), WEEKS), [logs]);
  const streak = useMemo(() => currentStreak(logs), [logs]);

  if (!current) return null;

  const daysWalked = grid.flat().filter((c) => c.seconds > 0).length;

  // Month labels sit above the column in which the month first appears.
  const months = grid.map((week, i) => {
    const first = new Date(week[0].ms);
    const prev = i > 0 ? new Date(grid[i - 1][0].ms) : null;
    return prev && prev.getMonth() === first.getMonth()
      ? null
      : first.toLocaleDateString(undefined, { month: "short" });
  });

  return (
    <section id="journey" className="card flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-lg font-semibold">Journey</h2>
        <span className="text-sm text-gray-400">
          {streak > 0 ? `${streak} day streak` : "No streak yet"}
          {" · "}
          {daysWalked} {daysWalked === 1 ? "day" : "days"} in {WEEKS} weeks
        </span>
      </div>

      {/* Scrolls on a narrow screen rather than squashing the cells. */}
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex flex-col gap-1">
          <div className="flex gap-1">
            {months.map((label, i) => (
              <span
                key={i}
                className="w-3 shrink-0 text-[10px] leading-none text-gray-500"
              >
                {label}
              </span>
            ))}
          </div>

          <div className="flex gap-1">
            {grid.map((week, w) => (
              <div key={w} className="flex flex-col gap-1">
                {week.map((cell) => (
                  <div
                    key={cell.key}
                    title={
                      cell.inFuture
                        ? dayLabel(cell.ms)
                        : `${dayLabel(cell.ms)} — ${
                            cell.seconds > 0 ? humanDuration(cell.seconds) : "nothing walked"
                          }`
                    }
                    className={`h-3 w-3 shrink-0 rounded-sm ${
                      cell.inFuture ? "bg-transparent" : LEVELS[cell.level]
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs text-gray-500">
        <span>Less</span>
        {LEVELS.map((c, i) => (
          <span key={i} className={`h-3 w-3 rounded-sm ${c}`} />
        ))}
        <span>More</span>
      </div>
    </section>
  );
};

export default Journey;
