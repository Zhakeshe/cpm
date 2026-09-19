"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import ru from "@/i18n/ru.json";
import kk from "@/i18n/kk.json";

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

type Ctx = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string, fallback?: string) => string;
};

const I18nContext = createContext<Ctx>({
  locale: "ru",
  setLocale: () => {},
  t: (path, fallback) => lookup(ru, path) || fallback || path,
});

function readCookieLocale(): Locale {
  if (typeof document === "undefined") return "ru";
  const match = document.cookie.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE}=`));
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
  const t = useCallback(
    (path: string, fallback?: string) => lookup(dictionaries[locale], path) || lookup(ru, path) || fallback || path,
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
