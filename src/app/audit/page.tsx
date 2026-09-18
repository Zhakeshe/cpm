"use client";

import { AppShell } from "@/components/AppShell";
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
  const [logs, setLogs] = useState<Log[]>([]);
  useEffect(() => {
    fetch("/api/audit").then(async (r) => {
      if (r.ok) setLogs(await r.json());
    });
  }, []);
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-6">Журнал действий</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#182235] text-[#93a0bb]">
            <tr>
              <th className="text-left p-3">Время</th>
              <th className="text-left p-3">Кто</th>
              <th className="text-left p-3">Действие</th>
              <th className="text-left p-3">Объект</th>
              <th className="text-left p-3">Было → стало</th>
              <th className="text-left p-3">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-[#243049]">
                <td className="p-3">{new Date(l.createdAt).toLocaleString("ru")}</td>
                <td className="p-3">{l.actor?.name}</td>
                <td className="p-3">{l.action}</td>
                <td className="p-3">{l.entityType} {l.entityId.slice(0, 8)}</td>
                <td className="p-3 text-xs">{JSON.stringify(l.oldValue)} → {JSON.stringify(l.newValue)}</td>
                <td className="p-3">{l.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
