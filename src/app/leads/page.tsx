"use client";

import { AppShell } from "@/components/AppShell";
import { ExportButton } from "@/components/ExportButton";
import { useI18n } from "@/components/I18nProvider";
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
  company?: { name: string } | null;
  tags?: Array<{ tag: { id: string; name: string; color: string } }>;
};

const SOURCES = ["MANUAL", "WHATSAPP", "INSTAGRAM", "FACEBOOK", "PHONE_CALL", "WEBSITE", "REFERRAL", "OTHER"];

function LeadsInner() {
  const params = useSearchParams();
  const { t } = useI18n();
  const [rows, setRows] = useState<Contact[]>([]);
  const [stages, setStages] = useState<Array<{ id: string; name: string }>>([]);
  const [managers, setManagers] = useState<Array<{ id: string; name: string }>>([]);
  const [tags, setTags] = useState<Array<{ id: string; name: string }>>([]);
  const [views, setViews] = useState<Array<{ id: string; name: string; filters: Record<string, string> }>>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [form, setForm] = useState({ firstName: "", phone: "", source: "MANUAL", comment: "" });
  const [filters, setFilters] = useState({
    q: params.get("q") || "",
    stage: params.get("stage") || "",
    manager: params.get("manager") || "",
    source: params.get("source") || "",
    tag: params.get("tag") || "",
    company: params.get("company") || "",
    from: "",
    to: "",
    archived: "",
  });
  const [error, setError] = useState("");
  const [importNotice, setImportNotice] = useState("");
  const [bulkStage, setBulkStage] = useState("");
  const [bulkTag, setBulkTag] = useState("");
  const [viewName, setViewName] = useState("");

  const query = useCallback(() => {
    const qs = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) qs.set(k, v);
    });
    return qs.toString();
  }, [filters]);

  const load = useCallback(async () => {
    const data = await fetch(`/api/contacts?${query()}`).then((r) => r.json());
    setRows(Array.isArray(data) ? data : []);
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/pipeline").then((r) => r.json()).then(setStages);
    fetch("/api/users").then((r) => r.json()).then(setManagers);
    fetch("/api/tags").then((r) => r.json()).then(setTags);
    fetch("/api/views").then((r) => r.json()).then(setViews);
  }, []);

  useRealtime({ "lead:new": () => load() });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      setError(t("leads.createFailed"));
      return;
    }
    setForm({ firstName: "", phone: "", source: "MANUAL", comment: "" });
    await load();
  }

  async function importCsv(file: File) {
    setError("");
    setImportNotice("");
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/import/leads", { method: "POST", body });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(t("leads.importFailed"));
      return;
    }
    setImportNotice(t("leads.importResult", { created: data.created, duplicates: data.duplicates, errors: data.errors?.length || 0 }));
    await load();
  }

  async function bulk(payload: object) {
    if (!selected.length) return;
    await fetch("/api/contacts/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selected, ...payload }),
    });
    setSelected([]);
    await load();
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">{t("leads.title")}</h1>
        <div className="flex gap-2">
          <label className="chip cursor-pointer">
            {t("leads.import")}
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importCsv(file);
                e.target.value = "";
              }}
            />
          </label>
          <ExportButton href="/api/export/leads" />
        </div>
      </div>
      <form onSubmit={create} className="card p-4 mb-4 grid md:grid-cols-5 gap-3">
        <input placeholder={t("common.name")} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        <input placeholder={t("common.phone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {t(`sources.${s}`)}
            </option>
          ))}
        </select>
        <input placeholder={t("common.comment")} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
        <button className="rounded-xl bg-[#2563eb]">{t("common.create")}</button>
      </form>
      <div className="card p-4 mb-4 grid md:grid-cols-4 xl:grid-cols-8 gap-2">
        <input placeholder={t("common.search")} value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
        <select value={filters.stage} onChange={(e) => setFilters({ ...filters, stage: e.target.value })}>
          <option value="">{t("common.stage")}</option>
          {stages.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select value={filters.manager} onChange={(e) => setFilters({ ...filters, manager: e.target.value })}>
          <option value="">{t("common.manager")}</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <select value={filters.source} onChange={(e) => setFilters({ ...filters, source: e.target.value })}>
          <option value="">{t("common.source")}</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>{t(`sources.${s}`)}</option>
          ))}
        </select>
        <select value={filters.tag} onChange={(e) => setFilters({ ...filters, tag: e.target.value })}>
          <option value="">{t("leads.tag")}</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>{tag.name}</option>
          ))}
        </select>
        <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        <select value={filters.archived} onChange={(e) => setFilters({ ...filters, archived: e.target.value })}>
          <option value="">{t("leads.activeOnly")}</option>
          <option value="1">{t("leads.archived")}</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <select value={bulkStage} onChange={(e) => setBulkStage(e.target.value)}>
          <option value="">{t("leads.bulkStage")}</option>
          {stages.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <button className="chip" type="button" onClick={() => bulk({ pipelineStageId: bulkStage })}>{t("leads.apply")}</button>
        <select value={bulkTag} onChange={(e) => setBulkTag(e.target.value)}>
          <option value="">{t("leads.bulkTag")}</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>{tag.name}</option>
          ))}
        </select>
        <button className="chip" type="button" onClick={() => bulk({ tagId: bulkTag })}>{t("leads.apply")}</button>
        <button className="chip" type="button" onClick={() => bulk({ archive: true })}>{t("leads.archive")}</button>
        <input className="w-40" placeholder={t("leads.saveView")} value={viewName} onChange={(e) => setViewName(e.target.value)} />
        <button
          className="chip"
          type="button"
          onClick={async () => {
            if (!viewName) return;
            await fetch("/api/views", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: viewName, filters }) });
            setViewName("");
            setViews(await fetch("/api/views").then((r) => r.json()));
          }}
        >
          {t("common.save")}
        </button>
        {views.map((v) => (
          <button key={v.id} className="chip" type="button" onClick={() => setFilters({ ...filters, ...v.filters })}>
            {v.name}
          </button>
        ))}
      </div>
      {error && <div className="text-sm text-[#f87171] mb-3">{error}</div>}
      {importNotice && <div className="text-sm text-[#34d399] mb-3">{importNotice}</div>}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#182235] text-[#93a0bb]">
            <tr>
              <th className="p-3 w-8">
                <input type="checkbox" className="w-auto" checked={selected.length === rows.length && rows.length > 0} onChange={(e) => setSelected(e.target.checked ? rows.map((r) => r.id) : [])} />
              </th>
              <th className="text-left p-3">{t("common.client")}</th>
              <th className="text-left p-3">{t("common.phone")}</th>
              <th className="text-left p-3">{t("common.source")}</th>
              <th className="text-left p-3">{t("common.manager")}</th>
              <th className="text-left p-3">{t("common.stage")}</th>
              <th className="text-left p-3">{t("leads.tag")}</th>
              <th className="text-left p-3">{t("common.amount")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-[#243049]">
                <td className="p-3">
                  <input type="checkbox" className="w-auto" checked={selected.includes(c.id)} onChange={(e) => setSelected((prev) => (e.target.checked ? [...prev, c.id] : prev.filter((id) => id !== c.id)))} />
                </td>
                <td className="p-3">
                  <Link href={`/contacts/${c.id}`} className="text-[#93c5fd]">
                    {c.firstName} {c.lastName}
                  </Link>
                  {c.company?.name ? <div className="muted text-xs">{c.company.name}</div> : null}
                </td>
                <td className="p-3">{c.phoneDisplay}</td>
                <td className="p-3">{t(`sources.${c.source}`, c.source)}</td>
                <td className="p-3">{c.manager?.name || t("common.dash")}</td>
                <td className="p-3">{c.pipelineStage?.name || t("common.dash")}</td>
                <td className="p-3">{(c.tags || []).map((x) => x.tag.name).join(", ")}</td>
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
