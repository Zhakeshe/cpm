"use client";

import { AppShell } from "@/components/AppShell";
import { ExportButton } from "@/components/ExportButton";
import { TagChips } from "@/components/TagChips";
import { useI18n } from "@/components/I18nProvider";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRealtime } from "@/lib/use-realtime";

type Tag = { id: string; name: string; color: string };
type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  phoneDisplay: string;
  source: string;
  address?: string | null;
  city?: string | null;
  manager?: { name: string };
  pipelineStage?: { name: string };
  tags?: Array<{ tag: Tag }>;
  createdAt?: string;
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

export default function LeadsPage() {
  const { t, localeTag } = useI18n();
  const [rows, setRows] = useState<Contact[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [stages, setStages] = useState<Array<{ id: string; name: string }>>([]);
  const [form, setForm] = useState({
    firstName: "",
    phone: "",
    source: "MANUAL",
    comment: "",
    city: "",
    address: "",
    tagIds: [] as string[],
  });
  const [filters, setFilters] = useState({ q: "", stage: "", source: "", from: "", to: "" });
  const [error, setError] = useState("");
  const [role, setRole] = useState("MANAGER");
  const isAdmin = role === "ADMIN" || role === "SUPERVISOR";

  const query = useCallback(() => {
    const qs = new URLSearchParams();
    if (filters.q) qs.set("q", filters.q);
    if (filters.stage) qs.set("stage", filters.stage);
    if (filters.source) qs.set("source", filters.source);
    if (filters.from) qs.set("from", filters.from);
    if (filters.to) qs.set("to", filters.to);
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
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((u) => setRole(u.role || "MANAGER"));
    fetch("/api/pipeline")
      .then((r) => r.json())
      .then((data) => setStages(Array.isArray(data) ? data : []));
    fetch("/api/tags")
      .then((r) => r.json())
      .then((data) => setTags(Array.isArray(data) ? data : []));
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
    setForm({ firstName: "", phone: "", source: "MANUAL", comment: "", city: "", address: "", tagIds: [] });
    await load();
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">{t("leads.title")}</h1>
        {isAdmin && <ExportButton href="/api/export/leads" />}
      </div>
      <form onSubmit={create} className="card p-4 mb-4 grid md:grid-cols-6 gap-3">
        <input placeholder={t("common.name")} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        <input placeholder={t("common.phone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {t(`sources.${s}`)}
            </option>
          ))}
        </select>
        <input placeholder={t("contact.city")} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <input placeholder={t("contact.address")} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <input placeholder={t("common.comment")} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
        <div className="md:col-span-6 space-y-2">
          <div className="text-sm muted">{t("contact.tags")}</div>
          <TagChips
            tags={tags}
            selectedIds={form.tagIds}
            onToggle={(tag, on) =>
              setForm({
                ...form,
                tagIds: on ? form.tagIds.filter((id) => id !== tag.id) : [...form.tagIds, tag.id],
              })
            }
          />
        </div>
        <button className="rounded-xl bg-[#2563eb] md:col-span-6">{t("common.create")}</button>
      </form>
      <div className="card p-4 mb-4 grid md:grid-cols-5 gap-2">
        <input placeholder={t("common.search")} value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
        <select value={filters.stage} onChange={(e) => setFilters({ ...filters, stage: e.target.value })}>
          <option value="">{t("common.stage")}</option>
          {stages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select value={filters.source} onChange={(e) => setFilters({ ...filters, source: e.target.value })}>
          <option value="">{t("common.source")}</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {t(`sources.${s}`)}
            </option>
          ))}
        </select>
        <label className="text-xs muted">
          {t("leads.from")}
          <input type="date" className="mt-1" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        </label>
        <label className="text-xs muted">
          {t("leads.to")}
          <input type="date" className="mt-1" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        </label>
      </div>
      {error && <div className="text-sm text-[#f87171] mb-3">{error}</div>}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#182235] text-[#93a0bb]">
            <tr>
              <th className="text-left p-3">{t("common.client")}</th>
              <th className="text-left p-3">{t("common.date")}</th>
              <th className="text-left p-3">{t("common.phone")}</th>
              <th className="text-left p-3">{t("common.source")}</th>
              {isAdmin && <th className="text-left p-3">{t("common.manager")}</th>}
              <th className="text-left p-3">{t("common.stage")}</th>
              <th className="text-left p-3">{t("leads.tag")}</th>
              <th className="text-left p-3">{t("contact.address")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-[#243049] align-top">
                <td className="p-3">
                  <Link href={`/contacts/${c.id}`} className="text-[#93c5fd]">
                    {c.firstName} {c.lastName}
                  </Link>
                </td>
                <td className="p-3 whitespace-nowrap">
                  {c.createdAt
                    ? new Date(c.createdAt).toLocaleString(localeTag, {
                        timeZone: "Asia/Almaty",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : t("common.dash")}
                </td>
                <td className="p-3">{c.phoneDisplay}</td>
                <td className="p-3">{t(`sources.${c.source}`, c.source)}</td>
                {isAdmin && <td className="p-3">{c.manager?.name || t("common.dash")}</td>}
                <td className="p-3">{c.pipelineStage?.name || t("common.dash")}</td>
                <td className="p-3">
                  <TagChips tags={(c.tags || []).map((x) => x.tag)} selectedIds={(c.tags || []).map((x) => x.tag.id)} />
                </td>
                <td className="p-3">{[c.city, c.address].filter(Boolean).join(", ") || t("common.dash")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
