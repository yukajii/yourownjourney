import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import mentorImg from "../assets/stoic-mentor.png";
import { useGoals } from "../contexts/GoalsContext";
import { useSession } from "../contexts/SessionContext";
import { useT } from "../i18n";
import { buildSignals, mentorLines, situationKey, type MentorLine } from "../mentor";
import type { Translator } from "../i18n/translate";

/**
 * StoicMentor – a floating widget that delivers concise, pragmatic guidance
 * grounded in classical Stoic thought.
 *
 * • Anchored bottom-right so it never obscures core UI, and it stands down for
 *   the tour and for any prompt sharing that corner.
 * • Speaks to the actual state of the voyage — a streak, an absence, a station
 *   within reach, a session already running — rather than cycling fixed
 *   aphorisms that may contradict it. See src/mentor.ts.
 * • `#stoic-mentor` is spotlighted as the final step of the Intro.js tour.
 */
const ROTATE_MS = 15_000;

/**
 * mentor.ts emits keys, not sentences, so the same logic serves every
 * language. One line nests a translated phrase inside another, which is
 * resolved here rather than in the pure module.
 */
const say = (t: Translator, line: MentorLine): string => {
  if (line.key === "mentor.almostThere") {
    const { timeKey, timeN, next } = line.params ?? {};
    return t("mentor.almostThere", {
      time: t(String(timeKey), { n: Number(timeN) || 0 }),
      next: String(next),
    });
  }
  return t(line.key, line.params);
};

export const StoicMentor = () => {
  const { current, logs, loading } = useGoals();
  const { isActive, seconds } = useSession();
  const t = useT();
  const [index, setIndex] = useState(0);

  /*
   * Rounded down to the minute so a ticking session does not rebuild the line
   * set once a second. Nothing the mentor reacts to changes faster than that.
   */
  const coarseSeconds = Math.floor(seconds / 60) * 60;

  const lines = useMemo(
    () => mentorLines(buildSignals(current, logs, { isActive, seconds: coarseSeconds })),
    [current, logs, isActive, coarseSeconds]
  );

  // When the situation changes, restart at the most pressing line instead of
  // leaving a stale one up for as much as fifteen seconds.
  const key = situationKey(lines);
  const lastKey = useRef(key);
  if (lastKey.current !== key) {
    lastKey.current = key;
    if (index !== 0) setIndex(0);
  }

  useEffect(() => {
    if (lines.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % lines.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [lines.length, key]);

  const line = lines[Math.min(index, lines.length - 1)];
  if (!line) return null;

  /*
   * Nothing until the first read has settled.
   *
   * Goals load before the first paint now, but a signed-in user on a fresh
   * device still waits on the network; rendering then would speak the "name a
   * goal" line and animate a second bubble in when the real data arrived.
   */
  if (loading) return null;

  return (
    <div
      id="stoic-mentor"
      // z-40 keeps the mentor beneath every overlay — modals, the iOS install
      // sheet, the update prompt — rather than floating over them.
      className="fixed bottom-6 right-6 z-40 flex items-center space-x-3 select-none"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={line.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="max-w-xs bg-[color:var(--surface-alt)] border border-white/10 shadow-xl rounded-2xl p-4"
        >
          <p className="text-sm leading-relaxed text-gray-300">{say(t, line)}</p>
        </motion.div>
      </AnimatePresence>

      {/* avatar portrait */}
      <img
        src={mentorImg}
        alt="Stoic mentor avatar"
        className="w-12 h-12 rounded-full object-cover object-top ring-1 ring-white/20 shadow-lg shrink-0"
      />
    </div>
  );
};

export default StoicMentor;
