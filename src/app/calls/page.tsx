"use client";

import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";

type Call = {
  id: string;
  direction: string;
  status: string;
  fromNumber: string;
  toNumber: string;
  duration: number;
  startedAt: string;
  recordingUrl?: string | null;
  result?: string | null;
  contact?: { firstName: string; lastName: string; id: string };
  manager?: { name: string };
};

const RESULTS = ["CONTACTED","NO_ANSWER","CALLBACK","INTERESTED","DEMO_BOOKED","THINKING","REJECTED","SALE"];
const LABELS: Record<string, string> = {
  CONTACTED: "Связались",
  NO_ANSWER: "Не ответил",
  CALLBACK: "Перезвонить",
  INTERESTED: "Заинтересован",
  DEMO_BOOKED: "Записан на демо",
  THINKING: "Думает",
  REJECTED: "Отказ",
  SALE: "Продажа",
};

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [modal, setModal] = useState<Call | null>(null);
  const [callbackAt, setCallbackAt] = useState("");
  useEffect(() => {
    fetch("/api/calls").then((r) => r.json()).then(setCalls);
  }, []);

  async function setResult(result: string) {
    if (!modal) return;
    await fetch("/api/calls", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callId: modal.id, result, callbackAt: result === "CALLBACK" ? callbackAt : undefined }),
    });
    setModal(null);
    setCalls(await fetch("/api/calls").then((r) => r.json()));
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-6">Звонки</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#182235] text-[#93a0bb]">
            <tr>
              <th className="text-left p-3">Клиент</th>
              <th className="text-left p-3">Направление</th>
              <th className="text-left p-3">Статус</th>
              <th className="text-left p-3">Длительность</th>
              <th className="text-left p-3">Менеджер</th>
              <th className="text-left p-3">Запись</th>
              <th className="text-left p-3">Результат</th>
            </tr>
          </thead>
          <tbody>
            {calls.map((c) => (
              <tr key={c.id} className="border-t border-[#243049]">
                <td className="p-3">{c.contact ? `${c.contact.firstName} ${c.contact.lastName}` : c.fromNumber}</td>
                <td className="p-3">{c.direction}</td>
                <td className="p-3">{c.status}</td>
                <td className="p-3">{Math.floor(c.duration / 60)}:{String(c.duration % 60).padStart(2, "0")}</td>
                <td className="p-3">{c.manager?.name}</td>
                <td className="p-3">
                  {c.recordingUrl ? (
                    <audio controls src={c.recordingUrl} className="h-8" />
                  ) : "—"}
                </td>
                <td className="p-3">
                  <button className="chip" onClick={() => setModal(c)}>{c.result ? LABELS[c.result] : "Указать"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <div className="fixed inset-0 bg-black/50 grid place-items-center p-4">
          <div className="card p-6 w-full max-w-md space-y-3">
            <div className="font-medium">Результат звонка</div>
            {RESULTS.map((r) => (
              <button key={r} className="w-full text-left chip" onClick={() => setResult(r)}>
                {LABELS[r]}
              </button>
            ))}
            <input type="datetime-local" value={callbackAt} onChange={(e) => setCallbackAt(e.target.value)} />
            <button className="text-sm muted" onClick={() => setModal(null)}>Закрыть</button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
