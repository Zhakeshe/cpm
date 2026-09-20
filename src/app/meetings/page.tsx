"use client";

import { AppShell } from "@/components/AppShell";
import { DemoBooker } from "@/components/DemoBooker";
import { useI18n } from "@/components/I18nProvider";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Meeting = {
  id: string;
  startsAt: string;
  format: string;
  status: string;
  comment: string;
  contactId?: string | null;
  contact?: { id?: string; firstName: string; lastName: string } | null;
  manager?: { name: string };
};

type Contact = { id: string; firstName: string; lastName: string; phoneDisplay: string };

const STATUSES = ["COMPLETED", "CANCELLED", "NO_SHOW"];

export default function MeetingsPage() {
  const { t, localeTag } = useI18n();
  const [items, setItems] = useState<Meeting[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactId, setContactId] = useState("");
  const [reschedule, setReschedule] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const [meetings, people] = await Promise.all([
      fetch("/api/meetings").then((r) => r.json()),
      fetch("/api/contacts").then((r) => r.json()),
    ]);
    setItems(Array.isArray(meetings) ? meetings : []);
    setContacts(Array.isArray(people) ? people : []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const days = useMemo(() => {
    const groups = new Map<string, Meeting[]>();
    for (const m of items.filter((row) => row.status === "SCHEDULED")) {
      const key = new Date(m.startsAt).toISOString().slice(0, 10);
      groups.set(key, [...(groups.get(key) || []), m]);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  async function setStatus(id: string, status: string) {
    await fetch("/api/meetings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await load();
  }

  async function move(id: string) {
    const startsAt = reschedule[id];
    if (!startsAt) return;
    await fetch("/api/meetings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, startsAt: new Date(startsAt).toISOString() }),
    });
    await load();
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-2">{t("meetings.title")}</h1>
      <p className="muted text-sm mb-4">{t("meetings.pageHint")}</p>
      <div className="grid lg:grid-cols-[360px_1fr] gap-6">
        <div className="card p-4 space-y-3">
          <select value={contactId} onChange={(e) => setContactId(e.target.value)}>
            <option value="">{t("meetings.pickClient")}</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName} · {c.phoneDisplay}
              </option>
            ))}
          </select>
          <DemoBooker contactId={contactId || undefined} onDone={load} />
        </div>
        <div className="space-y-4">
          {days.map(([day, list]) => (
            <div key={day} className="card p-4">
              <div className="font-medium mb-3">{new Date(day).toLocaleDateString(localeTag, { weekday: "long", day: "numeric", month: "long" })}</div>
              <div className="space-y-3">
                {list.map((m) => (
                  <div key={m.id} className="border-t border-[#243049] pt-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <div>
                        <div>{new Date(m.startsAt).toLocaleTimeString(localeTag, { hour: "2-digit", minute: "2-digit" })}</div>
                        <div>
                          {m.contact ? (
                            <Link href={`/contacts/${m.contact.id || m.contactId}`} className="text-[#93c5fd]">
                              {m.contact.firstName} {m.contact.lastName}
                            </Link>
                          ) : (
                            t("common.dash")
                          )}
                        </div>
                        <div className="muted text-xs">
                          {t(`meetingFormats.${m.format}`, m.format)} · {m.manager?.name || t("common.dash")}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-end">
                        {STATUSES.map((s) => (
                          <button key={s} className="chip" onClick={() => setStatus(m.id, s)}>
                            {t(`meetingStatuses.${s}`)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="datetime-local"
                        value={reschedule[m.id] || ""}
                        onChange={(e) => setReschedule({ ...reschedule, [m.id]: e.target.value })}
                      />
                      <button className="chip" onClick={() => move(m.id)}>
                        {t("meetings.reschedule")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {days.length === 0 && <div className="card p-6 muted">{t("meetings.empty")}</div>}
        </div>
      </div>
    </AppShell>
  );
}
