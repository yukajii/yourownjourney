import { useMemo } from "react";
import { useGoals } from "../contexts/GoalsContext";
import { humanDuration } from "../format";
import { currentStreak, heatmapWeeks, type HeatCell } from "../journey";
import { useI18n } from "../i18n";
import type { Translator } from "../i18n/translate";

const WEEKS = 26;

/** Tile size and the grout between them, in px. */
const TILE = 13;
const GROUT = 3;

/**
 * How lit a tile is, by hours walked. Tesserae in a real mosaic are set in a
 * bed of mortar, so an unwalked day is not empty — it is the mortar showing
 * through.
 */
const FILL: Record<HeatCell["level"], string> = {
  0: "color-mix(in srgb, var(--ink) 6%, transparent)",
  1: "color-mix(in srgb, var(--accent) 28%, transparent)",
  2: "color-mix(in srgb, var(--accent) 50%, transparent)",
  3: "color-mix(in srgb, var(--accent) 74%, transparent)",
  4: "var(--accent)",
};

/**
 * A deterministic wobble per tile, from its date.
 *
 * Hand-set tiles are never perfectly square or perfectly aligned, and that
 * irregularity is the whole difference between a mosaic and a spreadsheet.
 * Derived from the day rather than random so a tile does not jump on rerender.
 */
const jitter = (key: string) => {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  const pick = (shift: number, range: number) => ((h >> shift) & 7) / 7 * range - range / 2;
  return {
    dx: pick(0, 1.6),
    dy: pick(3, 1.6),
    rot: pick(6, 7),
    // Slightly uneven tiles read as cut by hand.
    scale: 1 - ((h >> 9) & 3) * 0.035,
  };
};

const dayLabel = (ms: number, locale: string) =>
  new Date(ms).toLocaleDateString(locale, { day: "numeric", month: "short" });

const Tile = ({ cell, t, locale }: { cell: HeatCell; t: Translator; locale: string }) => {
  const { dx, dy, rot, scale } = jitter(cell.key);

  return (
    <div
      title={
        cell.inFuture
          ? dayLabel(cell.ms, locale)
          : `${dayLabel(cell.ms, locale)} — ${
              cell.seconds > 0 ? humanDuration(cell.seconds) : t("journey.nothingWalked")
            }`
      }
      style={{
        width: TILE,
        height: TILE,
        opacity: cell.inFuture ? 0 : 1,
        background: FILL[cell.level],
        transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(${scale})`,
        borderRadius: 2,
        // A hairline of the ground between tiles, like grout catching light.
        boxShadow:
          cell.level > 0
            ? "0 0 0 0.5px color-mix(in srgb, var(--bg) 60%, transparent)"
            : "none",
      }}
      className="shrink-0"
    />
  );
};

/**
 * The shape of the journey so far, as a mosaic: one tessera per day, brighter
 * the longer that day was walked.
 *
 * It was a grid of rounded squares before, which is recognisably GitHub's
 * contribution graph and belonged to a different app entirely.
 */
const Journey = () => {
  const { current, logs } = useGoals();
  const { t, locale } = useI18n();

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
      : first.toLocaleDateString(locale, { month: "short" });
  });

  const column = TILE + GROUT;

  return (
    <section id="journey" className="card flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="section-title">{t("journey.title")}</h2>
        <span className="text-sm text-gray-400">
          {streak > 0 ? t("journey.streak", { count: streak }) : t("journey.noStreak")}
          {" · "}
          {t("journey.daysIn", { count: daysWalked, weeks: WEEKS })}
        </span>
      </div>

      {/* Scrolls on a narrow screen rather than squashing the tiles. */}
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex flex-col gap-1">
          <div className="flex" style={{ gap: GROUT }}>
            {months.map((label, i) => (
              <span
                key={i}
                style={{ width: TILE }}
                className="shrink-0 text-[10px] leading-none text-gray-500"
              >
                {label}
              </span>
            ))}
          </div>

          {/* The bed the tiles are set into. */}
          <div
            className="flex rounded-sm"
            style={{
              gap: GROUT,
              padding: GROUT,
              background: "color-mix(in srgb, var(--bg) 55%, transparent)",
              width: grid.length * column + GROUT,
            }}
          >
            {grid.map((week, w) => (
              <div key={w} className="flex flex-col" style={{ gap: GROUT }}>
                {week.map((cell) => (
                  <Tile key={cell.key} cell={cell} t={t} locale={locale} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <span>{t("journey.less")}</span>
        {([0, 1, 2, 3, 4] as const).map((l) => (
          <span
            key={l}
            style={{ width: 11, height: 11, background: FILL[l], borderRadius: 2 }}
          />
        ))}
        <span>{t("journey.more")}</span>
      </div>
    </section>
  );
};

export default Journey;
