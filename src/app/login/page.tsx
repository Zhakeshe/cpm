"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LOCALES, useI18n, type Locale } from "@/components/I18nProvider";

export default function LoginPage() {
  const router = useRouter();
  const { t, locale, setLocale } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error === "ACCOUNT_DISABLED" ? t("auth.disabled") : t("auth.invalid"));
      return;
    }
    router.push("/");
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <form onSubmit={onSubmit} className="card w-full max-w-md p-8 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-2xl font-semibold">{t("appName")}</div>
            <div className="muted text-sm mt-1">{t("auth.title")}</div>
          </div>
          <select
            aria-label={t("common.language")}
            className="w-auto text-xs"
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
          >
            {LOCALES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <label className="block text-sm">
          {t("auth.email")}
          <input className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block text-sm">
          {t("auth.password")}
          <input className="mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <div className="text-[#f87171] text-sm">{error}</div>}
        <button className="w-full rounded-xl bg-[#2563eb] py-3 font-medium">{t("auth.submit")}</button>
        <Link href="/forgot-password" className="block text-center text-sm muted">
          {t("auth.forgot")}
        </Link>
      </form>
    </div>
  );
}
