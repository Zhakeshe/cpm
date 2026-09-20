"use client";

import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/components/I18nProvider";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Quote = {
  id: string;
  number: string;
  total: string | number;
  status: string;
  note: string;
  createdAt: string;
  items: Array<{ id: string; title: string; qty: number; unitPrice: string | number }>;
  contact: { firstName: string; lastName: string; phoneDisplay: string; address?: string; city?: string };
  manager: { name: string };
};

export default function QuotePrintPage() {
  const { t, localeTag } = useI18n();
  const params = useParams<{ id: string }>();
  const [q, setQ] = useState<Quote | null>(null);
  const load = useCallback(() => fetch(`/api/quotes/${params.id}`).then((r) => r.json()).then(setQ), [params.id]);
  useEffect(() => {
    load();
  }, [load]);
  if (!q) return <AppShell>{t("common.loading")}</AppShell>;
  return (
    <AppShell>
      <div className="card p-8 max-w-3xl">
        <div className="flex justify-between">
          <div>
            <div className="text-xl font-semibold">Quantum CRM</div>
            <div className="muted">{t("quotes.kp")}</div>
          </div>
          <div className="text-right">
            <div className="font-medium">{q.number}</div>
            <div className="muted text-sm">{new Date(q.createdAt).toLocaleString(localeTag)}</div>
          </div>
        </div>
        <div className="mt-6">
          {q.contact.firstName} {q.contact.lastName} · {q.contact.phoneDisplay}
          <div className="muted text-sm">
            {q.contact.city} {q.contact.address}
          </div>
        </div>
        <table className="w-full text-sm mt-6">
          <thead>
            <tr className="text-[#93a0bb]">
              <th className="text-left py-2">{t("common.name")}</th>
              <th className="text-left py-2">{t("quotes.qty")}</th>
              <th className="text-left py-2">{t("quotes.price")}</th>
            </tr>
          </thead>
          <tbody>
            {q.items.map((item) => (
              <tr key={item.id} className="border-t border-[#243049]">
                <td className="py-2">{item.title}</td>
                <td className="py-2">{item.qty}</td>
                <td className="py-2">{Number(item.unitPrice) * item.qty} ₸</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 text-xl font-semibold">{t("quotes.total", { amount: Number(q.total) })}</div>
        <div className="muted mt-2">{q.note}</div>
        <div className="flex gap-2 mt-6">
          {["SENT", "ACCEPTED", "REJECTED"].map((status) => (
            <button
              key={status}
              type="button"
              className="chip"
              onClick={() =>
                fetch(`/api/quotes/${q.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status }),
                }).then(load)
              }
            >
              {t(`quoteStatus.${status}`)}
            </button>
          ))}
          <button type="button" className="rounded-xl bg-[#2563eb] px-3 py-2 text-sm" onClick={() => window.print()}>
            {t("quotes.print")}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
