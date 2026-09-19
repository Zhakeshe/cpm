"use client";

import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";

type Meeting = {
  id: string;
  startsAt: string;
  format: string;
  status: string;
  comment: string;
  contact?: { firstName: string; lastName: string };
  manager?: { name: string };
};

export default function MeetingsPage() {
  const [items, setItems] = useState<Meeting[]>([]);
  const [form, setForm] = useState({ startsAt: "", format: "ONLINE", comment: "" });
  useEffect(() => {
    fetch("/api/meetings").then((r) => r.json()).then(setItems);
  }, []);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setItems(await fetch("/api/meetings").then((r) => r.json()));
  }
  async function setStatus(id: string, status: string) {
    await fetch("/api/meetings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setItems(await fetch("/api/meetings").then((r) => r.json()));
  }
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-4">Демо / встречи</h1>
      <form onSubmit={create} className="card p-4 mb-6 grid md:grid-cols-4 gap-3">
        <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
        <select value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
          <option>ONLINE</option>
          <option>OFFLINE</option>
          <option>PHONE</option>
        </select>
        <input placeholder="Комментарий" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
        <button className="rounded-xl bg-[#2563eb]">Создать</button>
      </form>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#182235] text-[#93a0bb]">
            <tr>
              <th className="text-left p-3">Дата</th>
              <th className="text-left p-3">Клиент</th>
              <th className="text-left p-3">Формат</th>
              <th className="text-left p-3">Статус</th>
              <th className="text-left p-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id} className="border-t border-[#243049]">
                <td className="p-3">{new Date(m.startsAt).toLocaleString("ru")}</td>
                <td className="p-3">{m.contact ? `${m.contact.firstName} ${m.contact.lastName}` : "—"}</td>
                <td className="p-3">{m.format}</td>
                <td className="p-3">{m.status}</td>
                <td className="p-3 space-x-2">
                  {["COMPLETED","CANCELLED","NO_SHOW"].map((s) => (
                    <button key={s} className="chip" onClick={() => setStatus(m.id, s)}>{s}</button>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
