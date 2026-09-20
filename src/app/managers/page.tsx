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
  isOnline: boolean;
  sipExtension?: string;
  lastSeenAt?: string | null;
  activeLeads?: number;
  tasksToday?: number;
  callsToday?: number;
  sales?: number;
};

function randomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export default function ManagersPage() {
  const { t } = useI18n();
  const [users, setUsers] = useState<User[]>([]);
  const [meRole, setMeRole] = useState<string>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sipExtension, setSipExtension] = useState("");
  const [role, setRole] = useState("MANAGER");
  const [notice, setNotice] = useState("");
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");

  async function reload() {
    setUsers(await fetch("/api/users").then((r) => r.json()));
  }

  useEffect(() => {
    reload();
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => setMeRole(me?.role || ""));
  }, []);

  async function patch(id: string, data: object) {
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setNotice(body.error || t("managers.notFound"));
      return;
    }
    await reload();
  }

  async function createManager(e: React.FormEvent) {
    e.preventDefault();
    const pwd = password || randomPassword();
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password: pwd, sipExtension: sipExtension || undefined, role }),
    });
    const body = await res.json();
    if (!res.ok) {
      setNotice(body.error || t("managers.notFound"));
      return;
    }
    setNotice(`${t("managers.created")}: ${email} · ${t("managers.password")} ${pwd}`);
    setName("");
    setEmail("");
    setPassword("");
    setSipExtension("");
    await reload();
  }

  async function savePassword(id: string) {
    const pwd = resetPassword || randomPassword();
    await patch(id, { password: pwd });
    setNotice(`${t("managers.passwordUpdated")}: ${pwd}`);
    setResetFor(null);
    setResetPassword("");
  }

  const seenOnline = (u: User) => u.lastSeenAt && Date.now() - new Date(u.lastSeenAt).getTime() < 5 * 60 * 1000;

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-6">{t("managers.title")}</h1>

      {meRole === "ADMIN" && (
        <form onSubmit={createManager} className="card p-5 mb-6 grid md:grid-cols-2 xl:grid-cols-5 gap-3">
        <div className="xl:col-span-5 font-medium">{t("managers.createTitle")}</div>
        <input required placeholder={t("common.name")} value={name} onChange={(e) => setName(e.target.value)} />
        <input required type="email" placeholder={t("common.email")} value={email} onChange={(e) => setEmail(e.target.value)} />
        <input
          placeholder={t("managers.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
        />
        <input placeholder={t("managers.sip")} value={sipExtension} onChange={(e) => setSipExtension(e.target.value)} />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="MANAGER">MANAGER</option>
          <option value="SUPERVISOR">SUPERVISOR</option>
          <option value="OPERATOR">OPERATOR</option>
        </select>
        <button className="rounded-xl bg-[#2563eb] py-2 font-medium">{t("common.create")}</button>
        </form>
      )}
      {notice && <div className="mb-4 text-sm text-[#93c5fd]">{notice}</div>}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {users
          .filter((u) => u.role !== "ADMIN")
          .map((u) => (
            <div key={u.id} className="card p-5 space-y-2">
              <div className="flex justify-between">
                <Link href={`/managers/${u.id}`} className="font-medium text-[#93c5fd]">
                  {u.name}
                </Link>
                <span className="chip">{seenOnline(u) ? t("common.online") : t("common.offline")}</span>
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
              {meRole === "ADMIN" && (
                <>
                  <label className="text-sm flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="w-auto"
                      checked={u.isActive}
                      onChange={(e) => patch(u.id, { isActive: e.target.checked })}
                    />
                    {t("managers.active")}
                  </label>
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
                    <input
                      type="checkbox"
                      className="w-auto"
                      checked={u.isOnline}
                      onChange={(e) => patch(u.id, { isOnline: e.target.checked })}
                    />
                    {t("managers.onlineDuty")}
                  </label>
                  {resetFor === u.id ? (
                    <div className="flex gap-2">
                      <input
                        className="flex-1"
                        placeholder={t("managers.password")}
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        minLength={8}
                      />
                      <button type="button" className="rounded-xl bg-[#2563eb] px-3" onClick={() => savePassword(u.id)}>
                        {t("common.save")}
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="text-sm text-[#93c5fd]" onClick={() => setResetFor(u.id)}>
                      {t("managers.resetPassword")}
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
      </div>
    </AppShell>
  );
}
