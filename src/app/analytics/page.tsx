"use client";

import { AppShell } from "@/components/AppShell";
import { ExportButton } from "@/components/ExportButton";
import { useI18n } from "@/components/I18nProvider";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart, DonutChart, LineChart } from "@/components/Charts";
import { dayLabel, sourceLabel, type Series } from "@/lib/chart-data";

type AnalyticsResponse = {
  stats: Record<string, number> & {
    byDay?: Series;
    salesByDay?: Array<{ day: string; amount: number }>;
    bySource?: Array<{ source: string; _count: number }>;
    byLostReason?: Array<{ outcomeReason: string | null; _count: number }>;
  };
  managers: Array<Record<string, unknown>>;
};

export default function AnalyticsPage() {
  const { t } = useI18n();
  const [preset, setPreset] = useState("week");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  useEffect(() => {
    const qs =
      preset === "custom" && custom.from && custom.to
        ? `preset=custom&from=${custom.from}&to=${custom.to}`
        : `preset=${preset}`;
    fetch(`/api/analytics?${qs}`).then((r) => r.json()).then(setData);
  }, [preset, custom]);
  const s = data?.stats || {};
  const leadsSeries = (s.byDay || []).map((d) => ({ label: dayLabel(d.day), value: Number(d.count) }));
  const salesSeries = (s.salesByDay || []).map((d) => ({ label: dayLabel(d.day), value: Number(d.amount) }));
  const sourceSeries = (s.bySource || []).map((d) => ({ label: t(`sources.${d.source}`, sourceLabel(d.source)), value: Number(d._count) }));
  const lostSeries = (s.byLostReason || []).map((d) => ({
    label: d.outcomeReason ? t(`outcomes.${d.outcomeReason}`, d.outcomeReason) : t("common.dash"),
    value: Number(d._count),
  }));
  const managerSeries = (data?.managers || []).map((m) => ({
    label: String(m.name),
    value: Number(m.sales) || 0,
  }));
  const exportHref =
    preset === "custom" && custom.from && custom.to
      ? `/api/export/analytics?preset=custom&from=${custom.from}&to=${custom.to}`
      : `/api/export/analytics?preset=${preset}`;
  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">{t("analytics.title")}</h1>
        <div className="flex gap-2 items-center">
          <select value={preset} onChange={(e) => setPreset(e.target.value)} className="w-auto">
            <option value="today">{t("analytics.today")}</option>
            <option value="yesterday">{t("analytics.yesterday")}</option>
            <option value="week">{t("analytics.week")}</option>
            <option value="month">{t("analytics.month")}</option>
            <option value="custom">{t("analytics.custom")}</option>
          </select>
          {preset === "custom" && (
            <>
              <input type="date" className="w-auto" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} />
              <input type="date" className="w-auto" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} />
            </>
          )}
          <ExportButton href={exportHref} />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          [t("analytics.newLeads"), s.newLeads],
          [t("analytics.processed"), s.processed],
          [t("analytics.calls"), s.calls],
          [t("analytics.missed"), s.missed],
          [t("analytics.whatsapp"), s.conversations],
          [t("analytics.demos"), s.demos],
          [t("analytics.sales"), s.sales],
          [t("analytics.conversion"), `${((s.conversion || 0) * 100).toFixed(1)}%`],
          [t("analytics.amount"), s.salesAmount],
          [t("analytics.avgCheck"), s.avgCheck],
          [t("analytics.avgTalk"), Math.round(s.avgTalk || 0)],
          [t("analytics.avgReply"), Math.round(s.avgResponseSeconds || 0)],
        ].map(([l, v]) => (
          <div key={String(l)} className="card p-4">
            <div className="muted text-sm">{l}</div>
            <div className="text-2xl mt-1">{v ?? 0}</div>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <div className="muted text-sm mb-3">{t("analytics.leadsByDay")}</div>
          <LineChart data={leadsSeries} />
        </div>
        <div className="card p-5">
          <div className="muted text-sm mb-3">{t("analytics.salesByDay")}</div>
          <BarChart data={salesSeries} />
        </div>
        <div className="card p-5">
          <div className="muted text-sm mb-3">{t("analytics.sources")}</div>
          <DonutChart data={sourceSeries} />
        </div>
        <div className="card p-5">
          <div className="muted text-sm mb-3">{t("analytics.managerSales")}</div>
          <BarChart data={managerSeries} color="#fbbf24" />
        </div>
        <div className="card p-5">
          <div className="muted text-sm mb-3">{t("analytics.lostReasons")}</div>
          <DonutChart data={lostSeries} />
        </div>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#182235] text-[#93a0bb]">
            <tr>
              {[
                t("analytics.manager"),
                t("analytics.leads"),
                t("analytics.processed"),
                t("analytics.whatsapp"),
                t("analytics.calls"),
                t("analytics.demos"),
                t("analytics.sales"),
                t("analytics.conversion"),
                t("analytics.amount"),
                t("analytics.reply"),
              ].map((h) => (
                <th key={h} className="text-left p-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data?.managers || []).map((m) => (
              <tr key={String(m.id)} className="border-t border-[#243049]">
                <td className="p-3">
                  <Link href={`/managers/${String(m.id)}`} className="text-[#93c5fd]">
                    {String(m.name)}
                  </Link>
                </td>
                <td className="p-3">{String(m.newLeads)}</td>
                <td className="p-3">{String(m.processed)}</td>
                <td className="p-3">{String(m.conversations)}</td>
                <td className="p-3">{String(m.calls)}</td>
                <td className="p-3">{String(m.demos)}</td>
                <td className="p-3">{String(m.sales)}</td>
                <td className="p-3">{((Number(m.conversion) || 0) * 100).toFixed(1)}%</td>
                <td className="p-3">{String(m.salesAmount)}</td>
                <td className="p-3">{String(m.avgResponseSeconds ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
