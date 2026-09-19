"use client";

import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/components/I18nProvider";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRealtime } from "@/lib/use-realtime";

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
  const { t } = useI18n();
  const [stages, setStages] = useState<Stage[]>([]);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setStages(await fetch("/api/pipeline").then((r) => r.json()));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useRealtime({ "lead:new": () => load() });

  async function move(contactId: string, pipelineStageId: string) {
    setError("");
    const res = await fetch("/api/contacts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: contactId, pipelineStageId }),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      if (payload.error === "STAGE_FIELDS_REQUIRED") {
        const names = (payload.fields as string[]).map((f: string) => t(`fields.${f}`, f)).join(", ");
        setError(t("pipeline.missingFields", { fields: names }));
      } else {
        setError(t("pipeline.moveFailed"));
      }
      return;
    }
    await load();
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-6">{t("pipeline.title")}</h1>
      {error && <div className="card px-4 py-2 mb-4 text-sm text-[#fbbf24]">{error}</div>}
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
                  <div className="text-xs mt-2">
                    {t(`sources.${c.source}`, c.source)} · {c.manager?.name}
                  </div>
                  <div className="text-xs mt-1">{t("pipeline.amount", { amount: Number(c.dealAmount || 0) })}</div>
                  <div className="text-xs muted mt-1">
                    {c.tasks?.[0] ? t("pipeline.task", { task: c.tasks[0].description }) : t("pipeline.noTask")}
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
