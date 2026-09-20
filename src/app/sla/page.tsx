"use client";

import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/components/I18nProvider";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function SlaPage() {
  const { t } = useI18n();
  const [data, setData] = useState<{ settings?: { enabled: boolean; minutes: number }; items?: Array<{ id: string; slaBreachedAt: string; contact: { id: string; firstName: string; phoneDisplay: string }; manager?: { name: string } }> } | null>(null);
  useEffect(() => {
    fetch("/api/sla").then((r) => r.json()).then(setData);
  }, []);
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-2">{t("sla.title")}</h1>
      <div className="muted mb-6">
        {data?.settings?.enabled ? t("sla.on", { minutes: data.settings.minutes }) : t("sla.off")}
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#182235] text-[#93a0bb]">
            <tr>
              <th className="text-left p-3">{t("common.client")}</th>
              <th className="text-left p-3">{t("common.manager")}</th>
              <th className="text-left p-3">{t("sla.breached")}</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items || []).map((row) => (
              <tr key={row.id} className="border-t border-[#243049]">
                <td className="p-3">
                  <Link className="text-[#93c5fd]" href={`/contacts/${row.contact.id}`}>
                    {row.contact.firstName} · {row.contact.phoneDisplay}
                  </Link>
                </td>
                <td className="p-3">{row.manager?.name || t("common.dash")}</td>
                <td className="p-3">{row.slaBreachedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(data?.items || []).length === 0 && <div className="p-4 muted">{t("common.noData")}</div>}
      </div>
    </AppShell>
  );
}
