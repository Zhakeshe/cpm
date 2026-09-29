"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/components/I18nProvider";

type Task = { id: string; description: string; dueAt: string; status: string; type: string };

function todayYmd() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function ContactTaskForm({
  contactId,
  clientName,
  phone,
  address,
  managerId,
  tasks,
  onChange,
}: {
  contactId: string;
  clientName: string;
  phone: string;
  address: string;
  managerId?: string | null;
  tasks: Task[];
  onChange: () => void;
}) {
  const { t, localeTag } = useI18n();
  const [date, setDate] = useState(todayYmd);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const open = useMemo(() => tasks.filter((x) => x.status === "OPEN"), [tasks]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const due = date ? new Date(`${date}T10:00:00+05:00`) : new Date();
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactId,
        managerId: managerId || undefined,
        type: "CALL",
        description: comment.trim() || t("contact.laterCall"),
        dueAt: due.toISOString(),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(t("contact.taskFailed"));
      return;
    }
    setComment("");
    setNotice(t("contact.taskSaved"));
    onChange();
  }

  async function done(id: string) {
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "DONE" }),
    });
    onChange();
  }

  return (
    <div className="card p-5 space-y-3">
      <div className="font-medium">{t("contact.taskSheet")}</div>
      <form onSubmit={create} className="space-y-2">
        <label className="text-sm block">
          {t("common.date")}
          <input type="date" className="mt-1" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="text-sm block">
          {t("common.client")}
          <input className="mt-1" value={clientName} readOnly />
        </label>
        <label className="text-sm block">
          {t("common.phone")}
          <input className="mt-1" value={phone} readOnly />
        </label>
        <label className="text-sm block">
          {t("contact.address")}
          <input className="mt-1" value={address || t("common.dash")} readOnly />
        </label>
        <label className="text-sm block">
          {t("common.comment")}
          <textarea className="mt-1" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t("contact.laterCall")} />
        </label>
        <button className="rounded-xl bg-[#2563eb] px-3 py-2 text-sm w-full" disabled={busy}>
          {t("common.save")}
        </button>
      </form>
      {error && <div className="text-sm text-[#f87171]">{error}</div>}
      {notice && <div className="text-sm text-[#34d399]">{notice}</div>}
      {open.map((task) => (
        <div key={task.id} className="flex justify-between gap-2 text-sm border-t border-[#243049] pt-2">
          <div>
            <div>{task.description}</div>
            <div className="muted text-xs">{new Date(task.dueAt).toLocaleString(localeTag)}</div>
          </div>
          <button type="button" className="chip shrink-0" onClick={() => done(task.id)}>
            {t("tasks.markDone")}
          </button>
        </div>
      ))}
    </div>
  );
}
