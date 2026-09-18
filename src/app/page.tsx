"use client";

import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";

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

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [role, setRole] = useState("MANAGER");
  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setStats);
    fetch("/api/auth/me").then((r) => r.json()).then((u) => setRole(u.role));
  }, []);
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
    </AppShell>
  );
}
