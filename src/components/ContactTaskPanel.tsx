"use client";

import { useI18n } from "@/components/I18nProvider";
import { addDays, startOfDay } from "date-fns";
import { CheckCircle2, PhoneCall } from "lucide-react";
import { useState } from "react";

type Task = { id: string; description: string; dueAt: string; status: string; type: string };

const TASK_TYPES = ["CALL", "WHATSAPP", "DEMO", "MEETING", "SEND_PROPOSAL", "FOLLOW_UP", "OTHER"];

function defaultDueAt() {
  const date = addDays(startOfDay(new Date()), 1);
  date.setHours(10, 0, 0, 0);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function ContactTaskPanel({
  contactId,
  clientName,
  phone,
  address,
  managerId,
  managerName,
  tasks,
  onChange,
}: {
  contactId: string;
  clientName: string;
  phone: string;
  address?: string;
  managerId?: string;
  managerName?: string;
  tasks: Task[];
  onChange: () => void;
}) {
  const { t, localeTag } = useI18n();
  const [form, setForm] = useState({ type: "CALL", description: "", dueAt: defaultDueAt() });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function createTask(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactId,
        managerId,
        type: form.type,
        description: form.description,
        dueAt: new Date(form.dueAt).toISOString(),
      }),
    });
    if (!response.ok) setError(t("quickActions.taskFailed"));
    else {
      setForm({ type: "CALL", description: "", dueAt: defaultDueAt() });
      onChange();
    }
    setSaving(false);
  }

  async function completeTask(id: string) {
    const response = await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "DONE" }),
    });
    if (response.ok) onChange();
  }

  const openTasks = tasks.filter((task) => task.status === "OPEN");

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center gap-2 font-medium">
        <PhoneCall className="h-4 w-4 text-[#60a5fa]" />
        {t("contact.newTask")}
      </div>
      <div className="mb-4 grid gap-2 rounded-xl border border-[#243049] bg-[#0e1626] p-3 text-sm">
        <div><span className="muted">{t("common.client")}:</span> {clientName}</div>
        <div className="whitespace-nowrap"><span className="muted">{t("common.phone")}:</span> {phone}</div>
        <div><span className="muted">{t("contact.address")}:</span> {address || t("common.dash")}</div>
        <div><span className="muted">{t("common.manager")}:</span> {managerName || t("common.dash")}</div>
      </div>
      <form className="space-y-2" onSubmit={createTask}>
        <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
          {TASK_TYPES.map((type) => <option key={type} value={type}>{t(`taskTypes.${type}`)}</option>)}
        </select>
        <input required type="datetime-local" value={form.dueAt} onChange={(event) => setForm({ ...form, dueAt: event.target.value })} />
        <textarea required rows={3} placeholder={t("quickActions.what")} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        <button disabled={saving} className="w-full rounded-xl bg-[#2563eb] px-3 py-2 text-sm disabled:opacity-60">{t("quickActions.createTask")}</button>
      </form>
      {error && <div className="mt-2 text-xs text-[#f87171]">{error}</div>}
      <div className="mt-5 space-y-2">
        <div className="muted text-xs">{t("contact.openTasks", { count: openTasks.length })}</div>
        {openTasks.slice(0, 5).map((task) => (
          <div key={task.id} className="flex items-start justify-between gap-2 border-t border-[#243049] pt-2 text-sm">
            <div className="min-w-0"><div className="break-words">{task.description}</div><div className="muted text-xs">{new Date(task.dueAt).toLocaleString(localeTag)}</div></div>
            <button type="button" title={t("tasks.markDone")} className="shrink-0 p-1 text-[#6ee7b7]" onClick={() => completeTask(task.id)}><CheckCircle2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
