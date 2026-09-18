"use client";

import { AppShell } from "@/components/AppShell";
import { useCallback, useEffect, useState } from "react";
import { BarChart, DonutChart, LineChart } from "@/components/Charts";
import { dayLabel, sourceLabel } from "@/lib/chart-data";
import { useRealtime } from "@/lib/use-realtime";

type Stats = {
  newLeads: number;
  unprocessed: number;
  callsToday: number;
  missed: number;
  unreadWa: number;
  demos: number;
  sales: number;
  overdue: number;
  activeClients: number;
  conversion: number;
  salesAmount: number;
  onlineManagers: number;
};

type Charts = {
  byDay?: Array<{ day: string; count: number }>;
  salesByDay?: Array<{ day: string; amount: number }>;
  bySource?: Array<{ source: string; _count: number }>;
};

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [charts, setCharts] = useState<Charts>({});
  const [managers, setManagers] = useState<Array<Record<string, unknown>>>([]);
  const [role, setRole] = useState("MANAGER");

  const load = useCallback(async () => {
    const [dash, week] = await Promise.all([
      fetch("/api/dashboard").then((r) => r.json()),
      fetch("/api/analytics?preset=week").then((r) => r.json()),
    ]);
    setStats(dash);
    setCharts(week.stats || {});
    setManagers(week.managers || []);
  }, []);

  useEffect(() => {
    load();
    fetch("/api/auth/me").then((r) => r.json()).then((u) => setRole(u.role));
  }, [load]);

  useRealtime({
    "lead:new": () => load(),
    "call:updated": () => load(),
  });
  const cards = [
    ["Новые лиды", stats?.newLeads],
    ["Необработанные", stats?.unprocessed],
    ["Звонки сегодня", stats?.callsToday],
    ["Новые сообщения", stats?.unreadWa],
    ["Демо", stats?.demos],
    ["Продажи", stats?.sales],
    ["Просроченные задачи", stats?.overdue],
  ];
  if (role === "ADMIN" || role === "SUPERVISOR") {
    cards.push(
      ["Активные клиенты", stats?.activeClients],
      ["Пропущенные", stats?.missed],
      ["Менеджеры онлайн", stats?.onlineManagers],
    );
  }
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-6">Главная</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={String(label)} className="card p-5">
            <div className="muted text-sm">{label}</div>
            <div className="text-3xl font-semibold mt-2">{value ?? "—"}</div>
          </div>
        ))}
      </div>
      {(role === "ADMIN" || role === "SUPERVISOR") && (
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <div className="card p-5">
            <div className="muted text-sm">Конверсия</div>
            <div className="text-3xl mt-2">{((stats?.conversion || 0) * 100).toFixed(1)}%</div>
          </div>
          <div className="card p-5">
            <div className="muted text-sm">Сумма продаж</div>
            <div className="text-3xl mt-2">{stats?.salesAmount ?? 0}</div>
          </div>
        </div>
      )}
      <div className="grid lg:grid-cols-2 gap-4 mt-6">
        <div className="card p-5">
          <div className="muted text-sm mb-3">Лиды за неделю</div>
          <LineChart data={(charts.byDay || []).map((d) => ({ label: dayLabel(d.day), value: Number(d.count) }))} />
        </div>
        <div className="card p-5">
          <div className="muted text-sm mb-3">Продажи за неделю</div>
          <BarChart data={(charts.salesByDay || []).map((d) => ({ label: dayLabel(d.day), value: Number(d.amount) }))} />
        </div>
        <div className="card p-5">
          <div className="muted text-sm mb-3">Источники клиентов</div>
          <DonutChart data={(charts.bySource || []).map((d) => ({ label: sourceLabel(d.source), value: Number(d._count) }))} />
        </div>
        {(role === "ADMIN" || role === "SUPERVISOR") && (
          <div className="card p-5">
            <div className="muted text-sm mb-3">Эффективность менеджеров (лиды за неделю)</div>
            <BarChart
              color="#fbbf24"
              data={managers.map((m) => ({ label: String(m.name), value: Number(m.newLeads) || 0 }))}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}
