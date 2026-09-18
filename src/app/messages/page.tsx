"use client";

import { AppShell } from "@/components/AppShell";
import { useCallback, useEffect, useState } from "react";
import { useRealtime } from "@/lib/use-realtime";

type Conv = {
  id: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    phoneDisplay: string;
    pipelineStage?: { name: string };
    manager?: { name: string };
    comment?: string;
    dealAmount?: string | number;
  };
  manager?: { name: string };
};
type Message = { id: string; text: string | null; direction: string; status: string; sentAt: string };

export default function MessagesPage() {
  const [list, setList] = useState<Conv[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [thread, setThread] = useState<{ messages: Message[]; contact: Conv["contact"] } | null>(null);
  const [text, setText] = useState("");

  const loadList = useCallback(async () => {
    setList(await fetch("/api/messages").then((r) => r.json()));
  }, []);

  const open = useCallback(async (id: string) => {
    setActive(id);
    const data = await fetch(`/api/messages/${id}`).then((r) => r.json());
    setThread(data);
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useRealtime({
    "whatsapp:message": (payload: { conversationId?: string }) => {
      loadList();
      if (payload?.conversationId && payload.conversationId === active) open(active);
    },
  });

  async function send() {
    if (!thread || !text.trim()) return;
    await fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId: thread.contact.id, text }),
    });
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
              <div className="text-xs muted">{c.manager?.name} · {c.contact.pipelineStage?.name}</div>
            </button>
          ))}
        </div>
        <div className="card flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {thread?.messages.map((m) => (
              <div key={m.id} className={`max-w-[80%] rounded-2xl px-3 py-2 ${m.direction === "OUTBOUND" ? "ml-auto bg-[#1d4ed8]" : "bg-[#182235]"}`}>
                <div>{m.text}</div>
                <div className="text-[10px] opacity-70">{m.status.toLowerCase()}</div>
              </div>
            ))}
          </div>
          <div className="p-3 flex gap-2 border-t border-[#243049]">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Сообщение или шаблон" />
            <button className="rounded-xl bg-[#2563eb] px-4" onClick={send}>Отправить</button>
          </div>
        </div>
        <div className="card p-4">
          {thread ? (
            <div className="space-y-2 text-sm">
              <div className="text-lg font-medium">{thread.contact.firstName} {thread.contact.lastName}</div>
              <div>{thread.contact.phoneDisplay}</div>
              <div>Менеджер: {thread.contact.manager?.name}</div>
              <div>Стадия: {thread.contact.pipelineStage?.name}</div>
              <div>Сумма: {Number(thread.contact.dealAmount || 0)}</div>
              <div className="muted">{thread.contact.comment}</div>
              <a className="text-[#93c5fd]" href={`/contacts/${thread.contact.id}`}>Открыть карточку</a>
            </div>
          ) : (
            <div className="muted">Выберите диалог</div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
