"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import ru from "@/i18n/ru.json";
import kk from "@/i18n/kk.json";
import { interpolate } from "@/lib/i18n";

const dictionaries = { ru, kk } as const;
export type Locale = keyof typeof dictionaries;
export const LOCALES: Array<{ code: Locale; label: string }> = [
  { code: "ru", label: "Русский" },
  { code: "kk", label: "Қазақша" },
];

const COOKIE = "crm_locale";

function lookup(dict: unknown, path: string): string | undefined {
  let current: unknown = dict;
  for (const part of path.split(".")) {
    if (current && typeof current === "object" && part in (current as object)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof current === "string" ? current : undefined;
}

export type TranslateFn = (
  path: string,
  fallbackOrVars?: string | Record<string, string | number>,
  vars?: Record<string, string | number>,
) => string;

type Ctx = {
  locale: Locale;
  localeTag: string;
  setLocale: (locale: Locale) => void;
  t: TranslateFn;
};

const I18nContext = createContext<Ctx>({
  locale: "ru",
  localeTag: "ru-RU",
  setLocale: () => {},
  t: (path, fallback) => (typeof fallback === "string" ? fallback : path),
});

function readCookieLocale(): Locale {
  if (typeof document === "undefined") return "ru";
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`));
  const value = match?.split("=")[1] as Locale | undefined;
  return value && value in dictionaries ? value : "ru";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ru");

  useEffect(() => {
    setLocaleState(readCookieLocale());
  }, []);

  const setLocale = useCallback((next: Locale) => {
    document.cookie = `${COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
    setLocaleState(next);
  }, []);

  /** Falls back to Russian, then to the key itself, so a missing translation never blanks the UI. */
  const t = useCallback<TranslateFn>(
    (path, fallbackOrVars, maybeVars) => {
      const vars = typeof fallbackOrVars === "object" ? fallbackOrVars : maybeVars;
      const fallback = typeof fallbackOrVars === "string" ? fallbackOrVars : undefined;
      const raw = lookup(dictionaries[locale], path) || lookup(ru, path) || fallback || path;
      return interpolate(raw, vars);
    },
    [locale],
  );

  const localeTag = locale === "kk" ? "kk-KZ" : "ru-RU";
  const value = useMemo(() => ({ locale, localeTag, setLocale, t }), [locale, localeTag, setLocale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
