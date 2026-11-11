"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LOCALES, useI18n, type Locale } from "@/components/I18nProvider";

export default function LoginPage() {
  const router = useRouter();
  const { t, locale, setLocale } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [needTotp, setNeedTotp] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending.current) return;
    // Browser/password-manager autofill may update the DOM without a React change event.
    const fields = new FormData(e.currentTarget);
    const submittedEmail = String(fields.get("email") ?? email).trim().toLowerCase();
    const submittedPassword = String(fields.get("password") ?? password);
    const submittedTotp = String(fields.get("totp") ?? totp).trim();
    pending.current = true;
    setBusy(true);
    setError("");
    let signedIn = false;
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: submittedEmail, password: submittedPassword, totp: submittedTotp || undefined }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.totpRequired) {
          setNeedTotp(true);
          setError(t("auth.totpNeeded"));
          return;
        }
        if (res.status === 429) {
          const seconds = Math.max(1, Number(res.headers.get("Retry-After")) || 60);
          setError(t("auth.rateLimited", { seconds }));
        } else if (data.error === "ACCOUNT_DISABLED") setError(t("auth.disabled"));
        else if (data.error === "INVALID_TOTP") setError(t("auth.totpBad"));
        else if (res.status === 400) setError(t("auth.invalidInput"));
        else if (res.status >= 500) setError(t("auth.serverError"));
        else setError(t("auth.invalid"));
        return;
      }
      signedIn = true;
      router.replace("/");
      router.refresh();
    } catch {
      setError(t("auth.connectionFailed"));
    } finally {
      if (!signedIn) { pending.current = false; setBusy(false); }
    }
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
          <input className="mt-1" name="email" autoComplete="username" inputMode="email" autoCapitalize="none" spellCheck={false} disabled={busy} value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block text-sm">
          {t("auth.password")}
          <input className="mt-1" name="password" type="password" autoComplete="current-password" disabled={busy} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {needTotp && (
          <label className="block text-sm">
            {t("auth.totp")}
            <input className="mt-1" name="totp" autoComplete="one-time-code" disabled={busy} value={totp} onChange={(e) => setTotp(e.target.value)} inputMode="numeric" />
          </label>
        )}
        {error && <div className="text-[#f87171] text-sm" role="alert">{error}</div>}
        <button type="submit" disabled={busy} className="w-full rounded-xl bg-[#2563eb] py-3 font-medium disabled:opacity-60">{t(busy ? "auth.signingIn" : "auth.submit")}</button>
        <Link href="/forgot-password" className="block text-center text-sm muted">
          {t("auth.forgot")}
        </Link>
      </form>
    </div>
  );
}
