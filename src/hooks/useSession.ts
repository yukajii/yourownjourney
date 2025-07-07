import { useEffect, useRef, useState } from 'react';
import { useGoals } from '../contexts/GoalsContext';

export function useSession() {
  const { current, pushLog } = useGoals();
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);      // seconds
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    let id: number | null = null;
    if (running) {
      id = window.setInterval(() => {
        setElapsed(Math.floor((Date.now() - (startRef.current ?? 0)) / 1000));
      }, 1000);
    }
    return () => id && clearInterval(id);
  }, [running]);

  const start = () => {
    if (!current) return;
    startRef.current = Date.now();
    setRunning(true);
    setElapsed(0);
  };

  const stop = (note: string) => {
    if (!current || startRef.current === null) return;
    const durationSec = Math.floor((Date.now() - startRef.current) / 1000);
    pushLog(current.id, durationSec, note);
    setRunning(false);
    setElapsed(0);
    startRef.current = null;
  };

  return { running, elapsed, start, stop };
}