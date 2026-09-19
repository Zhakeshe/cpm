"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  Calendar,
  LayoutDashboard,
  MessageSquare,
  Phone,
  Settings,
  Shield,
  Target,
  Users,
  UsersRound,
  Kanban,
  Search,
} from "lucide-react";
import { useRealtime, usePresence } from "@/lib/use-realtime";
import { Softphone } from "@/components/Softphone";
import { LOCALES, useI18n, type Locale } from "@/components/I18nProvider";

const NAV = [
  { href: "/", key: "nav.home", icon: LayoutDashboard },
  { href: "/leads", key: "nav.leads", icon: Target },
  { href: "/pipeline", key: "nav.pipeline", icon: Kanban },
  { href: "/messages", key: "nav.messages", icon: MessageSquare },
  { href: "/calls", key: "nav.calls", icon: Phone },
  { href: "/tasks", key: "nav.tasks", icon: Shield },
  { href: "/meetings", key: "nav.meetings", icon: Calendar },
  { href: "/analytics", key: "nav.analytics", icon: BarChart3, admin: true },
  { href: "/managers", key: "nav.managers", icon: UsersRound, admin: true },
  { href: "/audit", key: "nav.audit", icon: Shield, admin: true },
  { href: "/monitoring", key: "nav.monitoring", icon: Activity, admin: true },
  { href: "/settings", key: "nav.settings", icon: Settings, admin: true },
];

type Me = { id: string; name: string; email: string; role: string };
type Note = { id: string; title: string; body: string; readAt: string | null };

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale, setLocale } = useI18n();
  const [me, setMe] = useState<Me | null>(null);
  const [q, setQ] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [openNotes, setOpenNotes] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [incoming, setIncoming] = useState<{ contactId?: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setMe);
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : []))
      .then(setNotes);
  }, []);

  usePresence();
  useRealtime({
    notification: (n: Note) => {
      setNotes((prev) => [n, ...prev].slice(0, 50));
      setToast(n.title);
      setTimeout(() => setToast(null), 6000);
    },
    "call:incoming": (payload: { contactId?: string }) => {
      setIncoming(payload);
      setTimeout(() => setIncoming(null), 20000);
    },
  });

  const items = useMemo(
    () => NAV.filter((n) => !n.admin || me?.role === "ADMIN" || me?.role === "SUPERVISOR"),
    [me],
  );
  const unread = notes.filter((n) => !n.readAt).length;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  async function markNotesRead() {
    setOpenNotes((v) => !v);
    if (unread === 0) return;
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setNotes((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
  }

  function search(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) router.push(`/leads?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r border-[#243049] bg-[#0e1626] p-4 hidden md:flex md:flex-col">
        <div className="mb-8 px-2">
          <div className="text-lg font-semibold">{t("appName")}</div>
          <div className="text-xs text-[#93a0bb]">{t("appSubtitle")}</div>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${
                  active ? "bg-[#1d4ed8] text-white" : "text-[#c9d6f5] hover:bg-[#182235]"
                }`}
              >
                <Icon size={16} />
                {t(item.key)}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 text-sm text-[#93a0bb] space-y-2">
          <div>
            <div className="font-medium text-white">{me?.name}</div>
            <div>{me?.role}</div>
          </div>
          <select
            aria-label={t("common.language")}
            className="text-xs"
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
          >
            {LOCALES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          <button className="text-xs text-[#93a0bb]" onClick={logout}>
            {t("common.logout")}
          </button>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <header className="flex items-center gap-3 border-b border-[#243049] px-4 py-3">
          <Users size={18} className="md:hidden" />
          <form onSubmit={search} className="flex-1 max-w-xl relative">
            <Search size={16} className="absolute left-3 top-3 text-[#93a0bb]" />
            <input
              className="pl-9"
              placeholder={t("common.search")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </form>
          <button className="relative p-2" onClick={markNotesRead}>
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#ef4444] text-[10px] px-1.5 rounded-full">{unread}</span>
            )}
          </button>
        </header>
        {openNotes && (
          <div className="absolute right-4 top-16 z-20 w-80 card p-3 space-y-2">
            {notes.slice(0, 12).map((n) => (
              <div key={n.id} className="text-sm">
                <div className="font-medium">{n.title}</div>
                <div className="muted text-xs">{n.body}</div>
              </div>
            ))}
            {notes.length === 0 && <div className="muted text-sm">{t("common.noNotifications")}</div>}
          </div>
        )}
        {incoming && (
          <div className="fixed bottom-4 right-4 z-30 card p-4 w-80">
            <div className="font-medium">{t("softphone.incomingToast")}</div>
            <div className="muted text-sm">{t("softphone.incomingHint")}</div>
            {incoming.contactId && (
              <Link href={`/contacts/${incoming.contactId}`} className="mt-3 inline-block chip">
                {t("softphone.openCard")}
              </Link>
            )}
          </div>
        )}
        {toast && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 card px-4 py-3 text-sm">{toast}</div>
        )}
        <Softphone />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
