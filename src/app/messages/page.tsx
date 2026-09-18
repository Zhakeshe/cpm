"use client";

import { AppShell } from "@/components/AppShell";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRealtime } from "@/lib/use-realtime";
import { Check, CheckCheck, Clock, AlertTriangle, Paperclip, Lock } from "lucide-react";

type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  phoneDisplay: string;
  pipelineStage?: { name: string } | null;
  manager?: { id: string; name: string } | null;
  comment?: string;
  dealAmount?: string | number;
  source?: string;
};

type Conv = {
  id: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  serviceWindowExpiresAt: string | null;
  unreadCount: number;
  contact: Contact;
  manager?: { id: string; name: string } | null;
};

type Message = {
  id: string;
  text: string | null;
  direction: string;
  status: string;
  type: string;
  sentAt: string;
  mediaUrl: string | null;
  mediaMimeType: string | null;
  mediaFileName: string | null;
};

type Template = {
  id: string;
  name: string;
  body: string;
  language: string;
  status: string;
  isActive: boolean;
  placeholders: string[];
};

function StatusTicks({ status }: { status: string }) {
  if (status === "FAILED") return <AlertTriangle size={12} className="text-[#f87171]" />;
  if (status === "READ") return <CheckCheck size={12} className="text-[#60a5fa]" />;
  if (status === "DELIVERED") return <CheckCheck size={12} className="opacity-70" />;
  if (status === "SENT") return <Check size={12} className="opacity-70" />;
  return <Clock size={12} className="opacity-70" />;
}

function MediaBubble({ message }: { message: Message }) {
  const src = `/api/media/${message.id}`;
  const mime = message.mediaMimeType || "";
  if (!message.mediaUrl) {
    return <div className="muted text-xs">Вложение ({message.type.toLowerCase()})</div>;
  }
  if (mime.startsWith("image/")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={message.mediaFileName || "image"} className="rounded-lg max-w-[240px]" />;
  }
  if (mime.startsWith("audio/")) return <audio controls src={src} className="h-8" />;
  if (mime.startsWith("video/")) return <video controls src={src} className="rounded-lg max-w-[260px]" />;
  return (
    <a href={src} className="underline text-sm" target="_blank" rel="noreferrer">
      {message.mediaFileName || "Документ"}
    </a>
  );
}

