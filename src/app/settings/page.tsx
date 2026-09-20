"use client";

import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/components/I18nProvider";
import { useEffect, useState } from "react";

type Template = {
  id: string;
  name: string;
  metaName: string;
  language: string;
  category: string;
  body: string;
  status: string;
  isActive: boolean;
};

type Integration = { type: string; status: string; lastSyncAt?: string; lastError?: string; config?: Record<string, unknown> };

function TemplateRow({
  tpl,
  onSaved,
  t,
}: {
  tpl: Template;
  onSaved: () => void;
  t: (path: string) => string;
}) {
  const [edit, setEdit] = useState(tpl);
  useEffect(() => {
    setEdit(tpl);
  }, [tpl]);

  async function save() {
    await fetch("/api/templates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(edit),
    });
    onSaved();
  }

  return (
    <div className="border-t border-[#243049] pt-3 space-y-2 text-sm">
      <div className="grid md:grid-cols-6 gap-2">
        <input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
        <input value={edit.metaName} onChange={(e) => setEdit({ ...edit, metaName: e.target.value })} />
        <input value={edit.language} onChange={(e) => setEdit({ ...edit, language: e.target.value })} />
        <select value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })}>
          <option value="MARKETING">MARKETING</option>
          <option value="UTILITY">UTILITY</option>
        </select>
        <select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
          <option value="APPROVED">APPROVED</option>
          <option value="PENDING">PENDING</option>
          <option value="REJECTED">REJECTED</option>
        </select>
        <label className="text-xs flex items-center gap-1">
          <input
            type="checkbox"
            className="w-auto"
            checked={edit.isActive}
            onChange={(e) => setEdit({ ...edit, isActive: e.target.checked })}
          />
          {t("settings.active")}
        </label>
      </div>
      <textarea rows={2} value={edit.body} onChange={(e) => setEdit({ ...edit, body: e.target.value })} />
      <button type="button" className="rounded-xl bg-[#2563eb] px-3 py-2 text-sm" onClick={save}>
        {t("settings.saveTemplate")}
      </button>
    </div>
  );
}

function QuickRepliesSection() {
  const { t } = useI18n();
  const [replies, setReplies] = useState<Array<{ id: string; title: string; body: string; isActive: boolean }>>([]);
  const [draft, setDraft] = useState({ title: "", body: "" });

  async function load() {
    setReplies(await fetch("/api/quick-replies").then((r) => (r.ok ? r.json() : [])));
  }
  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/quick-replies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    setDraft({ title: "", body: "" });
    load();
  }

  async function save(reply: { id: string; title: string; body: string; isActive: boolean }) {
    await fetch("/api/quick-replies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reply),
    });
    load();
  }

  return (
    <div className="card p-5 mb-6 space-y-3">
      <div className="font-medium">{t("settings.quickReplies")}</div>
      <div className="muted text-sm">{t("settings.quickRepliesHint")}</div>
      <form onSubmit={create} className="grid md:grid-cols-3 gap-2">
        <input required placeholder={t("settings.quickTitle")} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        <input required placeholder={t("settings.quickBody")} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
        <button className="rounded-xl bg-[#2563eb]">{t("common.add")}</button>
      </form>
      {replies.map((r) => (
        <QuickReplyRow key={r.id} reply={r} onSave={save} t={t} />
      ))}
      {replies.length === 0 && <div className="muted text-sm">{t("settings.noQuickReplies")}</div>}
    </div>
  );
}

function QuickReplyRow({
  reply,
  onSave,
  t,
}: {
  reply: { id: string; title: string; body: string; isActive: boolean };
  onSave: (reply: { id: string; title: string; body: string; isActive: boolean }) => void;
  t: (path: string) => string;
}) {
  const [edit, setEdit] = useState(reply);
  useEffect(() => {
    setEdit(reply);
  }, [reply]);
  return (
    <div className="border-t border-[#243049] pt-3 grid md:grid-cols-[1fr_2fr_auto_auto] gap-2 items-center">
      <input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
      <input value={edit.body} onChange={(e) => setEdit({ ...edit, body: e.target.value })} />
      <label className="text-xs flex items-center gap-1">
        <input type="checkbox" className="w-auto" checked={edit.isActive} onChange={(e) => setEdit({ ...edit, isActive: e.target.checked })} />
        {t("settings.active")}
      </label>
      <button type="button" className="rounded-xl bg-[#2563eb] px-3 py-2 text-sm" onClick={() => onSave(edit)}>
        {t("settings.saveQuick")}
      </button>
    </div>
  );
}

