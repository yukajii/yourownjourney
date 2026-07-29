import { describe, expect, it } from "vitest";
import { de } from "./de";
import { en } from "./en";
import { fr } from "./fr";
import { ru } from "./ru";
import { detectLocale, makeTranslator } from "./translate";
import { LOCALES, type Locale, type Messages } from "./types";

const CATALOGUES: Record<Locale, Messages> = { en, ru, de, fr };

/** The plural categories each language actually uses, per CLDR. */
const REQUIRED_FORMS: Record<Locale, string[]> = {
  en: ["one", "other"],
  de: ["one", "other"],
  fr: ["one", "other"],
  ru: ["one", "few", "many", "other"],
};

describe("catalogue completeness", () => {
  const keys = Object.keys(en);

  for (const locale of LOCALES) {
    it(`${locale} translates every key`, () => {
      const missing = keys.filter((k) => !(k in CATALOGUES[locale]));
      expect(missing, `missing in ${locale}`).toEqual([]);
    });

    it(`${locale} has no keys English does not`, () => {
      const extra = Object.keys(CATALOGUES[locale]).filter((k) => !(k in en));
      expect(extra, `stale in ${locale}`).toEqual([]);
    });

    it(`${locale} keeps plurals plural`, () => {
      // A key that pluralises in English must pluralise everywhere, or a
      // translated build silently loses agreement.
      const shouldPluralise = keys.filter((k) => typeof en[k] === "object");
      const flattened = shouldPluralise.filter(
        (k) => typeof CATALOGUES[locale][k] !== "object"
      );
      expect(flattened, `flattened in ${locale}`).toEqual([]);
    });

    it(`${locale} supplies every plural form its language needs`, () => {
      const problems: string[] = [];
      for (const [key, message] of Object.entries(CATALOGUES[locale])) {
        if (typeof message !== "object") continue;
        for (const form of REQUIRED_FORMS[locale]) {
          if (!(form in message)) problems.push(`${key}.${form}`);
        }
      }
      expect(problems, `${locale} plural gaps`).toEqual([]);
    });
  }

  it("keeps interpolation placeholders identical across languages", () => {
    const placeholders = (m: unknown): string[] => {
      const text =
        typeof m === "string" ? m : Object.values(m as object).join(" ");
      return [...new Set(text.match(/\{\w+\}/g) ?? [])].sort();
    };

    const mismatches: string[] = [];
    for (const key of keys) {
      const expected = placeholders(en[key]);
      for (const locale of LOCALES) {
        const got = placeholders(CATALOGUES[locale][key]);
        // A dropped {count} renders as a sentence with a hole in it.
        for (const p of expected) {
          if (!got.includes(p)) mismatches.push(`${locale}:${key} lost ${p}`);
        }
      }
    }
    expect(mismatches).toEqual([]);
  });
});

describe("Russian plural selection", () => {
  const t = makeTranslator("ru", ru, en);

  it("uses the right form across the awkward range", () => {
    // The whole reason for Intl.PluralRules: a count === 1 check gets every
    // one of these except the first wrong.
    expect(t("journey.streak", { count: 1 })).toBe("1 день подряд");
    expect(t("journey.streak", { count: 2 })).toBe("2 дня подряд");
    expect(t("journey.streak", { count: 5 })).toBe("5 дней подряд");
    expect(t("journey.streak", { count: 11 })).toBe("11 дней подряд");
    expect(t("journey.streak", { count: 21 })).toBe("21 день подряд");
    expect(t("journey.streak", { count: 22 })).toBe("22 дня подряд");
    expect(t("journey.streak", { count: 25 })).toBe("25 дней подряд");
  });
});

describe("French plural selection", () => {
  const t = makeTranslator("fr", fr, en);

  it("treats zero as singular, unlike English", () => {
    expect(t("journey.streak", { count: 0 })).toBe("0 jour d'affilée");
    expect(t("journey.streak", { count: 1 })).toBe("1 jour d'affilée");
    expect(t("journey.streak", { count: 2 })).toBe("2 jours d'affilée");
  });
});

describe("interpolation", () => {
  const t = makeTranslator("en", en, en);

  it("substitutes named values", () => {
    expect(t("goals.deleteTitle", { name: "Learn Japanese" })).toBe(
      "Delete “Learn Japanese”?"
    );
  });

  it("leaves an unknown placeholder visible rather than blanking it", () => {
    expect(t("goals.deleteTitle")).toContain("{name}");
  });

  it("returns the key itself when nothing matches", () => {
    expect(t("no.such.key")).toBe("no.such.key");
  });
});

describe("fallback", () => {
  it("falls back to English rather than rendering empty", () => {
    const sparse = makeTranslator("de", { "goals.title": "Ziele" }, en);
    expect(sparse("goals.title")).toBe("Ziele");
    expect(sparse("session.start")).toBe(en["session.start"]);
  });
});

describe("detectLocale", () => {
  it("honours an explicit choice above the device", () => {
    expect(detectLocale("de", ["ru-RU", "en-US"])).toBe("de");
  });

  it("ignores a stored value that is not a supported locale", () => {
    expect(detectLocale("klingon", ["fr-CA"])).toBe("fr");
  });

  it("takes the device's first supported preference, in order", () => {
    expect(detectLocale(null, ["ru-RU", "en-US"])).toBe("ru");
    expect(detectLocale(null, ["en-GB", "ru-RU"])).toBe("en");
  });

  it("matches on the base tag, so de-AT counts as German", () => {
    expect(detectLocale(null, ["de-AT"])).toBe("de");
    expect(detectLocale(null, ["fr-CA"])).toBe("fr");
  });

  it("skips unsupported languages to find one it has", () => {
    expect(detectLocale(null, ["ja-JP", "pl-PL", "de-DE"])).toBe("de");
  });

  it("falls back to English when nothing matches", () => {
    expect(detectLocale(null, ["ja-JP", "ko-KR"])).toBe("en");
    expect(detectLocale(null, [])).toBe("en");
  });
});
