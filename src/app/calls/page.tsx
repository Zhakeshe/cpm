"use client";

import Link from "next/link";
import { Phone, Headphones, Search } from "lucide-react";
import { recordingReference } from "@/lib/recording-reference";
import { RecordingPlayer } from "@/components/RecordingPlayer";
import { requestZadarmaCall } from "@/lib/call-controls";
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
  recordings?: Array<{ url: string }>;
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
  const [search, setSearch] = useState("");
  const [direction, setDirection] = useState("ALL");
  const [recordingsOnly, setRecordingsOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [canDownload, setCanDownload] = useState(false);
  const [dialing, setDialing] = useState<string | null>(null);
  const [callbackAt, setCallbackAt] = useState("");
  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/calls${manager ? `?manager=${encodeURIComponent(manager)}` : ""}`);
      if (!response.ok) throw new Error();
      const payload = await response.json();
      if (!Array.isArray(payload)) throw new Error();
      setCalls(payload);
    } catch { setError(t("calls.loadFailed")); }
    finally { setLoading(false); }
  }, [t, manager]);

  useEffect(() => {
    void load();
    void fetch("/api/auth/me").then((r) => r.ok ? r.json() : null).then((me) => setCanDownload(me?.role === "ADMIN")).catch(() => {});
  }, [load]);

  useRealtime({
    "call:incoming": () => load(),
    "call:outgoing": () => load(),
    "call:updated": () => load(),
  });

  async function setResult(result: string) {
    if (!modal) return;
    const response = await fetch("/api/calls", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callId: modal.id, result, callbackAt: result === "CALLBACK" ? callbackAt : undefined }),
    });
    if (!response.ok) { setError(t("calls.saveFailed")); return; }
    setModal(null);
    await load();
  }

  const visible = calls.filter((call) => {
    const text = `${call.contact?.firstName || ""} ${call.contact?.lastName || ""} ${call.fromNumber} ${call.toNumber} ${call.manager?.name || ""}`.toLowerCase();
    return text.includes(search.toLowerCase()) && (direction === "ALL" || call.direction === direction) && (!recordingsOnly || Boolean(recordingReference(call)));
  });
  async function dial(contactId: string) {
    setDialing(contactId); setError("");
    try { await requestZadarmaCall(contactId); }
    catch (error) { setError(t(`contact.callErrors.${(error as Error).message}`, t("contact.sipCallFailed"))); }
    finally { setDialing(null); }
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
      <p className="muted text-sm mb-5">{t("calls.subtitle")}</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[ [t("calls.total"), calls.length], [t("callDirections.INBOUND"), calls.filter((c) => c.direction === "INBOUND").length], [t("callDirections.OUTBOUND"), calls.filter((c) => c.direction === "OUTBOUND").length], [t("calls.recording"), calls.filter((c) => recordingReference(c)).length] ].map(([label, count]) => <div key={label} className="card p-4"><div className="text-xs muted mb-2">{label}</div><div className="text-2xl font-semibold tabular-nums">{count}</div></div>)}
      </div>
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-48 relative"><Search size={16} className="absolute left-3 top-3 muted" /><input aria-label={t("calls.search")} placeholder={t("calls.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
        <select aria-label={t("calls.direction")} value={direction} onChange={(e) => setDirection(e.target.value)}><option value="ALL">{t("calls.allDirections")}</option><option value="INBOUND">{t("callDirections.INBOUND")}</option><option value="OUTBOUND">{t("callDirections.OUTBOUND")}</option></select>
        <label className="text-sm flex gap-2 items-center"><input type="checkbox" checked={recordingsOnly} onChange={(e) => setRecordingsOnly(e.target.checked)} className="!w-4" /><Headphones size={16} />{t("calls.withRecording")}</label>
      </div>
      {error && <div role="alert" className="text-sm text-red-300 mb-4">{error}</div>}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#182235] text-[#93a0bb]">
            <tr>
              <th className="text-left p-3">{t("calls.date")}</th>
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
            {(loading || visible.length === 0) && <tr><td colSpan={8} className="text-center muted p-12">{t(loading ? "common.loading" : "calls.empty")}</td></tr>}
            {visible.map((c) => (
              <tr key={c.id} className="border-t border-[#243049]">
                <td className="p-3 whitespace-nowrap muted">{new Date(c.startedAt).toLocaleString(localeTag)}</td>
                <td className="p-3"><div>{c.contact ? <Link className="hover:text-blue-300" href={`/contacts/${c.contact.id}`}>{c.contact.firstName} {c.contact.lastName}</Link> : t("common.dash")}</div><div className="text-xs muted mt-1">{c.direction === "OUTBOUND" ? c.toNumber : c.fromNumber}</div>{c.contact && <button className="text-xs text-blue-300 mt-2 inline-flex gap-1 items-center" disabled={dialing !== null} onClick={() => dial(c.contact!.id)}><Phone size={12} />{t(dialing === c.contact.id ? "contact.sipCalling" : "contact.sipCall")}</button>}</td>
                <td className="p-3">{t(`callDirections.${c.direction}`, c.direction)}</td>
                <td className="p-3">{t(`callStatuses.${c.status}`, c.status)}</td>
                <td className="p-3">
                  {Math.floor(c.duration / 60)}:{String(c.duration % 60).padStart(2, "0")}
                </td>
                <td className="p-3">{c.manager?.name}</td>
                <td className="p-3">
                  {recordingReference(c) ? <RecordingPlayer callId={c.id} canDownload={canDownload} /> : t("common.dash")}
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
