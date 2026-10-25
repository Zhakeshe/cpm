"use client";
import { useEffect, useState } from "react";
import { apiJson, friendlyError } from "@/lib/client-api";
import { useI18n } from "./I18nProvider";
import type { MonitorReport } from "@/lib/monitoring";

type SipStatus = { id: string; name: string; sipExtension: string | null; diagnostic: { state: string; reason: string; checkedAt: string } | null };
type Snapshot = { report: MonitorReport | null; stale: boolean };
export function SystemHealthPanel() {
  const { t, localeTag, locale } = useI18n();
  const [data, setData] = useState<Snapshot | null>(null);
  const [sip, setSip] = useState<SipStatus[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try { const [value, sipData] = await Promise.all([apiJson<Snapshot>("/api/monitoring"), apiJson<SipStatus[]>("/api/sip/diagnostics")]); if (!cancelled) { setData(value); setSip(sipData); setError(""); } }
      catch (e) { if (!cancelled) setError(friendlyError(e, locale)); }
    }
    void load(); const timer = setInterval(load, 15_000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [locale]);
  return <section className="card p-5 mb-6 space-y-3">
    <h2 className="font-medium">{t("stability.system")}</h2>
    {(error || !data || data.stale) && <p role="alert" className="text-sm text-[#fbbf24]">{error || t("stability.monitorStale")}</p>}
    {data?.report && <>
      <p className="muted text-xs">{t("stability.checkedAt")}: {new Date(data.report.checkedAt).toLocaleString(localeTag)}</p>
      <div className="grid sm:grid-cols-3 gap-3">{Object.entries(data.report.checks).map(([name, c]) => <div key={name} className="rounded-xl border border-[#33415f] p-3"><div className={c.ok ? "text-[#34d399]" : "text-[#f87171]"}>{c.ok ? "●" : "⚠"} {t(`stability.checks.${name}`, name)}</div><div className="text-xs muted mt-1">{c.detail}</div></div>)}</div>
      <details><summary className="text-sm cursor-pointer">{t("stability.incidents")}</summary>{data.report.incidents.slice().reverse().map((i) => <div key={i.at} className="text-xs py-2">{new Date(i.at).toLocaleString(localeTag)} · {i.issues.length ? i.issues.map(k => t(`stability.checks.${k}`, k)).join(", ") : t("stability.allHealthy")}</div>)}</details>
    </>}
    <h3 className="font-medium">SIP / WebRTC</h3>
    <div className="grid sm:grid-cols-2 gap-3">{sip.map(u => {
      const stale = !u.diagnostic || Date.now() - Date.parse(u.diagnostic.checkedAt) > 180_000;
      return <div key={u.id} className="rounded-xl border border-[#33415f] p-3 text-sm"><div>{u.name} · SIP {u.sipExtension}</div><div className="muted">{stale ? t("stability.monitorStale") : t(`softphone.${({ready:"ready", "in-call":"inCall",incoming:"incoming",disabled:"notConfigured",error:"error"} as Record<string,string>)[u.diagnostic!.state] || "registering"}`)}</div>{u.diagnostic?.reason && <div className="text-xs text-[#fbbf24]">{t(`stability.sipErrors.${u.diagnostic.reason}`)}</div>}</div>;
    })}</div>
  </section>;
}
