"use client";

import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { useEffect, useState } from "react";

type Card = {
  id: string;
  firstName: string;
  lastName: string;
  phoneDisplay: string;
  source: string;
  dealAmount: string | number;
  lastContactAt: string | null;
  manager?: { name: string };
  tasks?: Array<{ dueAt: string; description: string }>;
};
type Stage = { id: string; name: string; contacts: Card[] };

export default function PipelinePage() {
  const [stages, setStages] = useState<Stage[]>([]);
  useEffect(() => {
    fetch("/api/pipeline").then((r) => r.json()).then(setStages);
  }, []);

  async function move(contactId: string, pipelineStageId: string) {
    await fetch("/api/contacts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: contactId, pipelineStageId }),
    });
    const next = await fetch("/api/pipeline").then((r) => r.json());
    setStages(next);
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-6">Воронка</h1>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="w-72 shrink-0"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const id = e.dataTransfer.getData("id");
              if (id) move(id, stage.id);
            }}
          >
            <div className="muted text-sm mb-2">
              {stage.name} · {stage.contacts.length}
            </div>
            <div className="space-y-3 min-h-[200px]">
              {stage.contacts.map((c) => (
                <div
                  key={c.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("id", c.id)}
                  className="card p-3 cursor-grab"
                >
                  <Link href={`/contacts/${c.id}`} className="font-medium">
                    {c.firstName} {c.lastName}
                  </Link>
                  <div className="text-xs muted mt-1">{c.phoneDisplay}</div>
                  <div className="text-xs mt-2">{c.source} · {c.manager?.name}</div>
                  <div className="text-xs mt-1">Сумма: {Number(c.dealAmount || 0)}</div>
                  <div className="text-xs muted mt-1">
                    {c.tasks?.[0] ? `Задача: ${c.tasks[0].description}` : "Нет задачи"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
