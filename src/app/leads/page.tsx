"use client";

import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useRealtime } from "@/lib/use-realtime";

type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  phoneDisplay: string;
  source: string;
  dealAmount: string | number;
  manager?: { name: string };
  pipelineStage?: { name: string };
};

function LeadsInner() {
  const params = useSearchParams();
  const [rows, setRows] = useState<Contact[]>([]);
  const [form, setForm] = useState({ firstName: "", phone: "", source: "MANUAL", comment: "" });
  const load = useCallback(async () => {
    const q = params.get("q");
    const data = await fetch(q ? `/api/contacts?q=${encodeURIComponent(q)}` : "/api/leads").then((r) => r.json());
    if (Array.isArray(data) && data[0]?.contact) {
      setRows(data.map((l: { contact: Contact }) => l.contact));
    } else setRows(data);
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  useRealtime({ "lead:new": () => load() });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    location.reload();
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Лиды и клиенты</h1>
      </div>
      <form onSubmit={create} className="card p-4 mb-6 grid md:grid-cols-5 gap-3">
        <input placeholder="Имя" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        <input placeholder="Телефон" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
          {["MANUAL","WHATSAPP","INSTAGRAM","FACEBOOK","PHONE_CALL","WEBSITE","REFERRAL","OTHER"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <input placeholder="Комментарий" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
        <button className="rounded-xl bg-[#2563eb]">Создать</button>
      </form>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#182235] text-[#93a0bb]">
            <tr>
              <th className="text-left p-3">Клиент</th>
              <th className="text-left p-3">Телефон</th>
              <th className="text-left p-3">Источник</th>
              <th className="text-left p-3">Менеджер</th>
              <th className="text-left p-3">Стадия</th>
              <th className="text-left p-3">Сумма</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-[#243049]">
                <td className="p-3">
                  <Link href={`/contacts/${c.id}`} className="text-[#93c5fd]">
                    {c.firstName} {c.lastName}
                  </Link>
                </td>
                <td className="p-3">{c.phoneDisplay}</td>
                <td className="p-3">{c.source}</td>
                <td className="p-3">{c.manager?.name || "—"}</td>
                <td className="p-3">{c.pipelineStage?.name || "—"}</td>
                <td className="p-3">{Number(c.dealAmount || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

export default function LeadsPage() {
  return (
    <Suspense>
      <LeadsInner />
    </Suspense>
  );
}
