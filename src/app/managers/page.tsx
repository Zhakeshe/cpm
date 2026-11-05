"use client";

import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/components/I18nProvider";
import Link from "next/link";
import { apiJson, mutationJson, friendlyError } from "@/lib/client-api";
import { useEffect, useRef, useState } from "react";

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
  const { t, locale } = useI18n();
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

  const [showInactive, setShowInactive] = useState(false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const generatedPassword = useRef<string | null>(null);
  async function reload() {
    setUsers(await apiJson<User[]>("/api/users?includeInactive=1"));
  }

  useEffect(() => {
    reload().catch((e) => setNotice(friendlyError(e, locale)));
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => setMeRole(me?.role || ""));
  }, [locale]);

  async function mutate(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setNotice("");
    try { await action(); } catch (e) { setNotice(friendlyError(e, locale)); }
    finally { lock.current = false; setBusy(false); }
  }

  async function patch(id: string, data: object) {
    await apiJson("/api/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...data }) });
    await reload();
  }

  async function createManager(e: React.FormEvent) {
    e.preventDefault();
    await mutate(async () => {
      const pwd = password || (generatedPassword.current ??= randomPassword());
      await mutationJson("/api/users", { name, email, password: pwd, sipExtension: sipExtension || undefined, role });
      setNotice(`${t("managers.created")}: ${email} · ${t("managers.password")} ${pwd}`);
      generatedPassword.current = null;
      setName(""); setEmail(""); setPassword(""); setSipExtension("");
      await reload();
    });
  }

  async function savePassword(id: string) {
    await mutate(async () => {
      const pwd = resetPassword || randomPassword();
      if (pwd.length < 8) throw new Error("PASSWORD_TOO_SHORT");
      await patch(id, { password: pwd });
      setNotice(`${t("managers.passwordUpdated")}: ${pwd}`);
      setResetFor(null); setResetPassword("");
    });
  }

  async function disableManager(user: User) {
    if (!window.confirm(t("stability.disableConfirm", { name: user.name, count: user.activeLeads ?? 0 }))) return;
    await mutate(async () => {
      await patch(user.id, { isActive: false, confirmDisable: true });
      setNotice(t("stability.disabledNotice"));
    });
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
        <button disabled={busy} className="rounded-xl bg-[#2563eb] py-2 font-medium disabled:opacity-50">{t("common.create")}</button>
        </form>
      )}
      {meRole === "ADMIN" && <label className="mb-4 flex items-center gap-2"><input type="checkbox" className="w-auto" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />{t("stability.showInactive")}</label>}
      {notice && <div className="mb-4 text-sm text-[#93c5fd]">{notice}</div>}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {users
          .filter((u) => u.role !== "ADMIN" && (showInactive ? !u.isActive : u.isActive))
          .map((u) => (
            <div key={u.id} className="card p-5 space-y-2">
              <div className="flex justify-between">
                <Link href={`/managers/${u.id}`} className="font-medium text-[#93c5fd]">
                  {u.name}
                </Link>
                <span className="chip">{!u.isActive ? t("stability.blocked") : seenOnline(u) ? t("common.online") : t("common.offline")}</span>
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
                  {!u.isActive && <button disabled={busy} className="chip" onClick={() => mutate(async () => { await patch(u.id, { isActive: true }); setNotice(t("stability.restored")); })}>{t("stability.restore")}</button>}
                  <label className="text-sm flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="w-auto"
                      checked={u.acceptsNewLeads}
                      disabled={busy || !u.isActive}
                      onChange={(e) => { const value = e.target.checked; void mutate(() => patch(u.id, { acceptsNewLeads: value })); }}
                    />
                    {t("managers.accepts")}
                  </label>
                  <label className="text-sm flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="w-auto"
                      checked={u.isOnline}
                      disabled={busy || !u.isActive}
                      onChange={(e) => { const value = e.target.checked; void mutate(() => patch(u.id, { isOnline: value })); }}
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
                      <button type="button" className="rounded-xl bg-[#2563eb] px-3" disabled={busy} onClick={() => savePassword(u.id)}>
                        {t("common.save")}
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="text-sm text-[#93c5fd]" onClick={() => setResetFor(u.id)}>
                      {t("managers.resetPassword")}
                    </button>
                  )}
                  <button type="button" className="mt-2 text-sm text-[#f87171]" disabled={busy || !u.isActive} onClick={() => disableManager(u)}>
                    {t("stability.disable")}
                  </button>
                </>
              )}
            </div>
          ))}
      </div>
    </AppShell>
  );
}
