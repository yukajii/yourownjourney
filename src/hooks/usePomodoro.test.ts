import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { catchUp, clampMinutes, type PomoState } from "./usePomodoro";

const MIN = 60_000;
const BREAK = 5 * MIN;
const NOW = new Date("2026-01-01T12:00:00Z").getTime();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("catchUp", () => {
  const focus = (endsAt: number): PomoState => ({ phase: "focus", endsAt });
  const brk = (endsAt: number): PomoState => ({ phase: "break", endsAt });

  it("leaves a phase that has not expired alone", () => {
    expect(catchUp(focus(NOW + MIN), BREAK)).toEqual(focus(NOW + MIN));
    expect(catchUp(brk(NOW + MIN), BREAK)).toEqual(brk(NOW + MIN));
  });

  it("rolls an expired focus into the break that should have followed it", () => {
    // Focus ended a minute ago, so four minutes of break remain.
    expect(catchUp(focus(NOW - MIN), BREAK)).toEqual(brk(NOW - MIN + BREAK));
  });

  it("goes idle once the trailing break has also expired", () => {
    // Closed during focus and reopened an hour later: both phases are long gone.
    expect(catchUp(focus(NOW - 60 * MIN), BREAK)).toEqual({ phase: "idle", endsAt: 0 });
  });

  it("goes idle from an expired break", () => {
    expect(catchUp(brk(NOW - 1), BREAK)).toEqual({ phase: "idle", endsAt: 0 });
  });

  it("treats a deadline exactly now as expired", () => {
    expect(catchUp(brk(NOW), BREAK)).toEqual({ phase: "idle", endsAt: 0 });
  });

  it("terminates rather than looping when the break length is zero", () => {
    // A zero-length break can never move the deadline forward, so the replay
    // has to fall through to idle instead of spinning.
    expect(catchUp(focus(NOW - MIN), 0)).toEqual({ phase: "idle", endsAt: 0 });
  });
});

describe("clampMinutes", () => {
  it("keeps sane values", () => {
    expect(clampMinutes(25, 25)).toBe(25);
    expect(clampMinutes(1, 25)).toBe(1);
    expect(clampMinutes(180, 25)).toBe(180);
  });

  it("clamps to the 1–180 range", () => {
    expect(clampMinutes(0, 25)).toBe(1);
    expect(clampMinutes(-10, 25)).toBe(1);
    expect(clampMinutes(999, 25)).toBe(180);
  });

  it("rounds fractions", () => {
    expect(clampMinutes(24.6, 25)).toBe(25);
  });

  it("falls back on anything that is not a finite number", () => {
    expect(clampMinutes("25", 25)).toBe(25);
    expect(clampMinutes(NaN, 30)).toBe(30);
    expect(clampMinutes(Infinity, 30)).toBe(30);
    expect(clampMinutes(undefined, 30)).toBe(30);
    expect(clampMinutes(null, 30)).toBe(30);
  });
});
