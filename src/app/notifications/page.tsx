"use client";

import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/components/I18nProvider";
import { useEffect, useState } from "react";

type Note = { id: string; title: string; body: string; createdAt: string; readAt: string | null };

export default function NotificationsPage() {
  const { t, localeTag } = useI18n();
  const [items, setItems] = useState<Note[]>([]);
  useEffect(() => {
    fetch("/api/notifications").then((r) => r.json()).then(setItems);
  }, []);
  return (
    <AppShell>
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-semibold">{t("notifications.title")}</h1>
        <button
          className="chip"
          type="button"
          onClick={() => fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{}" }).then(() => setItems((p) => p.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))))}
        >
          {t("notifications.markRead")}
        </button>
      </div>
      <div className="card p-5 space-y-3">
        {items.length === 0 && <div className="muted">{t("common.noNotifications")}</div>}
        {items.map((n) => (
          <div key={n.id} className="border-t border-[#243049] pt-2">
            <div className="font-medium">{n.title}</div>
            <div className="text-sm">{n.body}</div>
            <div className="muted text-xs">{new Date(n.createdAt).toLocaleString(localeTag)}</div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