export default function MessagesPage() {
  const [list, setList] = useState<Conv[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [thread, setThread] = useState<{ messages: Message[]; contact: Contact; serviceWindowExpiresAt: string | null } | null>(null);
  const [text, setText] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [templateParams, setTemplateParams] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const loadList = useCallback(async () => {
    setList(await fetch("/api/messages").then((r) => r.json()));
  }, []);

  const open = useCallback(async (id: string) => {
    setActive(id);
    setError("");
    setThread(await fetch(`/api/messages/${id}`).then((r) => r.json()));
  }, []);

  useEffect(() => {
    loadList();
    fetch("/api/templates").then((r) => (r.ok ? r.json() : [])).then(setTemplates);
  }, [loadList]);

  useRealtime({
    "whatsapp:message": (payload: { conversationId?: string }) => {
      loadList();
      if (active && (!payload?.conversationId || payload.conversationId === active)) open(active);
    },
  });

  const windowOpen = thread?.serviceWindowExpiresAt
    ? new Date(thread.serviceWindowExpiresAt).getTime() > Date.now()
    : false;
  const approved = templates.filter((t) => t.isActive && t.status === "APPROVED");

  async function send() {
    if (!thread || !text.trim()) return;
    setError("");
    const res = await fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId: thread.contact.id, text }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error === "SERVICE_WINDOW_CLOSED" ? "Окно 24 часа закрыто — отправьте шаблон" : "Не удалось отправить");
      return;
    }
    setText("");
    if (active) await open(active);
    await loadList();
  }

  async function sendTemplate(template: Template) {
    if (!thread) return;
    const parameters = template.placeholders.map((p) => templateParams[`${template.id}:${p}`] || "");
    const res = await fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId: thread.contact.id, templateId: template.id, templateParameters: parameters }),
    });
    if (!res.ok) {
      setError("Шаблон не отправлен");
      return;
    }
    setPickerOpen(false);
    if (active) await open(active);
    await loadList();
  }

  async function sendFile(file: File) {
    if (!thread) return;
    setError("");
    const form = new FormData();
    form.append("contactId", thread.contact.id);
    form.append("file", file);
    const uploaded = await fetch("/api/messages/upload", { method: "POST", body: form });
    if (!uploaded.ok) {
      setError("Файл не загрузился");
      return;
    }
    const { media } = await uploaded.json();
    const res = await fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId: thread.contact.id, media, text: text || undefined }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error === "SERVICE_WINDOW_CLOSED" ? "Окно 24 часа закрыто — отправьте шаблон" : "Файл не отправлен");
      return;
    }
    setText("");
    if (active) await open(active);
    await loadList();
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-4">Сообщения</h1>
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-4 min-h-[70vh]">
        <div className="card overflow-y-auto">
          {list.map((c) => (
            <button
              key={c.id}
              onClick={() => open(c.id)}
              className={`w-full text-left p-3 border-b border-[#243049] ${active === c.id ? "bg-[#1d4ed8]/30" : ""}`}
            >
              <div className="flex justify-between">
                <div className="font-medium">{c.contact.firstName} {c.contact.lastName}</div>
                {c.unreadCount > 0 && <span className="chip">{c.unreadCount}</span>}
              </div>
              <div className="text-xs muted">{c.contact.phoneDisplay}</div>
              <div className="text-sm truncate mt-1">{c.lastMessage}</div>
              <div className="text-xs muted flex justify-between">
                <span>{c.manager?.name} · {c.contact.pipelineStage?.name}</span>
                <span>
                  {c.serviceWindowExpiresAt && new Date(c.serviceWindowExpiresAt).getTime() > Date.now() ? "🟢" : "🔒"}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="card flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {thread?.messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[80%] rounded-2xl px-3 py-2 ${m.direction === "OUTBOUND" ? "ml-auto bg-[#1d4ed8]" : "bg-[#182235]"}`}
              >
                {m.type !== "TEXT" && m.type !== "TEMPLATE" && <MediaBubble message={m} />}
                {m.text && <div className="mt-1">{m.text}</div>}
                <div className="flex items-center gap-1 justify-end text-[10px] opacity-70 mt-1">
                  {m.type === "TEMPLATE" && <span>шаблон</span>}
                  <span>{new Date(m.sentAt).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}</span>
                  {m.direction === "OUTBOUND" && <StatusTicks status={m.status} />}
                </div>
              </div>
            ))}
            {!thread && <div className="muted">Выберите диалог</div>}
          </div>

          {thread && (
            <div className="border-t border-[#243049] p-3 space-y-2">
              {windowOpen ? (
                <div className="text-xs text-[#34d399]">
                  🟢 Окно 24 часа открыто до {new Date(thread.serviceWindowExpiresAt!).toLocaleString("ru")}
                </div>
              ) : (
                <div className="text-xs text-[#fbbf24] flex items-center gap-2">
                  <Lock size={12} /> Окно обслуживания закрыто — доступны только шаблоны
                </div>
              )}
              {error && <div className="text-xs text-[#f87171]">{error}</div>}
              <div className="flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && windowOpen) send();
                  }}
                  disabled={!windowOpen}
                  placeholder={windowOpen ? "Сообщение" : "Недоступно вне окна 24 часа"}
                />
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) sendFile(file);
                    e.target.value = "";
                  }}
                />
                <button
                  className="chip"
                  disabled={!windowOpen}
                  title="Прикрепить файл"
                  onClick={() => fileRef.current?.click()}
                >
                  <Paperclip size={14} />
                </button>
                <button className="rounded-xl bg-[#2563eb] px-4 disabled:opacity-40" disabled={!windowOpen} onClick={send}>
                  Отправить
                </button>
                <button className="chip" onClick={() => setPickerOpen((v) => !v)}>
                  Шаблон
                </button>
              </div>
              {pickerOpen && (
                <div className="space-y-2 pt-2">
                  {approved.length === 0 && <div className="muted text-sm">Нет одобренных шаблонов Meta</div>}
                  {approved.map((t) => (
                    <div key={t.id} className="card p-3 space-y-2">
                      <div className="text-sm font-medium">{t.name}</div>
                      <div className="muted text-xs whitespace-pre-line">{t.body}</div>
                      {t.placeholders.map((p) => (
                        <input
                          key={p}
                          placeholder={`Значение ${p}`}
                          value={templateParams[`${t.id}:${p}`] || ""}
                          onChange={(e) => setTemplateParams({ ...templateParams, [`${t.id}:${p}`]: e.target.value })}
                        />
                      ))}
                      <button className="rounded-xl bg-[#2563eb] px-3 py-2 text-sm" onClick={() => sendTemplate(t)}>
                        Отправить шаблон
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card p-4">
          {thread ? (
            <div className="space-y-2 text-sm">
              <div className="text-lg font-medium">{thread.contact.firstName} {thread.contact.lastName}</div>
              <div>{thread.contact.phoneDisplay}</div>
              <div>Источник: {thread.contact.source}</div>
              <div>Менеджер: {thread.contact.manager?.name}</div>
              <div>Стадия: {thread.contact.pipelineStage?.name}</div>
              <div>Сумма: {Number(thread.contact.dealAmount || 0)}</div>
              <div className="muted">{thread.contact.comment}</div>
              <div className="flex flex-wrap gap-2 pt-2">
                <a className="chip" href={`/contacts/${thread.contact.id}`}>Карточка</a>
                <a className="chip" href={`/tasks`}>Задача</a>
                <a className="chip" href={`/meetings`}>Демо</a>
              </div>
            </div>
          ) : (
            <div className="muted">Выберите диалог</div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
