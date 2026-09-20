"use client";

import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/components/I18nProvider";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Item = {
  id: string;
  firstName: string;
  lastName: string;
  phoneDisplay: string;
  source: string;
  lastContactAt: string | null;
  comment: string;
  reason: "never" | "stale";
  manager?: { name: string } | null;
  pipelineStage?: { name: string } | null;
};

const PRESETS = ["today", "tomorrow", "in3days"] as const;

export default function FollowUpsPage() {
  const { t, localeTag } = useI18n();
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const data = await fetch("/api/follow-ups").then((r) => r.json());
    setItems(Array.isArray(data.items) ? data.items : []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function schedule(contactId: string, preset: (typeof PRESETS)[number]) {
    setError("");
    setNotice("");
    const res = await fetch("/api/follow-ups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId, preset }),
    });
    if (!res.ok) {
      setError(t("followUps.scheduleFailed"));
      return;
    }
    setNotice(t("followUps.scheduled"));
    await load();
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-2">{t("followUps.title")}</h1>
      <p className="muted text-sm mb-6">{t("followUps.hint")}</p>
      {error && <div className="text-sm text-[#f87171] mb-3">{error}</div>}
      {notice && <div className="text-sm text-[#34d399] mb-3">{notice}</div>}
      {items.length === 0 && <div className="card p-6 muted">{t("followUps.empty")}</div>}
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="card p-4 flex flex-col md:flex-row md:items-center gap-3 justify-between">
            <div>
              <Link href={`/contacts/${item.id}`} className="text-[#93c5fd] font-medium">
                {item.firstName} {item.lastName}
              </Link>
              <div className="text-sm muted mt-1">
                {item.phoneDisplay} · {t(`sources.${item.source}`, item.source)} ·{" "}
                {item.pipelineStage?.name || t("common.dash")} · {item.manager?.name || t("common.dash")}
              </div>
              <div className="text-xs mt-1 text-[#fbbf24]">
                {item.reason === "never" ? t("followUps.never") : t("followUps.stale")}
                {item.lastContactAt
                  ? ` · ${t("followUps.lastTouch", { time: new Date(item.lastContactAt).toLocaleString(localeTag) })}`
                  : ""}
              </div>
              {item.comment && <div className="text-sm mt-1">{item.comment}</div>}
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              {PRESETS.map((preset) => (
                <button key={preset} className="chip" onClick={() => schedule(item.id, preset)}>
                  {t(`followUps.${preset}`)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
