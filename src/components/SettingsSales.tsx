"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/I18nProvider";

type Field = { id?: string; name: string; key: string; fieldType: string; options: string[]; required: boolean };
type Rule = { id?: string; name: string; enabled: boolean; staleDays: number; action: string; taskType: string };
type QuotaRow = { managerId: string; name: string; leadTarget: number; revenueTarget: number; leads: number; revenue: number; leadPct: number; revenuePct: number };

export function SettingsSales() {
  const { t } = useI18n();
  const [fields, setFields] = useState<Field[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [managers, setManagers] = useState<Array<{ id: string; name: string }>>([]);
  const [plan, setPlan] = useState<QuotaRow[]>([]);
  const [hours, setHours] = useState({ timezone: "Asia/Almaty", start: "10:00", end: "19:00" });
  const [fieldDraft, setFieldDraft] = useState({ name: "", key: "", fieldType: "text", options: "" });
  const [ruleDraft, setRuleDraft] = useState({ name: "", staleDays: 3, action: "CREATE_TASK" });
  const now = new Date();

  async function load() {
    const [f, r, u, q, s] = await Promise.all([
      fetch("/api/custom-fields").then((x) => (x.ok ? x.json() : [])),
      fetch("/api/automations").then((x) => (x.ok ? x.json() : [])),
      fetch("/api/users").then((x) => (x.ok ? x.json() : [])),
      fetch("/api/quotas").then((x) => (x.ok ? x.json() : { rows: [] })),
      fetch("/api/settings").then((x) => (x.ok ? x.json() : null)),
    ]);
    setFields(f);
    setRules(Array.isArray(r) ? r : []);
    setManagers(u.filter((m: { role: string }) => m.role !== "ADMIN"));
    setPlan(q.rows || []);
    if (s?.hours) setHours({ timezone: s.hours.timezone || "Asia/Almaty", start: s.hours.start || "10:00", end: s.hours.end || "19:00" });
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6 mt-6">
      <div className="card p-5 space-y-3">
        <div className="font-medium">{t("settings.hours")}</div>
        <div className="grid md:grid-cols-3 gap-2">
          <input value={hours.timezone} onChange={(e) => setHours({ ...hours, timezone: e.target.value })} />
          <input value={hours.start} onChange={(e) => setHours({ ...hours, start: e.target.value })} />
          <input value={hours.end} onChange={(e) => setHours({ ...hours, end: e.target.value })} />
        </div>
        <button
          className="rounded-xl bg-[#2563eb] px-4 py-2"
          type="button"
          onClick={() => fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hours }) })}
        >
          {t("common.save")}
        </button>
      </div>

      <div className="card p-5 space-y-3">
        <div className="font-medium">{t("settings.customFields")}</div>
        <form
          className="grid md:grid-cols-5 gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            await fetch("/api/custom-fields", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...fieldDraft,
                options: fieldDraft.options.split(",").map((x) => x.trim()).filter(Boolean),
              }),
            });
            setFieldDraft({ name: "", key: "", fieldType: "text", options: "" });
            load();
          }}
        >
          <input required placeholder={t("common.name")} value={fieldDraft.name} onChange={(e) => setFieldDraft({ ...fieldDraft, name: e.target.value })} />
          <input required placeholder="key" value={fieldDraft.key} onChange={(e) => setFieldDraft({ ...fieldDraft, key: e.target.value })} />
          <select value={fieldDraft.fieldType} onChange={(e) => setFieldDraft({ ...fieldDraft, fieldType: e.target.value })}>
            <option value="text">text</option>
            <option value="number">number</option>
            <option value="select">select</option>
          </select>
          <input placeholder={t("settings.fieldOptions")} value={fieldDraft.options} onChange={(e) => setFieldDraft({ ...fieldDraft, options: e.target.value })} />
          <button className="rounded-xl bg-[#2563eb]">{t("common.add")}</button>
        </form>
        {fields.map((f) => (
          <div key={f.id} className="text-sm border-t border-[#243049] py-2 flex justify-between">
            <span>
              {f.name} · {f.key} · {f.fieldType}
            </span>
            <button className="text-[#f87171]" type="button" onClick={() => fetch(`/api/custom-fields?id=${f.id}`, { method: "DELETE" }).then(load)}>
              {t("common.close")}
            </button>
          </div>
        ))}
      </div>

      <div className="card p-5 space-y-3">
        <div className="font-medium">{t("settings.automations")}</div>
        <form
          className="grid md:grid-cols-4 gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            await fetch("/api/automations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(ruleDraft),
            });
            setRuleDraft({ name: "", staleDays: 3, action: "CREATE_TASK" });
            load();
          }}
        >
          <input required placeholder={t("common.name")} value={ruleDraft.name} onChange={(e) => setRuleDraft({ ...ruleDraft, name: e.target.value })} />
          <input type="number" value={ruleDraft.staleDays} onChange={(e) => setRuleDraft({ ...ruleDraft, staleDays: Number(e.target.value) })} />
          <select value={ruleDraft.action} onChange={(e) => setRuleDraft({ ...ruleDraft, action: e.target.value })}>
            <option value="CREATE_TASK">{t("settings.createTask")}</option>
            <option value="NOTIFY">{t("settings.notifyManager")}</option>
          </select>
          <button className="rounded-xl bg-[#2563eb]">{t("common.add")}</button>
        </form>
        {rules.map((r) => (
          <label key={r.id} className="flex items-center gap-2 text-sm border-t border-[#243049] pt-2">
            <input
              type="checkbox"
              className="w-auto"
              checked={r.enabled}
              onChange={(e) =>
                fetch("/api/automations", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ...r, enabled: e.target.checked }),
                }).then(load)
              }
            />
            {r.name} · {r.staleDays}d
          </label>
        ))}
      </div>

      <div className="card p-5 space-y-3">
        <div className="font-medium">{t("settings.quotas", { month: now.getMonth() + 1 })}</div>
        {plan.map((row) => (
          <div key={row.managerId} className="grid md:grid-cols-5 gap-2 text-sm items-center">
            <div>{row.name}</div>
            <div className="muted">
              {row.leads}/{row.leadTarget} · {row.leadPct}%
            </div>
            <div className="muted">
              {row.revenue}/{row.revenueTarget} · {row.revenuePct}%
            </div>
            <input
              type="number"
              defaultValue={row.leadTarget}
              onBlur={(e) =>
                fetch("/api/quotas", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    managerId: row.managerId,
                    year: now.getFullYear(),
                    month: now.getMonth() + 1,
                    leadTarget: Number(e.target.value),
                    revenueTarget: row.revenueTarget,
                  }),
                })
              }
            />
            <input
              type="number"
              defaultValue={row.revenueTarget}
              onBlur={(e) =>
                fetch("/api/quotas", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    managerId: row.managerId,
                    year: now.getFullYear(),
                    month: now.getMonth() + 1,
                    leadTarget: row.leadTarget,
                    revenueTarget: Number(e.target.value),
                  }),
                })
              }
            />
          </div>
        ))}
        {managers.length === 0 && <div className="muted text-sm">{t("common.noData")}</div>}
      </div>
    </div>
  );
}
