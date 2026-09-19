"use client";

import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/components/I18nProvider";
import { useCallback, useEffect, useState } from "react";

type Event = {
  id: string;
  provider: string;
  eventType: string;
  processingStatus: string;
  receivedAt: string;
  processedAt: string | null;
  error: string | null;
};

type Payload = {
  events: Event[];
  counts: Array<{ provider: string; processingStatus: string; _count: number }>;
  failedJobs: number;
};

const STATUS_COLOR: Record<string, string> = {
  PROCESSED: "#34d399",
  FAILED: "#f87171",
  PENDING: "#fbbf24",
  PROCESSING: "#60a5fa",
};

export default function MonitoringPage() {
  const { t, localeTag } = useI18n();
  const [data, setData] = useState<Payload | null>(null);
  const [filter, setFilter] = useState("");
  const [health, setHealth] = useState<{ db: string; redis: string; uptime: number } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/webhook-events${filter ? `?status=${filter}` : ""}`);
    if (!res.ok) {
      setError(t("monitoring.forbidden"));
      return;
    }
    setData(await res.json());
    setHealth(await fetch("/api/health").then((r) => r.json()));
  }, [filter, t]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [load]);

  async function retry(id?: string) {
    setBusy(id || "all");
    const res = await fetch("/api/webhook-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id ? { id } : { retryAllFailed: true }),
    });
    const result = await res.json().catch(() => ({}));
    setBusy(null);
    setNotice(res.ok ? t("monitoring.queued", { count: result.requeued ?? 0 }) : t("monitoring.queueFailed"));
    setTimeout(() => setNotice(null), 5000);
    setTimeout(load, 1500);
    load();
  }

  if (error) {
    return (
      <AppShell>
        <div className="card p-6">{error}</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">{t("monitoring.title")}</h1>
        <div className="flex gap-2">
          <select className="w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">{t("monitoring.all")}</option>
            <option value="FAILED">{t("monitoring.failedOnly")}</option>
            <option value="PENDING">{t("monitoring.pending")}</option>
            <option value="PROCESSED">{t("monitoring.processed")}</option>
          </select>
          <button className="rounded-xl bg-[#2563eb] px-4 disabled:opacity-50" disabled={busy !== null} onClick={() => retry()}>
            {busy === "all" ? t("monitoring.queueing") : t("monitoring.retryAll")}
          </button>
        </div>
      </div>
      {notice && <div className="card px-4 py-2 mb-4 text-sm text-[#34d399]">{notice}</div>}

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <div className="muted text-sm">{t("monitoring.db")}</div>
          <div className="text-2xl mt-1">{health?.db || t("common.dash")}</div>
        </div>
        <div className="card p-4">
          <div className="muted text-sm">{t("monitoring.redis")}</div>
          <div className="text-2xl mt-1">{health?.redis || t("common.dash")}</div>
        </div>
        <div className="card p-4">
          <div className="muted text-sm">{t("monitoring.failedHooks")}</div>
          <div className="text-2xl mt-1" style={{ color: data?.failedJobs ? "#f87171" : undefined }}>
            {data?.failedJobs ?? 0}
          </div>
        </div>
      </div>

      <div className="card p-5 mb-6">
        <div className="font-medium mb-3">{t("monitoring.byIntegration")}</div>
        <div className="flex flex-wrap gap-2">
          {(data?.counts || []).map((c) => (
            <span key={`${c.provider}-${c.processingStatus}`} className="chip">
              <span style={{ color: STATUS_COLOR[c.processingStatus] }}>●</span>
              {c.provider} · {c.processingStatus} · {c._count}
            </span>
          ))}
          {(data?.counts || []).length === 0 && <div className="muted text-sm">{t("monitoring.noEvents")}</div>}
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#182235] text-[#93a0bb]">
            <tr>
              <th className="text-left p-3">{t("monitoring.received")}</th>
              <th className="text-left p-3">{t("monitoring.integration")}</th>
              <th className="text-left p-3">{t("monitoring.type")}</th>
              <th className="text-left p-3">{t("common.status")}</th>
              <th className="text-left p-3">{t("monitoring.error")}</th>
              <th className="text-left p-3"></th>
            </tr>
          </thead>
          <tbody>
            {(data?.events || []).map((e) => (
              <tr key={e.id} className="border-t border-[#243049]">
                <td className="p-3">{new Date(e.receivedAt).toLocaleString(localeTag)}</td>
                <td className="p-3">{e.provider}</td>
                <td className="p-3">{e.eventType}</td>
                <td className="p-3" style={{ color: STATUS_COLOR[e.processingStatus] }}>
                  {e.processingStatus}
                </td>
                <td className="p-3 text-xs max-w-[280px] truncate" title={e.error || ""}>
                  {e.error}
                </td>
                <td className="p-3">
                  {e.processingStatus === "FAILED" && (
                    <button className="chip disabled:opacity-50" disabled={busy !== null} onClick={() => retry(e.id)}>
                      {busy === e.id ? t("monitoring.retrying") : t("monitoring.retry")}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
