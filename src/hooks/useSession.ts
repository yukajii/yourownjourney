import { useEffect, useRef, useState } from "react";
import { useGoals } from "../contexts/GoalsContext";

const LS_ACTIVE = "leagues_activeSession";

type ActiveSession = {
  goalId: string;
  startTime: number;          // epoch ms
};

/** Hook that manages a walking session */
export const useSession = () => {
  const { current, pushLog } = useGoals();

  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds]   = useState(0);
  const interval = useRef<number | null>(null);

  /* ------------ start ------------ */
  const start = () => {
    if (!current) return alert("Create a goal first!");
    if (isActive) return;

    const data: ActiveSession = {
      goalId: current.id,
      startTime: Date.now()
    };
    localStorage.setItem(LS_ACTIVE, JSON.stringify(data));

    setIsActive(true);
    setSeconds(0);
    interval.current = window.setInterval(() => {
      setSeconds(Math.floor((Date.now() - data.startTime) / 1000));
    }, 1000);
  };

  /* ------------ stop ------------ */
  const stop = () => {
    if (!isActive) return;
    if (interval.current) clearInterval(interval.current);

    const duration = seconds;
    const note = prompt("What did you accomplish?") ?? "";

    if (duration > 0 && current) pushLog(duration, note);

    localStorage.removeItem(LS_ACTIVE);
    setIsActive(false);
    setSeconds(0);
  };

  /* ------------ auto-resume on load ------------ */
  useEffect(() => {
    const raw = localStorage.getItem(LS_ACTIVE);
    /* wait until goals have loaded */
    if (!raw || !current) return;

    const data = JSON.parse(raw) as ActiveSession;
  if (current.id !== data.goalId) return;   // belongs to another goal
    setIsActive(true);
    setSeconds(Math.floor((Date.now() - data.startTime) / 1000));
    interval.current = window.setInterval(() => {
      setSeconds(Math.floor((Date.now() - data.startTime) / 1000));
    }, 1000);

    return () => {
      if (interval.current) clearInterval(interval.current);
    };
  }, [current?.id]);

  return { isActive, seconds, start, stop };
};

/* helper */
export const fmt = (s: number) => {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
};
