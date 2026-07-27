import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import mentorImg from "../assets/stoic-mentor.png";

/**
 * StoicMentor – a floating widget that delivers concise, pragmatic guidance
 * grounded in classical Stoic thought.
 *
 * • Anchored bottom‑right so it never obscures core UI.
 * • Cycles through short quotes / nudges every 15 s.
 * • Uses Tailwind + your CSS vars (surface, accent, etc.) so theme is inherited.
 * • `#stoic-mentor` is spotlighted as the final step of the Intro.js tour.
 */

const sayings = [
  "Focus not on how far you have to go, but on the hour you dedicate right now.",
  "Greatness is merely good practice, repeated daily.",
  "Mastery is built moment‑by‑moment; keep building.",
  "Progress comes from doing the simple things consistently.",
  "Reflect on your progress and recommit to the path ahead.",
  "Missed a session? That is past. Choose consistency today.",
  "Consistency breeds excellence. Pause briefly, then continue forward."
];

export const StoicMentor = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex(i => (i + 1) % sayings.length), 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      id="stoic-mentor"
      className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 select-none"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="max-w-xs bg-[color:var(--surface-alt)] border border-white/10 shadow-xl rounded-2xl p-4"
        >
          <p className="text-sm leading-relaxed text-gray-300">{sayings[index]}</p>
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
