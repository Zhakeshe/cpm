"use client";

import { AppShell } from "@/components/AppShell";
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
  const [data, setData] = useState<Payload | null>(null);
  const [filter, setFilter] = useState("");
  const [health, setHealth] = useState<{ db: string; redis: string; uptime: number } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/webhook-events${filter ? `?status=${filter}` : ""}`);
    if (!res.ok) {
      setError("Нет доступа к мониторингу");
      return;
    }
    setData(await res.json());
    setHealth(await fetch("/api/health").then((r) => r.json()));
  }, [filter]);

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
    setNotice(res.ok ? `Поставлено в очередь: ${result.requeued ?? 0}` : "Не удалось поставить в очередь");
    setTimeout(() => setNotice(null), 5000);
    // the worker needs a moment before the new status is visible
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
        <h1 className="text-2xl font-semibold">Мониторинг</h1>
        <div className="flex gap-2">
          <select className="w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Все события</option>
            <option value="FAILED">Только ошибки</option>
            <option value="PENDING">В очереди</option>
            <option value="PROCESSED">Обработанные</option>
          </select>
          <button
            className="rounded-xl bg-[#2563eb] px-4 disabled:opacity-50"
            disabled={busy !== null}
            onClick={() => retry()}
          >
            {busy === "all" ? "Ставим в очередь…" : "Повторить все ошибки"}
          </button>
        </div>
      </div>
      {notice && <div className="card px-4 py-2 mb-4 text-sm text-[#34d399]">{notice}</div>}

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <div className="muted text-sm">База данных</div>
          <div className="text-2xl mt-1">{health?.db || "—"}</div>
        </div>
        <div className="card p-4">
          <div className="muted text-sm">Redis</div>
          <div className="text-2xl mt-1">{health?.redis || "—"}</div>
        </div>
        <div className="card p-4">
          <div className="muted text-sm">Ошибок вебхуков</div>
          <div className="text-2xl mt-1" style={{ color: data?.failedJobs ? "#f87171" : undefined }}>
            {data?.failedJobs ?? 0}
          </div>
        </div>
      </div>

      <div className="card p-5 mb-6">
        <div className="font-medium mb-3">События по интеграциям</div>
        <div className="flex flex-wrap gap-2">
          {(data?.counts || []).map((c) => (
            <span key={`${c.provider}-${c.processingStatus}`} className="chip">
              <span style={{ color: STATUS_COLOR[c.processingStatus] }}>●</span>
              {c.provider} · {c.processingStatus} · {c._count}
            </span>
          ))}
          {(data?.counts || []).length === 0 && <div className="muted text-sm">Событий пока нет</div>}
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#182235] text-[#93a0bb]">
            <tr>
              <th className="text-left p-3">Получено</th>
              <th className="text-left p-3">Интеграция</th>
              <th className="text-left p-3">Тип</th>
              <th className="text-left p-3">Статус</th>
              <th className="text-left p-3">Ошибка</th>
              <th className="text-left p-3"></th>
            </tr>
          </thead>
          <tbody>
            {(data?.events || []).map((e) => (
              <tr key={e.id} className="border-t border-[#243049]">
                <td className="p-3">{new Date(e.receivedAt).toLocaleString("ru")}</td>
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
                      {busy === e.id ? "В очереди…" : "Повторить"}
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
