"use client";

import { useState } from "react";
import { useI18n } from "@/components/I18nProvider";

type Task = { id: string; description: string; dueAt: string; status: string; type: string };

function localInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function presetDue(kind: "today" | "evening" | "tomorrow" | "in3days") {
  const due = new Date();
  if (kind === "today") {
    due.setHours(due.getHours() + 3, 0, 0, 0);
    return due;
  }
  if (kind === "evening") {
    due.setHours(18, 0, 0, 0);
    if (due.getTime() <= Date.now()) due.setDate(due.getDate() + 1);
    return due;
  }
  if (kind === "tomorrow") {
    due.setDate(due.getDate() + 1);
    due.setHours(10, 0, 0, 0);
    return due;
  }
  due.setDate(due.getDate() + 3);
  due.setHours(10, 0, 0, 0);
  return due;
}

export function ContactTaskForm({
  contactId,
  tasks,
  onChange,
}: {
  contactId: string;
  tasks: Task[];
  onChange: () => void;
}) {
  const { t, localeTag } = useI18n();
  const [description, setDescription] = useState(t("contact.laterCall"));
  const [dueAt, setDueAt] = useState(localInput(presetDue("tomorrow")));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function pickWhen(kind: "today" | "evening" | "tomorrow" | "in3days") {
    setDueAt(localInput(presetDue(kind)));
    if (kind === "evening") setDescription(t("contact.eveningCall"));
    else setDescription(t("contact.laterCall"));
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || !dueAt) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactId,
        type: "CALL",
        description: description.trim(),
        dueAt: new Date(dueAt).toISOString(),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(t("contact.taskFailed"));
      return;
    }
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

  const open = tasks.filter((x) => x.status === "OPEN");

  return (
    <div className="space-y-3">
      <div className="font-medium">{t("contact.addTask")}</div>
      <form onSubmit={create} className="space-y-2">
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("contact.laterCall")} />
        <div className="flex flex-wrap gap-2">
          <button type="button" className="chip" onClick={() => pickWhen("today")}>
            {t("followUps.today")}
          </button>
          <button type="button" className="chip" onClick={() => pickWhen("evening")}>
            {t("contact.eveningCall")}
          </button>
          <button type="button" className="chip" onClick={() => pickWhen("tomorrow")}>
            {t("followUps.tomorrow")}
          </button>
          <button type="button" className="chip" onClick={() => pickWhen("in3days")}>
            {t("followUps.in3days")}
          </button>
        </div>
        <label className="text-xs muted block">
          {t("contact.taskDue")}
          <input type="datetime-local" className="mt-1" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
        </label>
        <button className="rounded-xl bg-[#2563eb] px-3 py-2 text-sm" disabled={busy}>
          {t("common.create")}
        </button>
      </form>
      {error && <div className="text-sm text-[#f87171]">{error}</div>}
      <div className="space-y-2">
        {open.length === 0 && <div className="muted text-sm">{t("contact.noTasks")}</div>}
        {open.map((task) => (
          <div key={task.id} className="flex justify-between gap-2 text-sm border-t border-[#243049] pt-2">
            <div>
              <div>{task.description}</div>
              <div className="muted text-xs">
                {t(`taskTypes.${task.type}`, task.type)} · {new Date(task.dueAt).toLocaleString(localeTag)}
              </div>
            </div>
            <button type="button" className="chip shrink-0" onClick={() => done(task.id)}>
              {t("tasks.markDone")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
