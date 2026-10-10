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
  email?: string | null;
  city: string;
  createdAt: string;
  source: string;
  manager?: { name: string };
  pipelineStage?: { name: string };
  company?: { name: string } | null;
  tags?: Array<{ tag: { id: string; name: string; color: string } }>;
};

const SOURCES = [
  "MANUAL",
  "WHATSAPP",
  "INSTAGRAM",
  "TIKTOK",
  "FACEBOOK",
  "YOUTUBE",
  "PHONE_CALL",
  "WEBSITE",
  "REFERRAL",
  "OTHER",
];

const TAG_COLORS = ["#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed", "#db2777", "#0891b2"];

function tagBadgeColor(tag: { name: string; color: string }) {
  if (tag.color && tag.color.toLowerCase() !== "#2563eb") return tag.color;
  const hash = Array.from(tag.name).reduce((total, character) => total + character.charCodeAt(0), 0);
  return TAG_COLORS[hash % TAG_COLORS.length];
}

function LeadsInner() {
  const params = useSearchParams();
  const { t, localeTag } = useI18n();
  const [rows, setRows] = useState<Contact[]>([]);
  const [stages, setStages] = useState<Array<{ id: string; slug: string; name: string }>>([]);
  const [managers, setManagers] = useState<Array<{ id: string; name: string }>>([]);
  const [tags, setTags] = useState<Array<{ id: string; name: string }>>([]);
  const [form, setForm] = useState({ firstName: "", phone: "", source: "MANUAL", comment: "" });
  const [filters, setFilters] = useState({
    q: params.get("q") || "",
    stage: params.get("stage") || "",
    manager: params.get("manager") || "",
    tag: params.get("tag") || "",
    date: "",
  });
  const [error, setError] = useState("");
  const [importNotice, setImportNotice] = useState("");
  const [role, setRole] = useState("MANAGER");
  const isAdmin = role === "ADMIN" || role === "SUPERVISOR";

  const query = useCallback(() => {
    const qs = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v && k !== "date") qs.set(k, v);
    });
    if (filters.date) {
      const start = new Date(`${filters.date}T00:00:00`);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      qs.set("from", start.toISOString());
      qs.set("to", end.toISOString());
    }
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
    fetch("/api/auth/me").then((r) => r.json()).then((u) => setRole(u.role || "MANAGER"));
    fetch("/api/pipeline").then((r) => r.json()).then(setStages);
    fetch("/api/users").then((r) => r.json()).then(setManagers);
    fetch("/api/tags").then((r) => r.json()).then(setTags);
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

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">{t("leads.title")}</h1>
        {isAdmin && (
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
        )}
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
      <div className="card p-4 mb-4 grid md:grid-cols-3 xl:grid-cols-6 gap-2">
        <input className="md:col-span-2" placeholder={t("common.searchShort")} value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
        <select value={filters.stage} onChange={(e) => setFilters({ ...filters, stage: e.target.value })}>
          <option value="">{t("common.stage")}</option>
          {stages.filter((stage) => stage.slug !== "paid" && stage.slug !== "lost").map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        {isAdmin && (
        <select value={filters.manager} onChange={(e) => setFilters({ ...filters, manager: e.target.value })}>
          <option value="">{t("common.manager")}</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        )}
        <select value={filters.tag} onChange={(e) => setFilters({ ...filters, tag: e.target.value })}>
          <option value="">{t("leads.tag")}</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>{tag.name}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 rounded-xl border border-[#2a3650] px-3 text-sm">
          <span className="muted shrink-0">{t("common.date")}</span>
          <input className="min-w-0 border-0 bg-transparent p-0" aria-label={t("common.date")} type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
        </label>
      </div>
      {error && <div className="text-sm text-[#f87171] mb-3">{error}</div>}
      {importNotice && <div className="text-sm text-[#34d399] mb-3">{importNotice}</div>}
      <div className="card max-w-full overflow-x-auto">
        <table className="w-full min-w-[1080px] text-sm">
          <thead className="bg-[#182235] text-[#93a0bb]">
            <tr>
              <th className="text-left p-3">{t("common.client")}</th>
              <th className="text-left p-3">{t("common.date")}</th>
              <th className="text-left p-3">{t("common.phone")}</th>
              <th className="text-left p-3">{t("common.email")}</th>
              <th className="text-left p-3">{t("common.source")}</th>
              {isAdmin && <th className="text-left p-3">{t("common.manager")}</th>}
              <th className="text-left p-3">{t("common.stage")}</th>
              <th className="text-left p-3">{t("leads.tag")}</th>
              <th className="text-left p-3">{t("contact.city")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-[#243049]">
                <td className="p-3">
                  <Link href={`/contacts/${c.id}`} className="text-[#93c5fd]">
                    {c.firstName} {c.lastName}
                  </Link>
                  {c.company?.name ? <div className="muted text-xs">{c.company.name}</div> : null}
                </td>
                <td className="whitespace-nowrap p-3">{new Date(c.createdAt).toLocaleString(localeTag)}</td>
                <td className="whitespace-nowrap p-3">{c.phoneDisplay}</td>
                <td className="p-3">{c.email || t("common.dash")}</td>
                <td className="p-3">{t(`sources.${c.source}`, c.source)}</td>
                {isAdmin && <td className="p-3">{c.manager?.name || t("common.dash")}</td>}
                <td className="p-3">{c.pipelineStage?.name || t("common.dash")}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1.5">
                    {(c.tags || []).length === 0 && <span className="muted">{t("common.dash")}</span>}
                    {(c.tags || []).map(({ tag }) => (
                      <span key={tag.id} className="rounded-full px-2.5 py-1 text-xs font-medium text-white" style={{ backgroundColor: tagBadgeColor(tag) }}>
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-3">{c.city || t("common.dash")}</td>
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
