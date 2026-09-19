"use client";

import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/components/I18nProvider";
import { useEffect, useState } from "react";

type Log = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue: unknown;
  newValue: unknown;
  ip?: string | null;
  createdAt: string;
  actor?: { name: string };
};

export default function AuditPage() {
  const { t, localeTag } = useI18n();
  const [logs, setLogs] = useState<Log[]>([]);
  useEffect(() => {
    fetch("/api/audit").then(async (r) => {
      if (r.ok) setLogs(await r.json());
    });
  }, []);
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-6">{t("audit.title")}</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#182235] text-[#93a0bb]">
            <tr>
              <th className="text-left p-3">{t("audit.time")}</th>
              <th className="text-left p-3">{t("audit.who")}</th>
              <th className="text-left p-3">{t("audit.action")}</th>
              <th className="text-left p-3">{t("audit.entity")}</th>
              <th className="text-left p-3">{t("audit.diff")}</th>
              <th className="text-left p-3">{t("audit.ip")}</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-[#243049]">
                <td className="p-3">{new Date(l.createdAt).toLocaleString(localeTag)}</td>
                <td className="p-3">{l.actor?.name}</td>
                <td className="p-3">{l.action}</td>
                <td className="p-3">
                  {l.entityType} {l.entityId.slice(0, 8)}
                </td>
                <td className="p-3 text-xs">
                  {JSON.stringify(l.oldValue)} → {JSON.stringify(l.newValue)}
                </td>
                <td className="p-3">{l.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
