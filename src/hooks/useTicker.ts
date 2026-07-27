import { useEffect, useRef } from "react";

/**
 * Runs `tick` once a second while `enabled`, and again whenever the page comes
 * back to the foreground.
 *
 * Timers are throttled (mobile) or suspended entirely (screen off, app
 * backgrounded), so an interval that counted its own ticks would fall behind.
 * Every caller therefore derives its value from `Date.now()`; this hook only
 * decides *when* to recompute, never what the value is.
 */
export const useTicker = (enabled: boolean, tick: () => void) => {
  // Keep the latest callback without restarting the interval each render.
  const latest = useRef(tick);
  latest.current = tick;

  useEffect(() => {
    if (!enabled) return;

    const run = () => latest.current();
    run();

    const id = window.setInterval(run, 1000);
    const resync = () => {
      if (!document.hidden) run();
    };

    document.addEventListener("visibilitychange", resync);
    window.addEventListener("focus", resync);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", resync);
      window.removeEventListener("focus", resync);
    };
  }, [enabled]);
};
