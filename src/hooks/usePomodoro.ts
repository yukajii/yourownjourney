import { useEffect, useRef, useState } from "react";

type Phase = "idle" | "focus" | "break";

export const usePomodoro = (
  focusMinutes = 25,
  breakMinutes = 5
) => {
  const [phase, setPhase] = useState<Phase>("idle");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timer = useRef<number | null>(null);

  /* helpers */
  const startTimer = (sec: number, nextPhase: Phase) => {
    setSecondsLeft(sec);
    clearInterval(timer.current!);
    timer.current = window.setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer.current!);
          setPhase(nextPhase);
          return nextPhase === "break"
            ? breakMinutes * 60
            : 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  /* API */
  const startFocus = () => {
    if (phase !== "idle") return;
    setPhase("focus");
    startTimer(focusMinutes * 60, "break");
  };

  const takeBreak = () => {
    if (phase !== "focus") return;
    setPhase("break");
    startTimer(breakMinutes * 60, "idle");
  };

  const backToWork = () => {
    if (phase !== "break") return;
    setPhase("focus");
    startTimer(focusMinutes * 60, "break");
  };

  const stop = () => {
    clearInterval(timer.current!);
    setPhase("idle");
    setSecondsLeft(0);
  };

  /* cleanup on unmount */
  useEffect(() => {
    return () => clearInterval(timer.current!);
  }, []);

  return {
    phase,
    secondsLeft,
    startFocus,
    takeBreak,
    backToWork,
    stop
  };
};

/* pretty time */
export const mmss = (s: number) => {
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};
