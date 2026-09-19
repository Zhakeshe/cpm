"use client";

import { AppShell } from "@/components/AppShell";
import { ExportButton } from "@/components/ExportButton";
import { useI18n } from "@/components/I18nProvider";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useRealtime } from "@/lib/use-realtime";

type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  phoneDisplay: string;
  source: string;
  dealAmount: string | number;
  manager?: { name: string };
  pipelineStage?: { name: string };
};

const SOURCES = ["MANUAL", "WHATSAPP", "INSTAGRAM", "FACEBOOK", "PHONE_CALL", "WEBSITE", "REFERRAL", "OTHER"];

function LeadsInner() {
  const params = useSearchParams();
  const { t } = useI18n();
  const [rows, setRows] = useState<Contact[]>([]);
  const [form, setForm] = useState({ firstName: "", phone: "", source: "MANUAL", comment: "" });
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const q = params.get("q");
    const data = await fetch(q ? `/api/contacts?q=${encodeURIComponent(q)}` : "/api/leads").then((r) => r.json());
    if (Array.isArray(data) && data[0]?.contact) {
      setRows(data.map((l: { contact: Contact }) => l.contact));
    } else setRows(data);
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  useRealtime({ "lead:new": () => load() });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      setError(t("leads.createFailed"));
      return;
    }
    setForm({ firstName: "", phone: "", source: "MANUAL", comment: "" });
    await load();
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">{t("leads.title")}</h1>
        <ExportButton href="/api/export/leads" />
      </div>
      <form onSubmit={create} className="card p-4 mb-6 grid md:grid-cols-5 gap-3">
        <input placeholder={t("common.name")} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        <input placeholder={t("common.phone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {t(`sources.${s}`)}
            </option>
          ))}
        </select>
        <input placeholder={t("common.comment")} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
        <button className="rounded-xl bg-[#2563eb]">{t("common.create")}</button>
      </form>
      {error && <div className="text-sm text-[#f87171] mb-3">{error}</div>}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#182235] text-[#93a0bb]">
            <tr>
              <th className="text-left p-3">{t("common.client")}</th>
              <th className="text-left p-3">{t("common.phone")}</th>
              <th className="text-left p-3">{t("common.source")}</th>
              <th className="text-left p-3">{t("common.manager")}</th>
              <th className="text-left p-3">{t("common.stage")}</th>
              <th className="text-left p-3">{t("common.amount")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-[#243049]">
                <td className="p-3">
                  <Link href={`/contacts/${c.id}`} className="text-[#93c5fd]">
                    {c.firstName} {c.lastName}
                  </Link>
                </td>
                <td className="p-3">{c.phoneDisplay}</td>
                <td className="p-3">{t(`sources.${c.source}`, c.source)}</td>
                <td className="p-3">{c.manager?.name || t("common.dash")}</td>
                <td className="p-3">{c.pipelineStage?.name || t("common.dash")}</td>
                <td className="p-3">{Number(c.dealAmount || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

export default function LeadsPage() {
  return (
    <Suspense>
      <LeadsInner />
    </Suspense>
  );
}
