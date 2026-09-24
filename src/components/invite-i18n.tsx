"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { INVITE_COPY, LOCALES, type Locale } from "@/lib/invite-copy";

const STORAGE = "kern-invite-lang";

type Ctx = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (typeof INVITE_COPY)[Locale];
};

const InviteLangContext = createContext<Ctx | null>(null);

export function InviteLangProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("kk");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE);
    if (saved && LOCALES.includes(saved as Locale)) {
      setLocaleState(saved as Locale);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "kk" ? "kk" : locale;
  }, [locale]);

  const value = useMemo<Ctx>(
    () => ({
      locale,
      setLocale: (next) => {
        setLocaleState(next);
        window.localStorage.setItem(STORAGE, next);
      },
      t: INVITE_COPY[locale],
    }),
    [locale],
  );

  return <InviteLangContext.Provider value={value}>{children}</InviteLangContext.Provider>;
}

export function useInviteLang() {
  const ctx = useContext(InviteLangContext);
  if (!ctx) throw new Error("useInviteLang");
  return ctx;
}
