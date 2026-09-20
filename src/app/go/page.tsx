"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LOCALES, useI18n, type Locale } from "@/components/I18nProvider";

function PublicLeadForm() {
  const params = useSearchParams();
  const { t, locale, setLocale } = useI18n();
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [website, setWebsite] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/public/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        phone,
        comment,
        campaign: params.get("c") || params.get("utm_source") || undefined,
        website,
      }),
    });
    if (!res.ok) {
      setError(t("publicForm.failed"));
      return;
    }
    setDone(true);
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <form onSubmit={onSubmit} className="card w-full max-w-md p-8 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-2xl font-semibold">{t("appName")}</div>
            <div className="muted text-sm mt-1">{t("publicForm.title")}</div>
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
        {done ? (
          <div className="text-[#34d399]">{t("publicForm.thanks")}</div>
        ) : (
          <>
            <label className="block text-sm">
              {t("common.name")}
              <input className="mt-1" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </label>
            <label className="block text-sm">
              {t("common.phone")}
              <input className="mt-1" required value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label className="block text-sm">
              {t("common.comment")}
              <textarea className="mt-1" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
            </label>
            <input className="hidden" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            {error && <div className="text-[#f87171] text-sm">{error}</div>}
            <button className="w-full rounded-xl bg-[#2563eb] py-3 font-medium">{t("publicForm.submit")}</button>
          </>
        )}
      </form>
    </div>
  );
}

export default function PublicLeadPage() {
  return (
    <Suspense>
      <PublicLeadForm />
    </Suspense>
  );
}
