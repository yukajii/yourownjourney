import { describe, expect, it } from "vitest";
import { CSV_HEADER, csvCell, exportFilename, toBundle, toCsv } from "./export";
import type { Goal, Log } from "./models";

const goal: Goal = { id: "g1", name: "Learn Japanese", totalTime: 5400, created: 1 };

const log = (over: Partial<Log> = {}): Log => ({
  id: "l1",
  timestamp: Date.UTC(2026, 0, 15, 9, 0),
  durationSec: 3600,
  note: "kanji",
  ...over,
});

describe("csvCell", () => {
  it("leaves plain values unquoted", () => {
    expect(csvCell("kanji")).toBe("kanji");
    expect(csvCell(3600)).toBe("3600");
  });

  it("quotes values containing a comma", () => {
    expect(csvCell("read, then wrote")).toBe('"read, then wrote"');
  });

  it("doubles embedded quotes", () => {
    expect(csvCell('said "hello"')).toBe('"said ""hello"""');
  });

  it("quotes values containing newlines", () => {
    expect(csvCell("line one\nline two")).toBe('"line one\nline two"');
    expect(csvCell("a\r\nb")).toBe('"a\r\nb"');
  });

  it("quotes values with padding so it is not lost", () => {
    expect(csvCell("  indented")).toBe('"  indented"');
  });

  it("handles the empty string", () => {
    expect(csvCell("")).toBe("");
  });
});

describe("toCsv", () => {
  it("writes a header and one row per log", () => {
    const csv = toCsv([goal], { g1: [log(), log({ id: "l2", durationSec: 1800, note: "" })] });
    const lines = csv.trimEnd().split("\r\n");

    expect(lines[0]).toBe(CSV_HEADER.join(","));
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain("Learn Japanese");
    expect(lines[1]).toContain("3600");
  });

  it("keeps a note with a comma inside a single field", () => {
    const csv = toCsv([goal], { g1: [log({ note: "grammar, then reading" })] });
    const row = csv.trimEnd().split("\r\n")[1];

    // Six columns: the note's comma must not create a seventh.
    const fields = row.match(/(".*?"|[^,]*)(,|$)/g)!.filter((f) => f !== "");
    expect(fields).toHaveLength(6);
    expect(row).toContain('"grammar, then reading"');
  });

  it("records duration in both seconds and leagues", () => {
    const csv = toCsv([goal], { g1: [log({ durationSec: 5400 })] });
    expect(csv).toContain("5400,1.5000");
  });

  it("orders logs oldest first", () => {
    const csv = toCsv([goal], {
      g1: [log({ id: "b", timestamp: 2000, note: "second" }), log({ id: "a", timestamp: 1000, note: "first" })],
    });
    const lines = csv.trimEnd().split("\r\n");
    expect(lines[1]).toContain("first");
    expect(lines[2]).toContain("second");
  });

  it("emits just a header when there is nothing walked yet", () => {
    expect(toCsv([], {})).toBe(CSV_HEADER.join(",") + "\r\n");
  });

  it("ends with a line terminator", () => {
    expect(toCsv([goal], { g1: [log()] }).endsWith("\r\n")).toBe(true);
  });
});

describe("toBundle", () => {
  it("nests each goal's logs inside it", () => {
    const bundle = toBundle([goal], { g1: [log()] }, Date.UTC(2026, 6, 27));

    expect(bundle.app).toBe("leagues");
    expect(bundle.exportedAt).toBe("2026-07-27T00:00:00.000Z");
    expect(bundle.goals[0]).toMatchObject({ id: "g1", name: "Learn Japanese" });
    expect(bundle.goals[0].logs).toHaveLength(1);
  });

  it("survives a goal with no logs", () => {
    expect(toBundle([goal], {}).goals[0].logs).toEqual([]);
  });

  it("round-trips through JSON without loss", () => {
    const bundle = toBundle([goal], { g1: [log()] });
    expect(JSON.parse(JSON.stringify(bundle))).toEqual(bundle);
  });
});

describe("exportFilename", () => {
  it("is dated and carries the right extension", () => {
    // Built from local parts, matching the function.
    const at = new Date(2026, 6, 27, 13, 0).getTime();
    expect(exportFilename("json", at)).toBe("leagues-2026-07-27.json");
    expect(exportFilename("csv", at)).toBe("leagues-2026-07-27.csv");
  });
});
