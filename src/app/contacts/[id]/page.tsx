"use client";

import { AppShell } from "@/components/AppShell";
import { QuickActions } from "@/components/QuickActions";
import { ContactSales } from "@/components/ContactSales";
import { TagChips } from "@/components/TagChips";
import { useI18n } from "@/components/I18nProvider";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Stage = { id: string; name: string; requiredFields: string[]; isWon?: boolean; isLost?: boolean };

const LOST_REASONS = ["price", "no_need", "competitor", "silent", "later", "other"];
const WON_REASONS = ["paid_full", "installment", "repeat"];

type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  phoneDisplay: string;
  email?: string | null;
  source: string;
  comment: string;
  dealAmount: string | number;
  lastContactAt?: string | null;
  outcomeReason?: string | null;
  status: string;
  customFields: Record<string, unknown>;
  altPhone?: string | null;
  address?: string;
  city?: string;
  archivedAt?: string | null;
  manager?: { id: string; name: string } | null;
  company?: { id: string; name: string } | null;
  pipelineStage?: { id: string; name: string } | null;
  tags?: Array<{ tag: { id: string; name: string; color: string } }>;
  calls: Array<{ id: string; direction: string; duration: number; recordingUrl?: string | null; status: string }>;
  tasks: Array<{ id: string; description: string; dueAt: string; status: string; type: string }>;
  meetings: Array<{ id: string; startsAt: string; status: string; format: string }>;
};

