import { LOCALES, type Locale, type Message, type Messages } from "./types";

const STORAGE_KEY = "leagues_locale";

const isLocale = (v: unknown): v is Locale =>
  typeof v === "string" && (LOCALES as readonly string[]).includes(v);

/**
 * The language to open in: an explicit choice if one was made, otherwise the
 * best match from the device's preference list, otherwise English.
 *
 * `navigator.languages` is ordered by preference, so a reader whose device says
 * ["ru-RU", "en-US"] gets Russian even though both are supported.
 */
export const detectLocale = (
  stored: string | null,
  preferred: readonly string[] = navigator.languages ?? [navigator.language]
): Locale => {
  if (isLocale(stored)) return stored;

  for (const tag of preferred) {
    const base = tag.toLowerCase().split("-")[0];
    if (isLocale(base)) return base;
  }
  return "en";
};

export const readStoredLocale = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

export const storeLocale = (locale: Locale | null) => {
  try {
    if (locale) localStorage.setItem(STORAGE_KEY, locale);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* private mode; the choice simply will not persist */
  }
};

/** Replaces {name} with the matching value. Missing values are left visible. */
const interpolate = (text: string, params?: Record<string, string | number>) =>
  params
    ? text.replace(/\{(\w+)\}/g, (whole, key: string) =>
        key in params ? String(params[key]) : whole
      )
    : text;

const pick = (message: Message, locale: Locale, count?: number): string => {
  if (typeof message === "string") return message;
  if (count === undefined) return message.other;

  const category = new Intl.PluralRules(locale).select(count);
  // Fall back through the categories a language might not define.
  return (
    message[category as keyof typeof message] ??
    message.other
  );
};

/**
 * Builds the lookup for one locale.
 *
 * A missing key falls back to English rather than rendering blank, and is
 * reported once in development so gaps surface while translating rather than
 * in front of a reader.
 */
export const makeTranslator = (
  locale: Locale,
  messages: Messages,
  fallback: Messages
) => {
  const missing = new Set<string>();

  return (key: string, params?: Record<string, string | number>): string => {
    let message = messages[key];

    if (message === undefined) {
      if (import.meta.env.DEV && !missing.has(key)) {
        missing.add(key);
        console.warn(`[i18n] ${locale} is missing "${key}"`);
      }
      message = fallback[key];
    }
    if (message === undefined) return key;

    const count = typeof params?.count === "number" ? params.count : undefined;
    return interpolate(pick(message, locale, count), params);
  };
};

export type Translator = ReturnType<typeof makeTranslator>;
