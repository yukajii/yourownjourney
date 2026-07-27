import { describe, expect, it } from "vitest";
import {
  fmt,
  fromDateTimeInput,
  humanDuration,
  mmss,
  toDateTimeInput,
} from "./format";

describe("fmt", () => {
  it("pads every field to two digits", () => {
    expect(fmt(0)).toBe("00:00:00");
    expect(fmt(9)).toBe("00:00:09");
    expect(fmt(61)).toBe("00:01:01");
  });

  it("rolls minutes into hours", () => {
    expect(fmt(3600)).toBe("01:00:00");
    expect(fmt(3661)).toBe("01:01:01");
  });

  it("lets hours run past two digits rather than wrapping", () => {
    expect(fmt(360_000)).toBe("100:00:00");
  });

  it("floors fractional seconds instead of rendering them", () => {
    expect(fmt(59.9)).toBe("00:00:59");
  });

  it("clamps negatives to zero", () => {
    expect(fmt(-5)).toBe("00:00:00");
  });
});

describe("mmss", () => {
  it("formats under an hour", () => {
    expect(mmss(0)).toBe("00:00");
    expect(mmss(90)).toBe("01:30");
    expect(mmss(1500)).toBe("25:00");
  });

  it("keeps counting minutes past 59 rather than rolling into hours", () => {
    // A 90-minute focus block is legal (settings allow up to 180), and it must
    // not display as 30:00.
    expect(mmss(5400)).toBe("90:00");
  });

  it("clamps negatives to zero", () => {
    expect(mmss(-1)).toBe("00:00");
  });
});

describe("datetime-local round trip", () => {
  it("produces the control's format", () => {
    // Built from local parts, so this holds in whatever zone the test runs in.
    const local = new Date(2026, 2, 9, 7, 5).getTime();
    expect(toDateTimeInput(local)).toBe("2026-03-09T07:05");
  });

  it("survives a round trip to the minute", () => {
    const original = new Date(2026, 6, 27, 14, 30).getTime();
    expect(fromDateTimeInput(toDateTimeInput(original))).toBe(original);
  });

  it("reads back the wall-clock time that was written, not a UTC-shifted one", () => {
    const parsed = fromDateTimeInput("2026-01-15T09:00")!;
    const d = new Date(parsed);
    expect(d.getHours()).toBe(9);
    expect(d.getDate()).toBe(15);
  });

  it("rejects anything the control could not have produced", () => {
    expect(fromDateTimeInput("")).toBeNull();
    expect(fromDateTimeInput("not a date")).toBeNull();
    expect(fromDateTimeInput("2026-01-15")).toBeNull();
    expect(fromDateTimeInput("2026-01-15T09:00:00")).toBeNull();
  });
});

describe("humanDuration", () => {
  it("reads as hours and minutes", () => {
    expect(humanDuration(5400)).toBe("1h 30m");
    expect(humanDuration(3600)).toBe("1h");
    expect(humanDuration(1800)).toBe("30m");
    expect(humanDuration(0)).toBe("0m");
  });
});
