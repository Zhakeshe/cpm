"use client";

import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/components/I18nProvider";
import Link from "next/link";
import { useEffect, useState } from "react";

type Company = { id: string; name: string; bin: string; phone: string; _count?: { contacts: number } };

export default function CompaniesPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Company[]>([]);
  const [draft, setDraft] = useState({ name: "", bin: "", phone: "" });
  const load = () => fetch("/api/companies").then((r) => r.json()).then(setRows);
  useEffect(() => {
    load();
  }, []);
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-6">{t("companies.title")}</h1>
      <form
        className="card p-4 mb-6 grid md:grid-cols-4 gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          await fetch("/api/companies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
          setDraft({ name: "", bin: "", phone: "" });
          load();
        }}
      >
        <input required placeholder={t("common.name")} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <input placeholder="BIN" value={draft.bin} onChange={(e) => setDraft({ ...draft, bin: e.target.value })} />
        <input placeholder={t("common.phone")} value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
        <button className="rounded-xl bg-[#2563eb]">{t("common.create")}</button>
      </form>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#182235] text-[#93a0bb]">
            <tr>
              <th className="text-left p-3">{t("common.name")}</th>
              <th className="text-left p-3">BIN</th>
              <th className="text-left p-3">{t("common.phone")}</th>
              <th className="text-left p-3">{t("companies.clients")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-[#243049]">
                <td className="p-3">{c.name}</td>
                <td className="p-3">{c.bin}</td>
                <td className="p-3">{c.phone}</td>
                <td className="p-3">
                  <Link className="text-[#93c5fd]" href={`/leads?company=${c.id}`}>
                    {c._count?.contacts || 0}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
