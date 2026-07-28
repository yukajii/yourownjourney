import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { catchUp, clampMinutes, focusElapsedSec, type PomoState } from "./usePomodoro";

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

const IDLE: PomoState = { phase: "idle", startedAt: 0, endsAt: 0 };

/** A 25-minute focus block ending at `endsAt`. */
const focus = (endsAt: number): PomoState => ({
  phase: "focus",
  startedAt: endsAt - 25 * MIN,
  endsAt,
});

const brk = (endsAt: number): PomoState => ({
  phase: "break",
  startedAt: endsAt - BREAK,
  endsAt,
});

describe("catchUp", () => {
  it("leaves a phase that has not expired alone", () => {
    expect(catchUp(focus(NOW + MIN), BREAK)).toEqual(focus(NOW + MIN));
    expect(catchUp(brk(NOW + MIN), BREAK)).toEqual(brk(NOW + MIN));
  });

  it("rolls an expired focus into the break that should have followed it", () => {
    // Focus ended a minute ago, so four minutes of break remain. The break is
    // dated from the focus's deadline, not from now.
    expect(catchUp(focus(NOW - MIN), BREAK)).toEqual({
      phase: "break",
      startedAt: NOW - MIN,
      endsAt: NOW - MIN + BREAK,
    });
  });

  it("goes idle once the trailing break has also expired", () => {
    // Closed during focus and reopened an hour later: both phases are long gone.
    expect(catchUp(focus(NOW - 60 * MIN), BREAK)).toEqual(IDLE);
  });

  it("goes idle from an expired break", () => {
    expect(catchUp(brk(NOW - 1), BREAK)).toEqual(IDLE);
  });

  it("treats a deadline exactly now as expired", () => {
    expect(catchUp(brk(NOW), BREAK)).toEqual(IDLE);
  });

  it("terminates rather than looping when the break length is zero", () => {
    // A zero-length break can never move the deadline forward, so the replay
    // has to fall through to idle instead of spinning.
    expect(catchUp(focus(NOW - MIN), 0)).toEqual(IDLE);
  });
});

describe("focusElapsedSec", () => {
  it("measures a block cut short at the moment it was cut", () => {
    // Ten minutes into a twenty-five minute block.
    const state = focus(NOW + 15 * MIN);
    expect(focusElapsedSec(state, NOW)).toBe(10 * 60);
  });

  it("credits the whole block when it runs to its deadline", () => {
    const state = focus(NOW);
    expect(focusElapsedSec(state, NOW)).toBe(25 * 60);
  });

  it("never counts past the deadline", () => {
    // The ticker can fire late, and a phase left open while the tab slept must
    // not award time the block never had.
    const state = focus(NOW - 30 * MIN);
    expect(focusElapsedSec(state, NOW)).toBe(25 * 60);
  });

  it("is zero outside a focus phase", () => {
    expect(focusElapsedSec(brk(NOW + MIN), NOW)).toBe(0);
    expect(focusElapsedSec(IDLE, NOW)).toBe(0);
  });

  it("is zero at the instant a block starts", () => {
    expect(focusElapsedSec(focus(NOW + 25 * MIN), NOW)).toBe(0);
  });

  it("never returns a negative for a state from the future", () => {
    const state: PomoState = { phase: "focus", startedAt: NOW + MIN, endsAt: NOW + 26 * MIN };
    expect(focusElapsedSec(state, NOW)).toBe(0);
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
