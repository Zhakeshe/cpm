"use client";

import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/components/I18nProvider";
import Link from "next/link";
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
  const { t } = useI18n();
  const [users, setUsers] = useState<User[]>([]);
  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then(setUsers);
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
      <h1 className="text-2xl font-semibold mb-6">{t("managers.title")}</h1>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {users
          .filter((u) => u.role !== "ADMIN")
          .map((u) => (
            <div key={u.id} className="card p-5 space-y-2">
              <div className="flex justify-between">
                <Link href={`/managers/${u.id}`} className="font-medium text-[#93c5fd]">
                  {u.name}
                </Link>
                <span className="chip">{online(u) ? t("common.online") : t("common.offline")}</span>
              </div>
              <div className="text-sm muted">
                {u.email} · SIP {u.sipExtension || t("common.dash")}
              </div>
              <div className="text-sm">
                {t("managers.stats", {
                  leads: u.activeLeads ?? 0,
                  tasks: u.tasksToday ?? 0,
                  calls: u.callsToday ?? 0,
                  sales: u.sales ?? 0,
                })}
              </div>
              <label className="text-sm flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-auto"
                  checked={u.acceptsNewLeads}
                  onChange={(e) => patch(u.id, { acceptsNewLeads: e.target.checked })}
                />
                {t("managers.accepts")}
              </label>
              <label className="text-sm flex items-center gap-2">
                <input type="checkbox" className="w-auto" checked={u.isActive} onChange={(e) => patch(u.id, { isActive: e.target.checked })} />
                {t("managers.active")}
              </label>
            </div>
          ))}
      </div>
    </AppShell>
  );
}
