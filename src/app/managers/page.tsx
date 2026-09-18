"use client";

import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  acceptsNewLeads: boolean;
  sipExtension?: string;
  lastSeenAt?: string | null;
  activeLeads?: number;
  tasksToday?: number;
  callsToday?: number;
  sales?: number;
};

export default function ManagersPage() {
  const [users, setUsers] = useState<User[]>([]);
  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then(setUsers);
  }, []);
  async function patch(id: string, data: object) {
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    setUsers(await fetch("/api/users").then((r) => r.json()));
  }
  const online = (u: User) => u.lastSeenAt && Date.now() - new Date(u.lastSeenAt).getTime() < 5 * 60 * 1000;
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-6">Менеджеры</h1>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {users.filter((u) => u.role !== "ADMIN").map((u) => (
          <div key={u.id} className="card p-5 space-y-2">
            <div className="flex justify-between">
              <div className="font-medium">{u.name}</div>
              <span className="chip">{online(u) ? "online" : "offline"}</span>
            </div>
            <div className="text-sm muted">{u.email} · SIP {u.sipExtension || "—"}</div>
            <div className="text-sm">Лиды: {u.activeLeads} · Задачи: {u.tasksToday} · Звонки: {u.callsToday} · Продажи: {u.sales}</div>
            <label className="text-sm flex items-center gap-2">
              <input type="checkbox" className="w-auto" checked={u.acceptsNewLeads} onChange={(e) => patch(u.id, { acceptsNewLeads: e.target.checked })} />
              Принимает новые лиды
            </label>
            <label className="text-sm flex items-center gap-2">
              <input type="checkbox" className="w-auto" checked={u.isActive} onChange={(e) => patch(u.id, { isActive: e.target.checked })} />
              Активен
            </label>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