export default function ContactPage() {
  const { t, localeTag } = useI18n();
  const params = useParams<{ id: string }>();
  const [c, setC] = useState<Contact | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [managers, setManagers] = useState<Array<{ id: string; name: string; role: string }>>([]);
  const [me, setMe] = useState<{ role: string } | null>(null);
  const [notice, setNotice] = useState("");
  const [problem, setProblem] = useState("");
  const [pendingStage, setPendingStage] = useState<Stage | null>(null);
  const [reason, setReason] = useState("");
  const [calling, setCalling] = useState(false);
  const [allTags, setAllTags] = useState<Array<{ id: string; name: string; color: string }>>([]);

  const load = useCallback(async () => {
    setC(await fetch(`/api/contacts/${params.id}`).then((r) => r.json()));
  }, [params.id]);

  useEffect(() => {
    load();
    fetch("/api/pipeline")
      .then((r) => r.json())
      .then(setStages);
    fetch("/api/users")
      .then((r) => r.json())
      .then(setManagers);
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(setMe);
    fetch("/api/tags")
      .then((r) => r.json())
      .then((data) => setAllTags(Array.isArray(data) ? data : []));
  }, [load]);

  const fieldName = (f: string) => t(`fields.${f}`, f);

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
        const names = (payload.fields as string[]).map(fieldName).join(", ");
        setProblem(t("contact.missing", { fields: names }));
      } else if (payload.error === "OUTCOME_REASON_REQUIRED") {
        setProblem(t("contact.reasonNeeded"));
      } else {
        setProblem(t("contact.saveFailed"));
      }
      return false;
    }
    setNotice(t("contact.saved"));
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

  function pickStage(stageId: string) {
    const stage = stages.find((s) => s.id === stageId);
    if (!stage) return;
    if (stage.isWon || stage.isLost) {
      setPendingStage(stage);
      setReason("");
      return;
    }
    setPendingStage(null);
    setC((prev) => (prev ? { ...prev, pipelineStage: { id: stage.id, name: stage.name } } : prev));
    void patch({ pipelineStageId: stageId }).then((ok) => {
      if (!ok) load();
    });
  }

  async function sipCall() {
    setProblem("");
    setCalling(true);
    const res = await fetch("/api/calls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId: c?.id }),
    });
    setCalling(false);
    if (!res.ok) {
      setProblem(t("contact.sipCallFailed"));
      return;
    }
    setNotice(t("contact.sipCalling"));
    load();
  }

  async function confirmOutcome() {
    if (!pendingStage || !reason) {
      setProblem(t("contact.reasonNeeded"));
      return;
    }
    const ok = await patch({ pipelineStageId: pendingStage.id, outcomeReason: reason });
    if (ok) setPendingStage(null);
  }

  if (!c) {
    return <AppShell>{t("common.loading")}</AppShell>;
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
                <div className="muted">{c.phoneDisplay}</div>
              </div>
              <button type="button" className="rounded-xl bg-[#16a34a] px-4 py-2 h-fit" disabled={calling} onClick={sipCall}>
                {calling ? t("contact.sipCalling") : t("contact.sipCall")}
              </button>
            </div>

            <div className="mt-4">
              <QuickActions contactId={c.id} compact onDone={load} />
            </div>

            <div className="grid md:grid-cols-2 gap-3 mt-4">
              <div>{t("contact.source", { source: t(`sources.${c.source}`, c.source) })}</div>
              <div>
                {t("contact.status", { status: c.status })}
                {c.outcomeReason ? ` · ${t("contact.outcome", { reason: t(`outcomes.${c.outcomeReason}`, c.outcomeReason) })}` : ""}
              </div>
              <div>
                {c.lastContactAt
                  ? t("contact.lastTouch", { time: new Date(c.lastContactAt).toLocaleString(localeTag) })
                  : t("contact.noTouch")}
              </div>
              <label>
                {t("contact.stage")}
                <select className="mt-1" value={c.pipelineStage?.id || ""} onChange={(e) => pickStage(e.target.value)}>
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {s.requiredFields.length ? ` (${t("contact.needs", { fields: s.requiredFields.map(fieldName).join(", ") })})` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <div>{t("contact.manager", { name: c.manager?.name || t("common.dash") })}</div>
              <label>
                {t("contact.city")}
                <input value={c.city || ""} onChange={(e) => setC({ ...c, city: e.target.value })} />
              </label>
              <label>
                {t("contact.altPhone")}
                <input value={c.altPhone || ""} onChange={(e) => setC({ ...c, altPhone: e.target.value })} />
              </label>
              <label className="md:col-span-2">
                {t("contact.address")}
                <input value={c.address || ""} onChange={(e) => setC({ ...c, address: e.target.value })} />
              </label>
              <div className="md:col-span-2 space-y-2">
                <div className="text-sm">{t("contact.tags")}</div>
                <TagChips
                  tags={allTags}
                  selectedIds={(c.tags || []).map((x) => x.tag.id)}
                  onToggle={(tag, on) =>
                    fetch("/api/tags", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ contactId: c.id, tagId: tag.id, remove: on }),
                    }).then(load)
                  }
                />
              </div>
            </div>

            <textarea className="mt-3" rows={3} value={c.comment} onChange={(e) => setC({ ...c, comment: e.target.value })} />
            <div className="flex gap-2 mt-3">
              <button
                className="rounded-xl bg-[#1d4ed8] px-4 py-2"
                onClick={() =>
                  patch({
                    comment: c.comment,
                    altPhone: c.altPhone,
                    city: c.city,
                    address: c.address,
                  })
                }
              >
                {t("common.save")}
              </button>
              <button type="button" className="chip" onClick={() => patch({ archived: !c.archivedAt })}>
                {c.archivedAt ? t("leads.activeOnly") : t("leads.archive")}
              </button>
            </div>
            {pendingStage && (
              <div className="mt-4 card p-3 space-y-2">
                <div className="text-sm">{t("pipeline.pickReason")}</div>
                <div className="flex flex-wrap gap-2">
                  {(pendingStage.isWon ? WON_REASONS : LOST_REASONS).map((key) => (
                    <button
                      key={key}
                      type="button"
                      className={`chip ${reason === key ? "bg-[#1d4ed8]" : ""}`}
                      onClick={() => setReason(key)}
                    >
                      {t(`outcomes.${key}`)}
                    </button>
                  ))}
                </div>
                <button type="button" className="rounded-xl bg-[#2563eb] px-3 py-2 text-sm" onClick={confirmOutcome}>
                  {t("pipeline.confirmClose")}
                </button>
              </div>
            )}
            {problem && <div className="mt-2 text-sm text-[#fbbf24]">{problem}</div>}
            {notice && <div className="mt-2 text-sm text-[#34d399]">{notice}</div>}

            {(me?.role === "ADMIN" || me?.role === "SUPERVISOR") && (
              <label className="block mt-4 text-sm">
                {t("contact.reassign")}
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
              <div className="font-medium mb-2">{t("contact.tasks")}</div>
              {c.tasks.length === 0 && <div className="muted text-sm">{t("contact.noTasks")}</div>}
              {c.tasks.slice(0, 6).map((task) => (
                <div key={task.id} className="text-sm border-t border-[#243049] py-2">
                  <div>{task.description}</div>
                  <div className="muted text-xs">
                    {t(`taskTypes.${task.type}`, task.type)} · {new Date(task.dueAt).toLocaleString(localeTag, { timeZone: "Asia/Almaty" })} · {task.status}
                  </div>
                  {task.status === "OPEN" && (
                    <button
                      type="button"
                      className="chip mt-1"
                      onClick={() =>
                        fetch("/api/tasks", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: task.id, status: "DONE" }),
                        }).then(load)
                      }
                    >
                      {t("tasks.markDone")}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="card p-5">
              <div className="font-medium mb-2">{t("contact.meetings")}</div>
              {c.meetings.length === 0 && <div className="muted text-sm">{t("contact.noMeetings")}</div>}
              {c.meetings.slice(0, 6).map((m) => (
                <div key={m.id} className="text-sm border-t border-[#243049] py-2">
                  <div>{new Date(m.startsAt).toLocaleString(localeTag)}</div>
                  <div className="muted text-xs">
                    {t(`meetingFormats.${m.format}`, m.format)} · {t(`meetingStatuses.${m.status}`, m.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <div className="font-medium mb-3">{t("contact.recordings")}</div>
            {c.calls.length === 0 && <div className="muted text-sm">{t("contact.noCalls")}</div>}
            {c.calls.map((call) => (
              <div key={call.id} className="flex items-center justify-between py-2 border-t border-[#243049]">
                <div className="text-sm">
                  {t(`callDirections.${call.direction}`, call.direction)} · {t(`callStatuses.${call.status}`, call.status)} · {call.duration}s
                </div>
                {call.recordingUrl && <audio controls src={call.recordingUrl} className="h-8" />}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
        <ContactSales
          contactId={c.id}
          clientName={`${c.firstName} ${c.lastName}`.trim()}
          phone={c.phoneDisplay}
          address={[c.city, c.address].filter(Boolean).join(", ")}
          managerId={c.manager?.id}
          managerName={c.manager?.name || t("common.dash")}
          customFields={c.customFields || {}}
          dealAmount={c.dealAmount}
          tasks={c.tasks || []}
          onChange={load}
        />
        </div>
      </div>
    </AppShell>
  );
}
