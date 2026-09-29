"use client";

import { AppShell } from "@/components/AppShell";
import { ExportButton } from "@/components/ExportButton";
import { ManagerFilter } from "@/components/ManagerFilter";
import { useI18n } from "@/components/I18nProvider";
import { useCallback, useEffect, useState } from "react";
import { useRealtime } from "@/lib/use-realtime";

type Call = {
  id: string;
  direction: string;
  status: string;
  fromNumber: string;
  toNumber: string;
  duration: number;
  startedAt: string;
  recordingUrl?: string | null;
  result?: string | null;
  contact?: { firstName: string; lastName: string; id: string };
  manager?: { name: string };
};

const RESULTS = ["CONTACTED", "NO_ANSWER", "CALLBACK", "INTERESTED", "DEMO_BOOKED", "THINKING", "REJECTED", "SALE"];

export default function CallsPage() {
  const { t, localeTag } = useI18n();
  const [calls, setCalls] = useState<Call[]>([]);
  const [manager, setManager] = useState("");
  const [modal, setModal] = useState<Call | null>(null);
  const [callbackAt, setCallbackAt] = useState("");
  const load = useCallback(async () => {
    const qs = manager ? `?manager=${encodeURIComponent(manager)}` : "";
    setCalls(await fetch(`/api/calls${qs}`).then((r) => r.json()));
  }, [manager]);

  useEffect(() => {
    load();
  }, [load]);

  useRealtime({
    "call:incoming": () => load(),
    "call:updated": () => load(),
  });

  async function setResult(result: string) {
    if (!modal) return;
    await fetch("/api/calls", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callId: modal.id, result, callbackAt: result === "CALLBACK" ? callbackAt : undefined }),
    });
    setModal(null);
    await load();
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">{t("calls.title")}</h1>
        <div className="flex gap-3 items-end">
          <div className="w-48">
            <ManagerFilter value={manager} onChange={setManager} />
          </div>
          <ExportButton href="/api/export/calls" />
        </div>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#182235] text-[#93a0bb]">
            <tr>
              <th className="text-left p-3">{t("common.client")}</th>
              <th className="text-left p-3">{t("calls.direction")}</th>
              <th className="text-left p-3">{t("common.status")}</th>
              <th className="text-left p-3">{t("calls.duration")}</th>
              <th className="text-left p-3">{t("common.manager")}</th>
              <th className="text-left p-3">{t("calls.recording")}</th>
              <th className="text-left p-3">{t("calls.result")}</th>
            </tr>
          </thead>
          <tbody>
            {calls.map((c) => (
              <tr key={c.id} className="border-t border-[#243049]">
                <td className="p-3">{c.contact ? `${c.contact.firstName} ${c.contact.lastName}` : c.fromNumber}</td>
                <td className="p-3">{t(`callDirections.${c.direction}`, c.direction)}</td>
                <td className="p-3">{t(`callStatuses.${c.status}`, c.status)}</td>
                <td className="p-3">
                  {Math.floor(c.duration / 60)}:{String(c.duration % 60).padStart(2, "0")}
                </td>
                <td className="p-3">{c.manager?.name}</td>
                <td className="p-3">
                  {c.recordingUrl ? <audio controls src={c.recordingUrl} className="h-8" /> : t("common.dash")}
                </td>
                <td className="p-3">
                  <button className="chip" onClick={() => setModal(c)}>
                    {c.result ? t(`callResults.${c.result}`) : t("calls.setResult")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <div className="fixed inset-0 bg-black/50 grid place-items-center p-4">
          <div className="card p-6 w-full max-w-md space-y-3">
            <div className="font-medium">{t("calls.resultTitle")}</div>
            {RESULTS.map((r) => (
              <button key={r} className="w-full text-left chip" onClick={() => setResult(r)}>
                {t(`callResults.${r}`)}
              </button>
            ))}
            <input type="datetime-local" value={callbackAt} onChange={(e) => setCallbackAt(e.target.value)} />
            <button className="text-sm muted" onClick={() => setModal(null)}>
              {t("common.close")}
            </button>
            <div className="muted text-xs">{new Date(modal.startedAt).toLocaleString(localeTag)}</div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
