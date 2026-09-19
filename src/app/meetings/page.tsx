"use client";

import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/components/I18nProvider";
import { useEffect, useState } from "react";

type Meeting = {
  id: string;
  startsAt: string;
  format: string;
  status: string;
  comment: string;
  contact?: { firstName: string; lastName: string };
  manager?: { name: string };
};

const FORMATS = ["ONLINE", "OFFLINE", "PHONE"];
const STATUSES = ["COMPLETED", "CANCELLED", "NO_SHOW"];

export default function MeetingsPage() {
  const { t, localeTag } = useI18n();
  const [items, setItems] = useState<Meeting[]>([]);
  const [form, setForm] = useState({ startsAt: "", format: "ONLINE", comment: "" });
  useEffect(() => {
    fetch("/api/meetings")
      .then((r) => r.json())
      .then(setItems);
  }, []);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setItems(await fetch("/api/meetings").then((r) => r.json()));
  }
  async function setStatus(id: string, status: string) {
    await fetch("/api/meetings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setItems(await fetch("/api/meetings").then((r) => r.json()));
  }
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-4">{t("meetings.title")}</h1>
      <form onSubmit={create} className="card p-4 mb-6 grid md:grid-cols-4 gap-3">
        <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
        <select value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
          {FORMATS.map((f) => (
            <option key={f} value={f}>
              {t(`meetingFormats.${f}`)}
            </option>
          ))}
        </select>
        <input placeholder={t("common.comment")} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
        <button className="rounded-xl bg-[#2563eb]">{t("common.create")}</button>
      </form>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#182235] text-[#93a0bb]">
            <tr>
              <th className="text-left p-3">{t("common.date")}</th>
              <th className="text-left p-3">{t("common.client")}</th>
              <th className="text-left p-3">{t("meetings.format")}</th>
              <th className="text-left p-3">{t("common.status")}</th>
              <th className="text-left p-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id} className="border-t border-[#243049]">
                <td className="p-3">{new Date(m.startsAt).toLocaleString(localeTag)}</td>
                <td className="p-3">{m.contact ? `${m.contact.firstName} ${m.contact.lastName}` : t("common.dash")}</td>
                <td className="p-3">{t(`meetingFormats.${m.format}`, m.format)}</td>
                <td className="p-3">{t(`meetingStatuses.${m.status}`, m.status)}</td>
                <td className="p-3 space-x-2">
                  {STATUSES.map((s) => (
                    <button key={s} className="chip" onClick={() => setStatus(m.id, s)}>
                      {t(`meetingStatuses.${s}`)}
                    </button>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
