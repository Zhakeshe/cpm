"use client";

import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  phoneDisplay: string;
  email?: string | null;
  source: string;
  comment: string;
  dealAmount: string | number;
  status: string;
  customFields: Record<string, unknown>;
  manager?: { id: string; name: string };
  pipelineStage?: { name: string };
  activities: Array<{ id: string; title: string; createdAt: string }>;
  calls: Array<{ id: string; direction: string; duration: number; recordingUrl?: string | null; status: string }>;
};

export default function ContactPage() {
  const params = useParams<{ id: string }>();
  const [c, setC] = useState<Contact | null>(null);
  const [managers, setManagers] = useState<Array<{ id: string; name: string; role: string }>>([]);
  const [me, setMe] = useState<{ role: string } | null>(null);
  useEffect(() => {
    fetch(`/api/contacts/${params.id}`).then((r) => r.json()).then(setC);
    fetch("/api/users").then((r) => r.json()).then(setManagers);
    fetch("/api/auth/me").then((r) => r.json()).then(setMe);
  }, [params.id]);

  async function call() {
    await fetch("/api/calls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId: params.id }),
    });
    alert("Звонок инициирован");
  }
  async function save() {
    if (!c) return;
    await fetch("/api/contacts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, comment: c.comment, dealAmount: Number(c.dealAmount), email: c.email }),
    });
  }
  async function reassign(managerId: string) {
    await fetch("/api/contacts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId: params.id, managerId }),
    });
    setC(await fetch(`/api/contacts/${params.id}`).then((r) => r.json()));
  }

  if (!c) {
    return <AppShell>Загрузка…</AppShell>;
  }

  return (
    <AppShell>
      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-4">
          <div className="card p-6">
            <div className="flex justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold">{c.firstName} {c.lastName}</h1>
                <div className="muted">{c.phoneDisplay} · {c.email}</div>
              </div>
              <button className="rounded-xl bg-[#2563eb] px-4" onClick={call}>Позвонить</button>
            </div>
            <div className="grid md:grid-cols-2 gap-3 mt-4">
              <div>Источник: {c.source}</div>
              <div>Стадия: {c.pipelineStage?.name}</div>
              <div>Статус: {c.status}</div>
              <div>Менеджер: {c.manager?.name}</div>
              <label>Сумма
                <input value={String(c.dealAmount)} onChange={(e) => setC({ ...c, dealAmount: e.target.value })} />
              </label>
              <label>Email
                <input value={c.email || ""} onChange={(e) => setC({ ...c, email: e.target.value })} />
              </label>
            </div>
            <textarea className="mt-3" rows={3} value={c.comment} onChange={(e) => setC({ ...c, comment: e.target.value })} />
            <button className="mt-3 rounded-xl bg-[#1d4ed8] px-4 py-2" onClick={save}>Сохранить</button>
            {(me?.role === "ADMIN" || me?.role === "SUPERVISOR") && (
              <label className="block mt-4 text-sm">
                Сменить менеджера
                <select className="mt-1" value={c.manager?.id || ""} onChange={(e) => reassign(e.target.value)}>
                  {managers.filter((m) => m.role !== "ADMIN").map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <div className="card p-6">
            <div className="font-medium mb-3">Записи разговоров</div>
            {c.calls.map((call) => (
              <div key={call.id} className="flex items-center justify-between py-2 border-t border-[#243049]">
                <div className="text-sm">{call.direction} · {call.status} · {call.duration}s</div>
                {call.recordingUrl && <audio controls src={call.recordingUrl} className="h-8" />}
              </div>
            ))}
          </div>
        </div>
        <div className="card p-6">
          <div className="font-medium mb-4">История</div>
          <div className="space-y-3">
            {c.activities.map((a) => (
              <div key={a.id} className="text-sm">
                <div className="muted text-xs">{new Date(a.createdAt).toLocaleString("ru")}</div>
                <div>{a.title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
