"use client";

import { useI18n } from "@/components/I18nProvider";
import { useState } from "react";

export default function ForgotPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setDone(true);
  }
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <form onSubmit={onSubmit} className="card w-full max-w-md p-8 space-y-4">
        <div className="text-xl font-semibold">{t("auth.resetTitle")}</div>
        <input placeholder={t("common.email")} value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="w-full rounded-xl bg-[#2563eb] py-3">{t("auth.sendLink")}</button>
        {done && <div className="text-sm text-[#34d399]">{t("auth.resetSent")}</div>}
      </form>
    </div>
  );
}
