"use client";

import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";

type Template = {
  id: string;
  name: string;
  metaName: string;
  language: string;
  category: string;
  body: string;
  status: string;
  isActive: boolean;
};

function TemplatesSection() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [draft, setDraft] = useState({
    name: "",
    metaName: "",
    language: "ru",
    category: "MARKETING",
    body: "",
    status: "APPROVED",
  });

  async function load() {
    setTemplates(await fetch("/api/templates").then((r) => (r.ok ? r.json() : [])));
  }
  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, isActive: true }),
    });
    setDraft({ ...draft, name: "", metaName: "", body: "" });
    load();
  }

  async function patch(id: string, data: object) {
    await fetch("/api/templates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    load();
  }

  return (
    <div className="card p-5 mb-6 space-y-3">
      <div className="font-medium">Шаблоны WhatsApp</div>
      <div className="muted text-sm">
        Отправляются вне 24-часового окна. В CRM доступны только шаблоны со статусом APPROVED в Meta.
      </div>
      <form onSubmit={create} className="grid md:grid-cols-5 gap-2">
        <input placeholder="Название" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <input placeholder="Имя в Meta" value={draft.metaName} onChange={(e) => setDraft({ ...draft, metaName: e.target.value })} />
        <input placeholder="Язык" value={draft.language} onChange={(e) => setDraft({ ...draft, language: e.target.value })} />
        <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
          <option value="APPROVED">APPROVED</option>
          <option value="PENDING">PENDING</option>
          <option value="REJECTED">REJECTED</option>
        </select>
        <button className="rounded-xl bg-[#2563eb]">Добавить</button>
        <textarea
          className="md:col-span-5"
          rows={2}
          placeholder="Текст шаблона, переменные вида {{1}}"
          value={draft.body}
          onChange={(e) => setDraft({ ...draft, body: e.target.value })}
        />
      </form>
      <div className="space-y-2">
        {templates.map((t) => (
          <div key={t.id} className="border-t border-[#243049] pt-2 text-sm">
            <div className="flex justify-between gap-2">
              <div>
                <div className="font-medium">{t.name}</div>
                <div className="muted text-xs">
                  {t.metaName} · {t.language} · {t.category}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="chip">{t.status}</span>
                <label className="text-xs flex items-center gap-1">
                  <input
                    type="checkbox"
                    className="w-auto"
                    checked={t.isActive}
                    onChange={(e) => patch(t.id, { isActive: e.target.checked })}
                  />
                  активен
                </label>
              </div>
            </div>
            <div className="muted text-xs whitespace-pre-line mt-1">{t.body}</div>
          </div>
        ))}
        {templates.length === 0 && <div className="muted text-sm">Шаблонов пока нет</div>}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [data, setData] = useState<{
    integrations: Array<{ type: string; status: string; lastSyncAt?: string; lastError?: string }>;
    sla: { enabled: boolean; minutes: number; action: string };
    routing: { existingContact: string; fallback: string };
  } | null>(null);
  const [stages, setStages] = useState<
    Array<{ id?: string; name: string; slug: string; order: number; isActive: boolean; requiredFields?: string[] }>
  >([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/settings").then(async (r) => {
      if (!r.ok) setErr("Нет доступа к настройкам");
      else setData(await r.json());
    });
    fetch("/api/pipeline").then((r) => r.json()).then((s) => {
      if (Array.isArray(s)) setStages(s.map((x: { id: string; name: string; slug: string; order: number; isActive: boolean }) => x));
    });
  }, []);

  async function saveSla() {
    if (!data) return;
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sla: data.sla, routing: data.routing }),
    });
  }

  async function saveStages() {
    await fetch("/api/pipeline/stages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stages),
    });
  }

  if (err) {
    return (
      <AppShell>
        <div className="card p-6">{err}</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-6">Настройки</h1>
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {(data?.integrations || [
          { type: "WHATSAPP_BUSINESS", status: "DISCONNECTED" },
          { type: "TELEPHONY", status: "DISCONNECTED" },
          { type: "META_LEADS", status: "DISCONNECTED" },
        ]).map((i) => (
          <div key={i.type} className="card p-5">
            <div className="font-medium">{i.type.replaceAll("_", " ")}</div>
            <div className="chip mt-2">{i.status}</div>
            <div className="text-xs muted mt-2">Последняя синхронизация: {i.lastSyncAt || "—"}</div>
            <div className="text-xs text-[#f87171]">{i.lastError}</div>
          </div>
        ))}
      </div>
      <div className="card p-5 mb-6 space-y-3">
        <div className="font-medium">SLA обработки лида</div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="w-auto" checked={!!data?.sla.enabled} onChange={(e) => data && setData({ ...data, sla: { ...data.sla, enabled: e.target.checked } })} />
          Включить
        </label>
        <input type="number" value={data?.sla.minutes || 10} onChange={(e) => data && setData({ ...data, sla: { ...data.sla, minutes: Number(e.target.value) } })} />
        <select value={data?.sla.action} onChange={(e) => data && setData({ ...data, sla: { ...data.sla, action: e.target.value } })}>
          <option value="NOTIFY_MANAGER">Уведомить менеджера</option>
          <option value="NOTIFY_ADMIN">Уведомить руководителя</option>
          <option value="REASSIGN">Передать следующему менеджеру</option>
        </select>
        <div className="font-medium pt-2">Маршрутизация звонков</div>
        <select value={data?.routing.existingContact} onChange={(e) => data && setData({ ...data, routing: { ...data.routing, existingContact: e.target.value } })}>
          <option value="responsible">Сначала ответственный</option>
          <option value="queue">Сразу очередь</option>
        </select>
        <select value={data?.routing.fallback} onChange={(e) => data && setData({ ...data, routing: { ...data.routing, fallback: e.target.value } })}>
          <option value="queue">Следующий доступный</option>
          <option value="group">Группа менеджеров</option>
        </select>
        <button className="rounded-xl bg-[#2563eb] px-4 py-2" onClick={saveSla}>Сохранить</button>
      </div>
      <TemplatesSection />
      <div className="card p-5 space-y-3">
        <div className="font-medium">Стадии воронки</div>
        {stages.map((s, idx) => (
          <div key={s.id || idx} className="grid grid-cols-4 gap-2">
            <input value={s.name} onChange={(e) => {
              const next = [...stages];
              next[idx] = { ...s, name: e.target.value };
              setStages(next);
            }} />
            <input value={s.slug} onChange={(e) => {
              const next = [...stages];
              next[idx] = { ...s, slug: e.target.value };
              setStages(next);
            }} />
            <input type="number" value={s.order} onChange={(e) => {
              const next = [...stages];
              next[idx] = { ...s, order: Number(e.target.value) };
              setStages(next);
            }} />
            <label className="text-sm flex items-center gap-2">
              <input type="checkbox" className="w-auto" checked={s.isActive} onChange={(e) => {
                const next = [...stages];
                next[idx] = { ...s, isActive: e.target.checked };
                setStages(next);
              }} />
              активна
            </label>
            <input
              className="col-span-4"
              placeholder="Обязательные поля через запятую: dealAmount, email, comment"
              value={(s.requiredFields || []).join(", ")}
              onChange={(e) => {
                const next = [...stages];
                next[idx] = {
                  ...s,
                  requiredFields: e.target.value
                    .split(",")
                    .map((f) => f.trim())
                    .filter(Boolean),
                };
                setStages(next);
              }}
            />
          </div>
        ))}
        <button className="chip" onClick={() => setStages([...stages, { name: "Новая", slug: `stage-${stages.length + 1}`, order: stages.length + 1, isActive: true }])}>+ стадия</button>
        <button className="rounded-xl bg-[#2563eb] px-4 py-2" onClick={saveStages}>Сохранить воронку</button>
      </div>
    </AppShell>
  );
}
