"use client";

import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/components/I18nProvider";
import Link from "next/link";
import { useEffect, useState } from "react";

type Row = { id: string; description?: string; dueAt?: string; startsAt?: string; contact?: { id: string; firstName: string; lastName: string; phoneDisplay: string } | null; firstName?: string; phoneDisplay?: string; reason?: string };

export default function TodayPage() {
  const { t, localeTag } = useI18n();
  const [data, setData] = useState<{ tasks: Row[]; meetings: Row[]; slaLeads: Array<{ id: string; contact: Row["contact"] }>; followUps: Row[] } | null>(null);
  useEffect(() => {
    fetch("/api/today").then((r) => r.json()).then(setData);
  }, []);
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-6">{t("today.title")}</h1>
      <div className="grid lg:grid-cols-2 gap-4">
        <Section title={t("today.tasks")} items={data?.tasks || []} localeTag={localeTag} t={t} timeKey="dueAt" />
        <Section title={t("today.demos")} items={data?.meetings || []} localeTag={localeTag} t={t} timeKey="startsAt" />
        <div className="card p-5">
          <div className="font-medium mb-2">{t("today.sla")}</div>
          {(data?.slaLeads || []).length === 0 && <div className="muted text-sm">{t("common.noData")}</div>}
          {(data?.slaLeads || []).map((l) => (
            <Link key={l.id} href={`/contacts/${l.contact?.id}`} className="block text-sm border-t border-[#243049] py-2 text-[#93c5fd]">
              {l.contact?.firstName} · {l.contact?.phoneDisplay}
            </Link>
          ))}
        </div>
        <div className="card p-5">
          <div className="font-medium mb-2">{t("today.followUps")}</div>
          {(data?.followUps || []).length === 0 && <div className="muted text-sm">{t("common.noData")}</div>}
          {(data?.followUps || []).map((c) => (
            <Link key={c.id} href={`/contacts/${c.id}`} className="block text-sm border-t border-[#243049] py-2 text-[#93c5fd]">
              {c.firstName} · {c.phoneDisplay} · {c.reason}
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function Section({ title, items, localeTag, t, timeKey }: { title: string; items: Row[]; localeTag: string; t: (p: string) => string; timeKey: "dueAt" | "startsAt" }) {
  return (
    <div className="card p-5">
      <div className="font-medium mb-2">{title}</div>
      {items.length === 0 && <div className="muted text-sm">{t("common.noData")}</div>}
      {items.map((item) => (
        <div key={item.id} className="text-sm border-t border-[#243049] py-2">
          {item.contact ? (
            <Link href={`/contacts/${item.contact.id}`} className="text-[#93c5fd]">
              {item.contact.firstName} {item.contact.lastName}
            </Link>
          ) : null}
          <div>{item.description}</div>
          <div className="muted text-xs">{item[timeKey] ? new Date(item[timeKey] as string).toLocaleString(localeTag) : ""}</div>
        </div>
      ))}
    </div>
  );
}
