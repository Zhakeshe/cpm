"use client";

import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart, DonutChart, LineChart } from "@/components/Charts";
import { dayLabel, sourceLabel, type Series } from "@/lib/chart-data";

type AnalyticsResponse = {
  stats: Record<string, number> & {
    byDay?: Series;
    salesByDay?: Array<{ day: string; amount: number }>;
    bySource?: Array<{ source: string; _count: number }>;
  };
  managers: Array<Record<string, unknown>>;
};

export default function AnalyticsPage() {
  const [preset, setPreset] = useState("week");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  useEffect(() => {
    const qs =
      preset === "custom" && custom.from && custom.to
        ? `preset=custom&from=${custom.from}&to=${custom.to}`
        : `preset=${preset}`;
    fetch(`/api/analytics?${qs}`).then((r) => r.json()).then(setData);
  }, [preset, custom]);
  const s = data?.stats || {};
  const leadsSeries = (s.byDay || []).map((d) => ({ label: dayLabel(d.day), value: Number(d.count) }));
  const salesSeries = (s.salesByDay || []).map((d) => ({ label: dayLabel(d.day), value: Number(d.amount) }));
  const sourceSeries = (s.bySource || []).map((d) => ({ label: sourceLabel(d.source), value: Number(d._count) }));
  const managerSeries = (data?.managers || []).map((m) => ({
    label: String(m.name),
    value: Number(m.sales) || 0,
  }));
  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Аналитика</h1>
        <div className="flex gap-2 items-center">
          <select value={preset} onChange={(e) => setPreset(e.target.value)} className="w-auto">
            <option value="today">Сегодня</option>
            <option value="yesterday">Вчера</option>
            <option value="week">Неделя</option>
            <option value="month">Месяц</option>
            <option value="custom">Период</option>
          </select>
          {preset === "custom" && (
            <>
              <input type="date" className="w-auto" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} />
              <input type="date" className="w-auto" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} />
            </>
          )}
        </div>
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
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <div className="muted text-sm mb-3">Лиды по дням</div>
          <LineChart data={leadsSeries} />
        </div>
        <div className="card p-5">
          <div className="muted text-sm mb-3">Продажи по дням</div>
          <BarChart data={salesSeries} />
        </div>
        <div className="card p-5">
          <div className="muted text-sm mb-3">Источники клиентов</div>
          <DonutChart data={sourceSeries} />
        </div>
        <div className="card p-5">
          <div className="muted text-sm mb-3">Эффективность менеджеров (продажи)</div>
          <BarChart data={managerSeries} color="#fbbf24" />
        </div>
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
                <td className="p-3">
                  <Link href={`/managers/${String(m.id)}`} className="text-[#93c5fd]">
                    {String(m.name)}
                  </Link>
                </td>
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
