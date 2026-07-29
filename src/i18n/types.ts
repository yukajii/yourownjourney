/**
 * A message is either a plain string or a set of plural forms.
 *
 * The forms are the CLDR categories, selected by Intl.PluralRules — not by a
 * `count === 1` check. English needs two, French two but with a different
 * boundary (0 is singular), German two, and Russian three: 1 день, 2 дня,
 * 5 дней, and again 21 день. Hand-rolling that is how localisation goes wrong.
 */
export type Plural = {
  one?: string;
  few?: string;
  many?: string;
  other: string;
};

export type Message = string | Plural;

export type Messages = Record<string, Message>;

export const LOCALES = ["en", "ru", "de", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

/** Shown in the language picker, each in its own language. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  ru: "Русский",
  de: "Deutsch",
  fr: "Français",
};
