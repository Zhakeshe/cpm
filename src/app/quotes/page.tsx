"use client";

import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/components/I18nProvider";
import Link from "next/link";
import { useEffect, useState } from "react";

type Quote = { id: string; number: string; total: string | number; status: string; contact?: { id: string; firstName: string; lastName: string } };

export default function QuotesPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Quote[]>([]);
  useEffect(() => {
    fetch("/api/quotes").then((r) => r.json()).then(setRows);
  }, []);
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-6">{t("quotes.title")}</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#182235] text-[#93a0bb]">
            <tr>
              <th className="text-left p-3">№</th>
              <th className="text-left p-3">{t("common.client")}</th>
              <th className="text-left p-3">{t("common.amount")}</th>
              <th className="text-left p-3">{t("common.status")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((q) => (
              <tr key={q.id} className="border-t border-[#243049]">
                <td className="p-3">
                  <Link className="text-[#93c5fd]" href={`/quotes/${q.id}`}>
                    {q.number}
                  </Link>
                </td>
                <td className="p-3">
                  {q.contact ? (
                    <Link className="text-[#93c5fd]" href={`/contacts/${q.contact.id}`}>
                      {q.contact.firstName} {q.contact.lastName}
                    </Link>
                  ) : (
                    t("common.dash")
                  )}
                </td>
                <td className="p-3">{Number(q.total)} ₸</td>
                <td className="p-3">{t(`quoteStatus.${q.status}`, q.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
