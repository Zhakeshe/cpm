"use client";

import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/components/I18nProvider";
import { BarChart, LineChart } from "@/components/Charts";
import { dayLabel } from "@/lib/chart-data";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Detail = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    acceptsNewLeads: boolean;
    isOnline: boolean;
    sipExtension?: string | null;
    lastSeenAt?: string | null;
  };
  stats: Record<string, number> & {
    byDay?: Array<{ day: string; count: number }>;
    salesByDay?: Array<{ day: string; amount: number }>;
  };
  openTasks: number;
  recentCalls: Array<{
    id: string;
    direction: string;
    status: string;
    duration: number;
    startedAt: string;
    contact?: { id: string; firstName: string; lastName: string } | null;
  }>;
  recentContacts: Array<{
    id: string;
    firstName: string;
    lastName: string;
    phoneDisplay: string;
    pipelineStage?: { name: string } | null;
  }>;
};

export default function ManagerDetailPage() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const [preset, setPreset] = useState("month");
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/users/${params.id}?preset=${preset}`).then(async (r) => {
      if (!r.ok) {
        setError(r.status === 403 ? t("managers.forbidden") : t("managers.notFound"));
        return;
      }
      setData(await r.json());
      setError("");
    });
  }, [params.id, preset, t]);

  if (error) {
    return (
      <AppShell>
        <div className="card p-6">{error}</div>
      </AppShell>
    );
  }
  if (!data) return <AppShell>{t("common.loading")}</AppShell>;

  const s = data.stats;
  const online = data.user.lastSeenAt && Date.now() - new Date(data.user.lastSeenAt).getTime() < 5 * 60 * 1000;

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{data.user.name}</h1>
          <div className="muted text-sm">
            {data.user.email} · SIP {data.user.sipExtension || t("common.dash")} · {online ? t("common.online") : t("common.offline")}
          </div>
        </div>
        <select className="w-auto" value={preset} onChange={(e) => setPreset(e.target.value)}>
          <option value="today">{t("analytics.today")}</option>
          <option value="week">{t("analytics.week")}</option>
          <option value="month">{t("analytics.month")}</option>
        </select>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          [t("managers.receivedLeads"), s.newLeads],
          [t("managers.processed"), s.processed],
          [t("managers.waDialogs"), s.conversations],
          [t("managers.calls"), s.calls],
          [t("managers.demos"), s.demos],
          [t("managers.sales"), s.sales],
          [t("analytics.conversion"), `${((s.conversion || 0) * 100).toFixed(1)}%`],
          [t("analytics.amount"), s.salesAmount],
          [t("analytics.avgCheck"), Math.round(s.avgCheck || 0)],
          [t("analytics.avgTalk"), Math.round(s.avgTalk || 0)],
          [t("managers.openTasks"), data.openTasks],
          [t("analytics.missed"), s.missed],
          [t("analytics.avgReply"), Math.round(s.avgResponseSeconds || 0)],
        ].map(([label, value]) => (
          <div key={String(label)} className="card p-4">
            <div className="muted text-sm">{label}</div>
            <div className="text-2xl mt-1">{value ?? 0}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <div className="muted text-sm mb-3">{t("analytics.leadsByDay")}</div>
          <LineChart data={(s.byDay || []).map((d) => ({ label: dayLabel(d.day), value: Number(d.count) }))} />
        </div>
        <div className="card p-5">
          <div className="muted text-sm mb-3">{t("analytics.salesByDay")}</div>
          <BarChart data={(s.salesByDay || []).map((d) => ({ label: dayLabel(d.day), value: Number(d.amount) }))} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="font-medium mb-3">{t("managers.recentCalls")}</div>
          {data.recentCalls.length === 0 && <div className="muted text-sm">{t("managers.noCalls")}</div>}
          {data.recentCalls.map((c) => (
            <div key={c.id} className="flex justify-between text-sm border-t border-[#243049] py-2">
              <span>{c.contact ? `${c.contact.firstName} ${c.contact.lastName}` : t("common.dash")}</span>
              <span className="muted">
                {t(`callDirections.${c.direction}`, c.direction)} · {t(`callStatuses.${c.status}`, c.status)} · {c.duration}s
              </span>
            </div>
          ))}
        </div>
        <div className="card p-5">
          <div className="font-medium mb-3">{t("managers.clients")}</div>
          {data.recentContacts.length === 0 && <div className="muted text-sm">{t("managers.noClients")}</div>}
          {data.recentContacts.map((c) => (
            <div key={c.id} className="flex justify-between text-sm border-t border-[#243049] py-2">
              <Link href={`/contacts/${c.id}`} className="text-[#93c5fd]">
                {c.firstName} {c.lastName}
              </Link>
              <span className="muted">
                {c.phoneDisplay} · {c.pipelineStage?.name || t("common.dash")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
