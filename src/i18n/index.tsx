import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { de } from "./de";
import { en } from "./en";
import { fr } from "./fr";
import { ru } from "./ru";
import {
  detectLocale,
  makeTranslator,
  readStoredLocale,
  storeLocale,
  type Translator,
} from "./translate";
import { LOCALES, type Locale, type Messages } from "./types";

export const CATALOGUES: Record<Locale, Messages> = { en, ru, de, fr };

type I18nCtx = {
  locale: Locale;
  /** null when following the device rather than an explicit choice. */
  override: Locale | null;
  setOverride: (locale: Locale | null) => void;
  t: Translator;
};

const Ctx = createContext<I18nCtx | undefined>(undefined);

export const useI18n = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be inside <I18nProvider>");
  return ctx;
};

/** The common case: just the translate function. */
export const useT = () => useI18n().t;

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  // Read before the first render, like the goals do, so nothing paints in the
  // wrong language and then swaps.
  const [override, setOverrideState] = useState<Locale | null>(() => {
    const stored = readStoredLocale();
    return LOCALES.includes(stored as Locale) ? (stored as Locale) : null;
  });

  const locale = useMemo(() => detectLocale(override), [override]);

  const t = useMemo(
    () => makeTranslator(locale, CATALOGUES[locale], en),
    [locale]
  );

  const setOverride = useCallback((next: Locale | null) => {
    storeLocale(next);
    setOverrideState(next);
  }, []);

  /* Screen readers and the browser's own UI read this. */
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(
    () => ({ locale, override, setOverride, t }),
    [locale, override, setOverride, t]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};