function TemplatesSection() {
  const { t } = useI18n();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [draft, setDraft] = useState({
    name: "",
    metaName: "",
    language: "ru",
    category: "MARKETING",
    body: "",
    status: "APPROVED",
  });

  async function load() {
    setTemplates(await fetch("/api/templates").then((r) => (r.ok ? r.json() : [])));
  }
  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, isActive: true }),
    });
    setDraft({ ...draft, name: "", metaName: "", body: "" });
    load();
  }

  return (
    <div className="card p-5 mb-6 space-y-3">
      <div className="font-medium">{t("settings.templates")}</div>
      <div className="muted text-sm">{t("settings.templatesHint")}</div>
      <form onSubmit={create} className="grid md:grid-cols-6 gap-2">
        <input placeholder={t("settings.titleName")} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <input placeholder={t("settings.metaName")} value={draft.metaName} onChange={(e) => setDraft({ ...draft, metaName: e.target.value })} />
        <input placeholder={t("settings.lang")} value={draft.language} onChange={(e) => setDraft({ ...draft, language: e.target.value })} />
        <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
          <option value="MARKETING">MARKETING</option>
          <option value="UTILITY">UTILITY</option>
        </select>
        <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
          <option value="APPROVED">APPROVED</option>
          <option value="PENDING">PENDING</option>
          <option value="REJECTED">REJECTED</option>
        </select>
        <button className="rounded-xl bg-[#2563eb]">{t("common.add")}</button>
        <textarea
          className="md:col-span-6"
          rows={2}
          placeholder={t("settings.templateBody")}
          value={draft.body}
          onChange={(e) => setDraft({ ...draft, body: e.target.value })}
        />
      </form>
      <div className="space-y-2">
        {templates.map((tpl) => (
          <TemplateRow key={tpl.id} tpl={tpl} onSaved={load} t={t} />
        ))}
        {templates.length === 0 && <div className="muted text-sm">{t("settings.noTemplates")}</div>}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { t, localeTag } = useI18n();
  const [data, setData] = useState<{
    integrations: Integration[];
    sla: { enabled: boolean; minutes: number; action: string };
    routing: { existingContact: string; fallback: string };
    webhooks: { whatsappVerify: string; whatsappInbound: string; metaLeads: string; telephony: string };
  } | null>(null);
  const [stages, setStages] = useState<
    Array<{ id?: string; name: string; slug: string; order: number; isActive: boolean; requiredFields?: string[] }>
  >([]);
  const [sip, setSip] = useState({ wsUrl: "", domain: "", extensions: "{\n  \"101\": \"\"\n}" });
  const [sipNotice, setSipNotice] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/settings").then(async (r) => {
      if (!r.ok) setErr(t("settings.forbidden"));
      else {
        const payload = await r.json();
        setData(payload);
        const telephony = (payload.integrations || []).find((i: Integration) => i.type === "TELEPHONY");
        const cfg = (telephony?.config || {}) as { wsUrl?: string; domain?: string; extensions?: unknown };
        setSip({
          wsUrl: cfg.wsUrl || "",
          domain: cfg.domain || "",
          extensions: JSON.stringify(cfg.extensions || { "101": "" }, null, 2),
        });
      }
    });
    fetch("/api/pipeline")
      .then((r) => r.json())
      .then((s) => {
        if (Array.isArray(s)) setStages(s.map((x: { id: string; name: string; slug: string; order: number; isActive: boolean; requiredFields?: string[] }) => x));
      });
  }, [t]);

  async function saveSla() {
    if (!data) return;
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sla: data.sla, routing: data.routing }),
    });
  }

  async function saveSip() {
    setSipNotice("");
    let extensions: unknown = {};
    try {
      extensions = JSON.parse(sip.extensions || "{}");
    } catch {
      setSipNotice(t("settings.sipFailed"));
      return;
    }
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        integration: {
          type: "TELEPHONY",
          status: sip.wsUrl ? "CONNECTED" : "DISCONNECTED",
          config: { wsUrl: sip.wsUrl, domain: sip.domain, extensions },
        },
      }),
    });
    setSipNotice(res.ok ? t("settings.sipSaved") : t("settings.sipFailed"));
  }

  async function saveStages() {
    await fetch("/api/pipeline/stages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stages),
    });
  }

  if (err) {
    return (
      <AppShell>
        <div className="card p-6">{err}</div>
      </AppShell>
    );
  }

  const hooks = data?.webhooks;

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-6">{t("settings.title")}</h1>
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {(data?.integrations || [
          { type: "WHATSAPP_BUSINESS", status: "DISCONNECTED" },
          { type: "TELEPHONY", status: "DISCONNECTED" },
          { type: "META_LEADS", status: "DISCONNECTED" },
        ]).map((i) => (
          <div key={i.type} className="card p-5">
            <div className="font-medium">{i.type.replaceAll("_", " ")}</div>
            <div className="chip mt-2">{i.status}</div>
            <div className="text-xs muted mt-2">
              {t("settings.lastSync", {
                time: i.lastSyncAt ? new Date(i.lastSyncAt).toLocaleString(localeTag) : t("common.dash"),
              })}
            </div>
            <div className="text-xs text-[#f87171]">{i.lastError}</div>
          </div>
        ))}
      </div>

      <div className="card p-5 mb-6 space-y-3">
        <div className="font-medium">{t("settings.webhooks")}</div>
        <div className="muted text-sm">{t("settings.webhooksHint")}</div>
        {[
          [t("settings.wabaVerify"), hooks?.whatsappVerify],
          [t("settings.wabaInbound"), hooks?.whatsappInbound],
          [t("settings.metaLeads"), hooks?.metaLeads],
          [t("settings.sipWebhook"), hooks?.telephony],
        ].map(([label, url]) => (
          <div key={String(label)} className="text-sm">
            <div className="muted">{label}</div>
            <code className="text-xs break-all">{url || t("common.dash")}</code>
          </div>
        ))}
      </div>

      <div className="card p-5 mb-6 space-y-3">
        <div className="font-medium">{t("settings.sipTitle")}</div>
        <div className="muted text-sm">{t("settings.sipHint")}</div>
        <input placeholder={t("settings.sipWs")} value={sip.wsUrl} onChange={(e) => setSip({ ...sip, wsUrl: e.target.value })} />
        <input placeholder={t("settings.sipDomain")} value={sip.domain} onChange={(e) => setSip({ ...sip, domain: e.target.value })} />
        <textarea rows={5} placeholder={t("settings.sipExt")} value={sip.extensions} onChange={(e) => setSip({ ...sip, extensions: e.target.value })} />
        <button className="rounded-xl bg-[#2563eb] px-4 py-2" onClick={saveSip}>
          {t("settings.saveSip")}
        </button>
        {sipNotice && <div className="text-sm text-[#34d399]">{sipNotice}</div>}
      </div>

      <div className="card p-5 mb-6 space-y-3">
        <div className="font-medium">{t("settings.sla")}</div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="w-auto"
            checked={!!data?.sla.enabled}
            onChange={(e) => data && setData({ ...data, sla: { ...data.sla, enabled: e.target.checked } })}
          />
          {t("settings.enable")}
        </label>
        <input
          type="number"
          value={data?.sla.minutes || 10}
          onChange={(e) => data && setData({ ...data, sla: { ...data.sla, minutes: Number(e.target.value) } })}
        />
        <select value={data?.sla.action} onChange={(e) => data && setData({ ...data, sla: { ...data.sla, action: e.target.value } })}>
          <option value="NOTIFY_MANAGER">{t("settings.notifyManager")}</option>
          <option value="NOTIFY_ADMIN">{t("settings.notifyAdmin")}</option>
          <option value="REASSIGN">{t("settings.reassign")}</option>
        </select>
        <div className="font-medium pt-2">{t("settings.routing")}</div>
        <select
          value={data?.routing.existingContact}
          onChange={(e) => data && setData({ ...data, routing: { ...data.routing, existingContact: e.target.value } })}
        >
          <option value="responsible">{t("settings.responsibleFirst")}</option>
          <option value="queue">{t("settings.queueNow")}</option>
        </select>
        <select value={data?.routing.fallback} onChange={(e) => data && setData({ ...data, routing: { ...data.routing, fallback: e.target.value } })}>
          <option value="queue">{t("settings.nextAvailable")}</option>
          <option value="group">{t("settings.group")}</option>
        </select>
        <button className="rounded-xl bg-[#2563eb] px-4 py-2" onClick={saveSla}>
          {t("common.save")}
        </button>
      </div>
      <QuickRepliesSection />
      <TemplatesSection />
      <div className="card p-5 space-y-3">
        <div className="font-medium">{t("settings.stages")}</div>
        {stages.map((s, idx) => (
          <div key={s.id || idx} className="grid grid-cols-4 gap-2">
            <input
              value={s.name}
              onChange={(e) => {
                const next = [...stages];
                next[idx] = { ...s, name: e.target.value };
                setStages(next);
              }}
            />
            <input
              value={s.slug}
              onChange={(e) => {
                const next = [...stages];
                next[idx] = { ...s, slug: e.target.value };
                setStages(next);
              }}
            />
            <input
              type="number"
              value={s.order}
              onChange={(e) => {
                const next = [...stages];
                next[idx] = { ...s, order: Number(e.target.value) };
                setStages(next);
              }}
            />
            <label className="text-sm flex items-center gap-2">
              <input
                type="checkbox"
                className="w-auto"
                checked={s.isActive}
                onChange={(e) => {
                  const next = [...stages];
                  next[idx] = { ...s, isActive: e.target.checked };
                  setStages(next);
                }}
              />
              {t("settings.stageActive")}
            </label>
            <input
              className="col-span-4"
              placeholder={t("settings.requiredFields")}
              value={(s.requiredFields || []).join(", ")}
              onChange={(e) => {
                const next = [...stages];
                next[idx] = {
                  ...s,
                  requiredFields: e.target.value
                    .split(",")
                    .map((f) => f.trim())
                    .filter(Boolean),
                };
                setStages(next);
              }}
            />
          </div>
        ))}
        <button
          className="chip"
          onClick={() =>
            setStages([...stages, { name: t("settings.newStage"), slug: `stage-${stages.length + 1}`, order: stages.length + 1, isActive: true }])
          }
        >
          {t("settings.addStage")}
        </button>
        <button className="rounded-xl bg-[#2563eb] px-4 py-2" onClick={saveStages}>
          {t("settings.savePipeline")}
        </button>
      </div>
    </AppShell>
  );
}
