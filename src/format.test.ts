import { describe, expect, it } from "vitest";
import { fmt, mmss } from "./format";

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
