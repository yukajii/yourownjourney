import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import mentorImg from "../assets/stoic-mentor.png";
import { useGoals } from "../contexts/GoalsContext";
import { useSession } from "../contexts/SessionContext";
import { buildSignals, mentorLines, situationKey } from "../mentor";

/**
 * StoicMentor – a floating widget that delivers concise, pragmatic guidance
 * grounded in classical Stoic thought.
 *
 * • Anchored bottom-right so it never obscures core UI.
 * • Speaks to the actual state of the journey — a streak, an absence, a mark
 *   within reach, a session already running — rather than cycling fixed
 *   aphorisms that may contradict it. See src/mentor.ts.
 * • `#stoic-mentor` is spotlighted as the final step of the Intro.js tour.
 */
const ROTATE_MS = 15_000;

export const StoicMentor = () => {
  const { current, logs, loading } = useGoals();
  const { isActive, seconds } = useSession();
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
   * Goals are loaded in an effect, so the first paint has no goal even when
   * one is stored. Rendering then meant speaking the "name a goal" line,
   * immediately recomputing, and — because AnimatePresence keys on the line —
   * animating a second bubble in over the top. It read as the mentor appearing
   * twice.
   */
  if (loading) return null;

  return (
    <div
      id="stoic-mentor"
      className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 select-none"
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
          <p className="text-sm leading-relaxed text-gray-300">{line.text}</p>
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
