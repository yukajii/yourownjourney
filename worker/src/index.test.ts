import { beforeEach, describe, expect, it } from "vitest";
import { countAndCheck } from "./index";

/** Enough of KV to exercise the counter. */
class FakeKV {
  store = new Map<string, string>();
  puts = 0;

  async get(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  async put(key: string, value: string) {
    this.puts++;
    this.store.set(key, value);
  }
}

let kv: FakeKV;
beforeEach(() => {
  kv = new FakeKV();
});

describe("countAndCheck", () => {
  it("allows the first request and starts the count", async () => {
    expect(await countAndCheck(kv, "u:a:2026-07-29", 5)).toEqual({ allowed: true, used: 1 });
  });

  it("allows exactly up to the limit, then refuses", async () => {
    const results = [];
    for (let i = 0; i < 7; i++) {
      results.push((await countAndCheck(kv, "u:a:2026-07-29", 5)).allowed);
    }
    // Five through, the rest turned away.
    expect(results).toEqual([true, true, true, true, true, false, false]);
  });

  it("stops writing once the cap is hit", async () => {
    for (let i = 0; i < 5; i++) await countAndCheck(kv, "u:a:2026-07-29", 5);
    const putsAtCap = kv.puts;

    await countAndCheck(kv, "u:a:2026-07-29", 5);
    await countAndCheck(kv, "u:a:2026-07-29", 5);

    // A refused request must not burn a KV write, or an attacker could exhaust
    // the daily write quota just by hammering a capped key.
    expect(kv.puts).toBe(putsAtCap);
  });

  it("counts each user separately", async () => {
    for (let i = 0; i < 5; i++) await countAndCheck(kv, "u:a:2026-07-29", 5);

    expect((await countAndCheck(kv, "u:a:2026-07-29", 5)).allowed).toBe(false);
    expect((await countAndCheck(kv, "u:b:2026-07-29", 5)).allowed).toBe(true);
  });

  it("counts each day separately", async () => {
    for (let i = 0; i < 5; i++) await countAndCheck(kv, "u:a:2026-07-29", 5);

    expect((await countAndCheck(kv, "u:a:2026-07-29", 5)).allowed).toBe(false);
    expect((await countAndCheck(kv, "u:a:2026-07-30", 5)).allowed).toBe(true);
  });

  it("holds a global cap independently of any one user", async () => {
    for (let i = 0; i < 200; i++) await countAndCheck(kv, "global:2026-07-29", 200);
    expect((await countAndCheck(kv, "global:2026-07-29", 200)).allowed).toBe(false);
  });

  it("treats a corrupt stored value as zero rather than throwing", async () => {
    kv.store.set("u:a:2026-07-29", "not a number");
    expect(await countAndCheck(kv, "u:a:2026-07-29", 5)).toEqual({ allowed: true, used: 1 });
  });

  it("refuses immediately when the limit is zero", async () => {
    expect((await countAndCheck(kv, "u:a:2026-07-29", 0)).allowed).toBe(false);
    expect(kv.puts).toBe(0);
  });
});
