"use client";

import { AppShell } from "@/components/AppShell";
import { useEffect, useMemo, useState } from "react";
import { addDays, isBefore, isSameDay, startOfDay } from "date-fns";

type Task = {
  id: string;
  type: string;
  description: string;
  dueAt: string;
  status: string;
  contact?: { firstName: string; lastName: string };
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [form, setForm] = useState({ type: "CALL", description: "", dueAt: "" });
  useEffect(() => {
    fetch("/api/tasks").then((r) => r.json()).then(setTasks);
  }, []);
  const groups = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const tom = addDays(today, 1);
    const week = addDays(today, 7);
    return {
      overdue: tasks.filter((t) => t.status === "OPEN" && isBefore(new Date(t.dueAt), today)),
      today: tasks.filter((t) => t.status === "OPEN" && isSameDay(new Date(t.dueAt), today)),
      tomorrow: tasks.filter((t) => t.status === "OPEN" && isSameDay(new Date(t.dueAt), tom)),
      week: tasks.filter((t) => t.status === "OPEN" && new Date(t.dueAt) > tom && new Date(t.dueAt) <= week),
      done: tasks.filter((t) => t.status === "DONE"),
    };
  }, [tasks]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setTasks(await fetch("/api/tasks").then((r) => r.json()));
  }
  async function done(id: string) {
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "DONE" }),
    });
    setTasks(await fetch("/api/tasks").then((r) => r.json()));
  }

  const labels: Record<string, string> = {
    overdue: "Просрочено",
    today: "Сегодня",
    tomorrow: "Завтра",
    week: "Неделя",
    done: "Выполнено",
  };

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-4">Задачи</h1>
      <form onSubmit={create} className="card p-4 mb-6 grid md:grid-cols-4 gap-3">
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          {["CALL","WHATSAPP","DEMO","MEETING","SEND_PROPOSAL","FOLLOW_UP","OTHER"].map((t) => <option key={t}>{t}</option>)}
        </select>
        <input placeholder="Описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input type="datetime-local" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} />
        <button className="rounded-xl bg-[#2563eb]">Создать</button>
      </form>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Object.entries(groups).map(([key, list]) => (
          <div key={key} className="card p-4">
            <div className="font-medium mb-3">{labels[key]}</div>
            <div className="space-y-2">
              {list.map((t) => (
                <div key={t.id} className="flex justify-between gap-2 text-sm">
                  <div>
                    <div>{t.description}</div>
                    <div className="muted text-xs">{t.type} · {t.contact ? `${t.contact.firstName}` : ""} · {new Date(t.dueAt).toLocaleString("ru")}</div>
                  </div>
                  {t.status === "OPEN" && (
                    <button className="chip" onClick={() => done(t.id)}>Готово</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
