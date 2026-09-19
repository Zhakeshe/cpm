"use client";

import { AppShell } from "@/components/AppShell";
import { QuickActions } from "@/components/QuickActions";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Stage = { id: string; name: string; requiredFields: string[] };

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
  manager?: { id: string; name: string } | null;
  pipelineStage?: { id: string; name: string } | null;
  activities: Array<{ id: string; title: string; createdAt: string }>;
  calls: Array<{ id: string; direction: string; duration: number; recordingUrl?: string | null; status: string }>;
  tasks: Array<{ id: string; description: string; dueAt: string; status: string; type: string }>;
  meetings: Array<{ id: string; startsAt: string; status: string; format: string }>;
};

const FIELD_LABELS: Record<string, string> = {
  dealAmount: "Сумма сделки",
  email: "Email",
  comment: "Комментарий",
  whatsappNumber: "WhatsApp-номер",
  lastName: "Фамилия",
};

export default function ContactPage() {
  const params = useParams<{ id: string }>();
  const [c, setC] = useState<Contact | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [managers, setManagers] = useState<Array<{ id: string; name: string; role: string }>>([]);
  const [me, setMe] = useState<{ role: string } | null>(null);
  const [notice, setNotice] = useState("");
  const [problem, setProblem] = useState("");

  const load = useCallback(async () => {
    setC(await fetch(`/api/contacts/${params.id}`).then((r) => r.json()));
  }, [params.id]);

  useEffect(() => {
    load();
    fetch("/api/pipeline").then((r) => r.json()).then(setStages);
    fetch("/api/users").then((r) => r.json()).then(setManagers);
    fetch("/api/auth/me").then((r) => r.json()).then(setMe);
  }, [load]);

  async function patch(data: object) {
    setProblem("");
    setNotice("");
    const res = await fetch("/api/contacts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: params.id, ...data }),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      if (payload.error === "STAGE_FIELDS_REQUIRED") {
        const names = (payload.fields as string[]).map((f) => FIELD_LABELS[f] || f).join(", ");
        setProblem(`Для этой стадии сначала заполните: ${names}`);
      } else {
        setProblem("Не удалось сохранить");
      }
      return false;
    }
    setNotice("Сохранено");
    await load();
    return true;
  }

  async function reassign(managerId: string) {
    await fetch("/api/contacts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId: params.id, managerId }),
    });
    await load();
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
                <h1 className="text-2xl font-semibold">
                  {c.firstName} {c.lastName}
                </h1>
                <div className="muted">
                  {c.phoneDisplay} · {c.email}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <QuickActions contactId={c.id} compact onDone={load} />
            </div>

            <div className="grid md:grid-cols-2 gap-3 mt-4">
              <div>Источник: {c.source}</div>
              <div>Статус: {c.status}</div>
              <label>
                Стадия
                <select
                  className="mt-1"
                  value={c.pipelineStage?.id || ""}
                  onChange={(e) => patch({ pipelineStageId: e.target.value })}
                >
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {s.requiredFields.length ? ` (нужны: ${s.requiredFields.map((f) => FIELD_LABELS[f] || f).join(", ")})` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <div>Менеджер: {c.manager?.name}</div>
              <label>
                Сумма
                <input value={String(c.dealAmount)} onChange={(e) => setC({ ...c, dealAmount: e.target.value })} />
              </label>
              <label>
                Email
                <input value={c.email || ""} onChange={(e) => setC({ ...c, email: e.target.value })} />
              </label>
            </div>

            <textarea
              className="mt-3"
              rows={3}
              value={c.comment}
              onChange={(e) => setC({ ...c, comment: e.target.value })}
            />
            <button
              className="mt-3 rounded-xl bg-[#1d4ed8] px-4 py-2"
              onClick={() => patch({ comment: c.comment, dealAmount: Number(c.dealAmount), email: c.email })}
            >
              Сохранить
            </button>
            {problem && <div className="mt-2 text-sm text-[#fbbf24]">{problem}</div>}
            {notice && <div className="mt-2 text-sm text-[#34d399]">{notice}</div>}

            {(me?.role === "ADMIN" || me?.role === "SUPERVISOR") && (
              <label className="block mt-4 text-sm">
                Сменить менеджера
                <select className="mt-1" value={c.manager?.id || ""} onChange={(e) => reassign(e.target.value)}>
                  {managers
                    .filter((m) => m.role !== "ADMIN")
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                </select>
              </label>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="card p-5">
              <div className="font-medium mb-2">Задачи</div>
              {c.tasks.length === 0 && <div className="muted text-sm">Задач нет</div>}
              {c.tasks.slice(0, 6).map((t) => (
                <div key={t.id} className="text-sm border-t border-[#243049] py-2">
                  <div>{t.description}</div>
                  <div className="muted text-xs">
                    {t.type} · {new Date(t.dueAt).toLocaleString("ru")} · {t.status}
                  </div>
                </div>
              ))}
            </div>
            <div className="card p-5">
              <div className="font-medium mb-2">Демо и встречи</div>
              {c.meetings.length === 0 && <div className="muted text-sm">Встреч нет</div>}
              {c.meetings.slice(0, 6).map((m) => (
                <div key={m.id} className="text-sm border-t border-[#243049] py-2">
                  <div>{new Date(m.startsAt).toLocaleString("ru")}</div>
                  <div className="muted text-xs">
                    {m.format} · {m.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <div className="font-medium mb-3">Записи разговоров</div>
            {c.calls.length === 0 && <div className="muted text-sm">Звонков нет</div>}
            {c.calls.map((call) => (
              <div key={call.id} className="flex items-center justify-between py-2 border-t border-[#243049]">
                <div className="text-sm">
                  {call.direction} · {call.status} · {call.duration}s
                </div>
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
