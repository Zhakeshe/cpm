"use client";

import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BarChart, DonutChart, LineChart } from "@/components/Charts";
import { dayLabel, sourceLabel } from "@/lib/chart-data";
import { useRealtime } from "@/lib/use-realtime";
import { useI18n } from "@/components/I18nProvider";

type Stats = {
  newLeads: number;
  unprocessed: number;
  callsToday: number;
  missed: number;
  unreadWa: number;
  demos: number;
  sales: number;
  overdue: number;
  needsFollowUp: number;
  activeClients: number;
  conversion: number;
  salesAmount: number;
  onlineManagers: number;
};

type Charts = {
  byDay?: Array<{ day: string; count: number }>;
  salesByDay?: Array<{ day: string; amount: number }>;
  bySource?: Array<{ source: string; _count: number }>;
};

type ChannelFunnel = {
  slug: string;
  title: string;
  clicks: number;
  wrote: number;
  demos: number;
  sales: number;
  clickToWrite: number;
};

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [charts, setCharts] = useState<Charts>({});
  const [managers, setManagers] = useState<Array<Record<string, unknown>>>([]);
  const [tracking, setTracking] = useState<ChannelFunnel[]>([]);
  const [role, setRole] = useState("MANAGER");
  const { t } = useI18n();

  const load = useCallback(async () => {
    const [dash, week] = await Promise.all([
      fetch("/api/dashboard").then((r) => r.json()),
      fetch("/api/analytics?preset=week").then((r) => r.json()),
    ]);
    setStats(dash);
    setCharts(week.stats || {});
    setManagers(week.managers || []);
    setTracking(week.tracking || []);
  }, []);

  useEffect(() => {
    load();
    fetch("/api/auth/me").then((r) => r.json()).then((u) => setRole(u.role));
  }, [load]);

  useRealtime({
    "lead:new": () => load(),
    "call:updated": () => load(),
  });
  const cards = [
    [t("dashboard.newLeads"), stats?.newLeads],
    [t("dashboard.unprocessed"), stats?.unprocessed],
    [t("dashboard.callsToday"), stats?.callsToday],
    [t("dashboard.newMessages"), stats?.unreadWa],
    [t("dashboard.demos"), stats?.demos],
    [t("dashboard.sales"), stats?.sales],
    [t("dashboard.overdue"), stats?.overdue],
    [t("dashboard.needsFollowUp"), stats?.needsFollowUp],
  ];
  if (role === "ADMIN" || role === "SUPERVISOR") {
    cards.push(
      [t("dashboard.activeClients"), stats?.activeClients],
      [t("dashboard.missed"), stats?.missed],
      [t("dashboard.online"), stats?.onlineManagers],
    );
  }
  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">{t("dashboard.title")}</h1>
        <Link href="/today" className="chip">{t("nav.today")}</Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => {
          const href =
            label === t("dashboard.needsFollowUp")
              ? "/follow-ups"
              : label === t("dashboard.demos")
                ? "/meetings"
                : label === t("dashboard.overdue")
                  ? "/tasks"
                  : undefined;
          const inner = (
            <>
              <div className="muted text-sm">{label}</div>
              <div className="text-3xl font-semibold mt-2">{value ?? "—"}</div>
            </>
          );
          return href ? (
            <Link key={String(label)} href={href} className="card p-5 block">
              {inner}
            </Link>
          ) : (
            <div key={String(label)} className="card p-5">
              {inner}
            </div>
          );
        })}
      </div>
      {(role === "ADMIN" || role === "SUPERVISOR") && (
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <div className="card p-5">
            <div className="muted text-sm">{t("dashboard.conversion")}</div>
            <div className="text-3xl mt-2">{((stats?.conversion || 0) * 100).toFixed(1)}%</div>
          </div>
          <div className="card p-5">
            <div className="muted text-sm">{t("dashboard.salesAmount")}</div>
            <div className="text-3xl mt-2">{stats?.salesAmount ?? 0}</div>
          </div>
        </div>
      )}
      {(role === "ADMIN" || role === "SUPERVISOR") && (
      <div className="grid lg:grid-cols-2 gap-4 mt-6">
        <div className="card p-5">
          <div className="muted text-sm mb-3">{t("dashboard.leadsWeek")}</div>
          <LineChart data={(charts.byDay || []).map((d) => ({ label: dayLabel(d.day), value: Number(d.count) }))} />
        </div>
        <div className="card p-5">
          <div className="muted text-sm mb-3">{t("dashboard.salesWeek")}</div>
          <BarChart data={(charts.salesByDay || []).map((d) => ({ label: dayLabel(d.day), value: Number(d.amount) }))} />
        </div>
        <div className="card p-5">
          <div className="muted text-sm mb-3">{t("dashboard.sources")}</div>
          <DonutChart
            data={(charts.bySource || []).map((d) => ({
              label: t(`sources.${d.source}`, sourceLabel(d.source)),
              value: Number(d._count),
            }))}
          />
        </div>
        <div className="card p-5">
          <div className="muted text-sm mb-3">{t("dashboard.managerEfficiency")}</div>
          <BarChart
            color="#fbbf24"
            data={managers.map((m) => ({ label: String(m.name), value: Number(m.newLeads) || 0 }))}
          />
        </div>
        <div className="card p-5 lg:col-span-2">
          <div className="muted text-sm mb-3">{t("analytics.tracking")}</div>
          <table className="w-full text-sm">
            <thead className="text-[#93a0bb]">
              <tr>
                <th className="text-left py-2">{t("analytics.trackingChannel")}</th>
                <th className="text-left py-2">{t("analytics.trackingClicks")}</th>
                <th className="text-left py-2">{t("analytics.trackingWrote")}</th>
                <th className="text-left py-2">{t("analytics.trackingClickWrite")}</th>
                <th className="text-left py-2">{t("analytics.trackingDemos")}</th>
                <th className="text-left py-2">{t("analytics.trackingSales")}</th>
              </tr>
            </thead>
            <tbody>
              {tracking.map((row) => (
                <tr key={row.slug} className="border-t border-[#243049]">
                  <td className="py-2">{row.title}</td>
                  <td className="py-2">{row.clicks}</td>
                  <td className="py-2">{row.wrote}</td>
                  <td className="py-2">{row.clickToWrite}%</td>
                  <td className="py-2">{row.demos}</td>
                  <td className="py-2">{row.sales}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </AppShell>
  );
}
