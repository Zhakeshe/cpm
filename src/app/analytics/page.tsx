"use client";

import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";

export default function AnalyticsPage() {
  const [preset, setPreset] = useState("week");
  const [data, setData] = useState<{ stats: Record<string, number>; managers: Array<Record<string, unknown>> } | null>(null);
  useEffect(() => {
    fetch(`/api/analytics?preset=${preset}`).then((r) => r.json()).then(setData);
  }, [preset]);
  const s = data?.stats || {};
  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Аналитика</h1>
        <select value={preset} onChange={(e) => setPreset(e.target.value)} className="w-auto">
          <option value="today">Сегодня</option>
          <option value="yesterday">Вчера</option>
          <option value="week">Неделя</option>
          <option value="month">Месяц</option>
        </select>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          ["Новые лиды", s.newLeads],
          ["Обработано", s.processed],
          ["Звонки", s.calls],
          ["Missed", s.missed],
          ["WhatsApp", s.conversations],
          ["Демо", s.demos],
          ["Продажи", s.sales],
          ["Конверсия", `${((s.conversion || 0) * 100).toFixed(1)}%`],
          ["Сумма", s.salesAmount],
          ["Средний чек", s.avgCheck],
          ["Среднее время", Math.round(s.avgTalk || 0)],
        ].map(([l, v]) => (
          <div key={String(l)} className="card p-4">
            <div className="muted text-sm">{l}</div>
            <div className="text-2xl mt-1">{v ?? 0}</div>
          </div>
        ))}
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#182235] text-[#93a0bb]">
            <tr>
              {["Менеджер","Лиды","Обработано","WhatsApp","Звонки","Демо","Продажи","Конверсия","Сумма"].map((h) => (
                <th key={h} className="text-left p-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data?.managers || []).map((m) => (
              <tr key={String(m.id)} className="border-t border-[#243049]">
                <td className="p-3">{String(m.name)}</td>
                <td className="p-3">{String(m.newLeads)}</td>
                <td className="p-3">{String(m.processed)}</td>
                <td className="p-3">{String(m.conversations)}</td>
                <td className="p-3">{String(m.calls)}</td>
                <td className="p-3">{String(m.demos)}</td>
                <td className="p-3">{String(m.sales)}</td>
                <td className="p-3">{((Number(m.conversion) || 0) * 100).toFixed(1)}%</td>
                <td className="p-3">{String(m.salesAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
