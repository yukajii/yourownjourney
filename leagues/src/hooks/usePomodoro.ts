import { useEffect, useState } from 'react';

export function usePomodoro(focusMin = 25, breakMin = 5) {
  const [phase, setPhase] = useState<'idle' | 'focus' | 'break'>('idle');
  const [secLeft, setSecLeft] = useState(0);

  useEffect(() => {
    if (phase === 'idle') return;
    const id = window.setInterval(() => {
      setSecLeft(s => {
        if (s <= 1) {
          if (phase === 'focus') {
            setPhase('break');
            return breakMin * 60;
          } else {
            setPhase('idle');
            return 0;
          }
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  const startFocus = () => {
    setPhase('focus');
    setSecLeft(focusMin * 60);
  };
  const startBreak = () => {
    setPhase('break');
    setSecLeft(breakMin * 60);
  };
  const stop = () => setPhase('idle');

  return { phase, secLeft, startFocus, startBreak, stop };
}