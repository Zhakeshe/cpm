"use client";

import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/components/I18nProvider";
import { addDays, startOfDay } from "date-fns";
import {
  AlertTriangle, CalendarClock, Check, CheckCircle2, ChevronDown, ChevronRight,
  CircleUserRound, Clock3, Filter, History, MessageCircle, Phone, Search, Send,
  UserRound, Video, X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Tag = { id: string; name: string; color: string };
type Person = { id: string; name: string };
type Contact = {
  id: string; firstName: string; lastName: string; phoneDisplay: string; comment: string;
  pipelineStage?: { id: string; name: string } | null;
  tags?: Array<{ tag: Tag }>;
};
type Task = {
  id: string; type: string; description: string; dueAt: string;
  status: "OPEN" | "DONE" | "CANCELLED"; createdAt: string; updatedAt: string;
  contact?: Contact | null; manager: Person; creator?: Person | null;
};
type AuditEntry = {
  id: string; action: string; oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null; createdAt: string; actor?: Person | null;
};
type BucketKey = "overdueToday" | "overdue1to3" | "overdue4to7" | "overdueOlder" | "today" | "tomorrow" | "week" | "later" | "done";
type BucketState = { items: Task[]; total: number; nextOffset: number; hasMore: boolean; loaded: boolean; loading: boolean };

const TASK_TYPES = ["CALL", "WHATSAPP", "DEMO", "MEETING", "SEND_PROPOSAL", "FOLLOW_UP", "OTHER"];
const OVERDUE_BUCKETS: BucketKey[] = ["overdueToday", "overdue1to3", "overdue4to7", "overdueOlder"];
const GROUPS: Array<{ key: BucketKey; tone: string }> = [
  { key: "overdueToday", tone: "border-[#7f1d1d] bg-[#2b1720]" },
  { key: "overdue1to3", tone: "border-[#7f1d1d] bg-[#291820]" },
  { key: "overdue4to7", tone: "border-[#7f1d1d] bg-[#25171e]" },
  { key: "overdueOlder", tone: "border-[#7f1d1d] bg-[#21161c]" },
  { key: "today", tone: "border-[#1d4ed8] bg-[#13233f]" },
  { key: "tomorrow", tone: "border-[#334155] bg-[#151e32]" },
  { key: "week", tone: "border-[#334155] bg-[#151e32]" },
  { key: "later", tone: "border-[#334155] bg-[#151e32]" },
  { key: "done", tone: "border-[#14532d] bg-[#11271f]" },
];
const DEFAULT_COLLAPSED = new Set<BucketKey>([...OVERDUE_BUCKETS, "later", "done"]);

function emptyBuckets(): Record<BucketKey, BucketState> {
  return Object.fromEntries(GROUPS.map(({ key }) => [key, { items: [], total: 0, nextOffset: 0, hasMore: false, loaded: false, loading: false }])) as unknown as Record<BucketKey, BucketState>;
}

function localDateTimeValue(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function defaultDueAt() {
  const date = addDays(startOfDay(new Date()), 1);
  date.setHours(10, 0, 0, 0);
  return localDateTimeValue(date);
}

function tomorrowIso() {
  const date = addDays(startOfDay(new Date()), 1);
  date.setHours(10, 0, 0, 0);
  return date.toISOString();
}

function TaskIcon({ type }: { type: string }) {
  if (type === "CALL") return <Phone className="h-4 w-4" />;
  if (type === "WHATSAPP") return <MessageCircle className="h-4 w-4" />;
  if (type === "DEMO") return <Video className="h-4 w-4" />;
  if (type === "SEND_PROPOSAL") return <Send className="h-4 w-4" />;
  return <CalendarClock className="h-4 w-4" />;
}

export default function TasksPage() {
  const { t, localeTag } = useI18n();
  const [buckets, setBuckets] = useState(emptyBuckets);
  const [counts, setCounts] = useState<Record<BucketKey, number>>(() => Object.fromEntries(GROUPS.map(({ key }) => [key, 0])) as unknown as Record<BucketKey, number>);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [managers, setManagers] = useState<Person[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [canAssign, setCanAssign] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<AuditEntry[]>([]);
  const [rescheduleAt, setRescheduleAt] = useState("");
  const [bulkManagerId, setBulkManagerId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [collapsed, setCollapsed] = useState<Set<BucketKey>>(() => new Set(DEFAULT_COLLAPSED));
  const [accordionReady, setAccordionReady] = useState(false);
  const lastFilterSignature = useRef("");
  const [filters, setFilters] = useState({ q: "", managerId: "", contactId: "", type: "", tagId: "", from: "", to: "", overdueOnly: false });
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [form, setForm] = useState({ type: "CALL", description: "", dueAt: defaultDueAt(), contactId: "", managerId: "" });

  useEffect(() => {
    const stored = window.localStorage.getItem("crm_task_collapsed_groups");
    if (stored) {
      try {
        const keys = JSON.parse(stored) as BucketKey[];
        setCollapsed(new Set(keys.filter((key) => GROUPS.some((group) => group.key === key))));
      } catch { /* keep safe defaults */ }
    }
    setAccordionReady(true);
  }, []);

  useEffect(() => {
    if (accordionReady) window.localStorage.setItem("crm_task_collapsed_groups", JSON.stringify([...collapsed]));
  }, [accordionReady, collapsed]);

  useEffect(() => {
    Promise.all([
      fetch("/api/contacts").then((response) => response.json()),
      fetch("/api/users").then((response) => response.json()),
      fetch("/api/tags").then((response) => response.json()),
      fetch("/api/auth/me").then((response) => response.json()),
    ]).then(([contactRows, managerRows, tagRows, me]) => {
      setContacts(Array.isArray(contactRows) ? contactRows : []);
      setManagers(Array.isArray(managerRows) ? managerRows : []);
      setTags(Array.isArray(tagRows) ? tagRows : []);
      setCanAssign(me?.role === "ADMIN" || me?.role === "SUPERVISOR");
      setForm((current) => ({ ...current, managerId: me?.id || "" }));
    }).catch(() => setError(t("tasks.loadFailed")));
  }, [t]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(filters.q.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [filters.q]);

  const filterQuery = useMemo(() => {
    const params = new URLSearchParams({ tz: String(new Date().getTimezoneOffset()) });
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (filters.managerId) params.set("managerId", filters.managerId);
    if (filters.contactId) params.set("contactId", filters.contactId);
    if (filters.type) params.set("type", filters.type);
    if (filters.tagId) params.set("tagId", filters.tagId);
    if (filters.from) params.set("from", new Date(`${filters.from}T00:00:00`).toISOString());
    if (filters.to) params.set("to", addDays(new Date(`${filters.to}T00:00:00`), 1).toISOString());
    return params.toString();
  }, [debouncedQuery, filters.contactId, filters.from, filters.managerId, filters.tagId, filters.to, filters.type]);

  const fetchBucket = useCallback(async (key: BucketKey, offset = 0) => {
    setBuckets((current) => ({ ...current, [key]: { ...current[key], loading: true } }));
    const response = await fetch(`/api/tasks?${filterQuery}&bucket=${key}&offset=${offset}&limit=30`);
    if (!response.ok) throw new Error("TASKS_LOAD_FAILED");
    const data = await response.json();
    setBuckets((current) => ({
      ...current,
      [key]: {
        items: offset ? [...current[key].items, ...data.items] : data.items,
        total: data.total,
        nextOffset: data.nextOffset,
        hasMore: data.hasMore,
        loaded: true,
        loading: false,
      },
    }));
  }, [filterQuery]);

  const fetchSummary = useCallback(async () => {
    const response = await fetch(`/api/tasks?${filterQuery}&mode=summary`);
    if (!response.ok) throw new Error("TASKS_LOAD_FAILED");
    const data = await response.json();
    setCounts(data.counts);
  }, [filterQuery]);

  useEffect(() => {
    if (!accordionReady) return;
    const signature = `${filterQuery}|${filters.overdueOnly}`;
    if (lastFilterSignature.current === signature) return;
    lastFilterSignature.current = signature;
    setBuckets(emptyBuckets());
    setSelectedIds(new Set());
    const visible = GROUPS.map(({ key }) => key).filter((key) => !collapsed.has(key) && (!filters.overdueOnly || OVERDUE_BUCKETS.includes(key)));
    Promise.all([fetchSummary(), ...visible.map((key) => fetchBucket(key))]).catch(() => setError(t("tasks.loadFailed")));
  }, [accordionReady, collapsed, fetchBucket, fetchSummary, filterQuery, filters.overdueOnly, t]);

  const allLoadedTasks = useMemo(() => GROUPS.flatMap(({ key }) => buckets[key].items), [buckets]);
  const selected = allLoadedTasks.find((task) => task.id === selectedId) || null;

  useEffect(() => {
    if (!selected) { setHistory([]); return; }
    setRescheduleAt(localDateTimeValue(new Date(selected.dueAt)));
    fetch(`/api/tasks/${selected.id}/history`).then((response) => response.ok ? response.json() : []).then(setHistory);
  }, [selected]);

  const refresh = useCallback(async () => {
    await fetchSummary();
    const loaded = GROUPS.map(({ key }) => key).filter((key) => buckets[key].loaded && !collapsed.has(key));
    await Promise.all(loaded.map((key) => fetchBucket(key)));
  }, [buckets, collapsed, fetchBucket, fetchSummary]);

  function toggleGroup(key: BucketKey) {
    const opening = collapsed.has(key);
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
    if (opening) fetchBucket(key).catch(() => setError(t("tasks.loadFailed")));
  }

  function toggleTask(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else if (next.size < 200) next.add(id);
      return next;
    });
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true); setError("");
    const response = await fetch("/api/tasks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, dueAt: new Date(form.dueAt).toISOString(), managerId: canAssign ? form.managerId : undefined }),
    });
    if (!response.ok) setError(t("tasks.createFailed"));
    else { setForm((current) => ({ ...current, description: "", dueAt: defaultDueAt() })); await refresh(); }
    setSaving(false);
  }

  async function updateTask(id: string, payload: { status?: Task["status"]; dueAt?: string }) {
    setSaving(true); setError("");
    const response = await fetch("/api/tasks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...payload }) });
    if (!response.ok) setError(t("tasks.updateFailed")); else await refresh();
    setSaving(false);
  }

  async function bulk(action: "DONE" | "CANCEL" | "RESCHEDULE" | "REASSIGN") {
    if (!selectedIds.size) return;
    if (action === "REASSIGN" && !bulkManagerId) return;
    setSaving(true); setError("");
    const response = await fetch("/api/tasks/bulk", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ids: [...selectedIds], dueAt: action === "RESCHEDULE" ? tomorrowIso() : undefined, managerId: action === "REASSIGN" ? bulkManagerId : undefined }),
    });
    if (!response.ok) setError(t("tasks.bulkFailed"));
    else { setSelectedIds(new Set()); await refresh(); }
    setSaving(false);
  }

  const formatDate = (value: string) => new Date(value).toLocaleString(localeTag, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  const shownGroups = filters.overdueOnly ? GROUPS.filter(({ key }) => OVERDUE_BUCKETS.includes(key)) : GROUPS;
  const overdueCount = OVERDUE_BUCKETS.reduce((sum, key) => sum + (counts[key] || 0), 0);
  const openCount = GROUPS.filter(({ key }) => key !== "done").reduce((sum, { key }) => sum + (counts[key] || 0), 0);

  function historyLabel(action: string) {
    if (action.includes("create")) return t("tasks.historyCreated");
    if (action.includes("reschedule")) return t("tasks.historyRescheduled");
    if (action.includes("reassign")) return t("tasks.historyReassigned");
    if (action.includes("done")) return t("tasks.historyCompleted");
    if (action.includes("cancel")) return t("tasks.historyCancelled");
    return t("tasks.historyUpdated");
  }

  function historyDetail(entry: AuditEntry) {
    if (entry.action.includes("reschedule") && typeof entry.newValue?.dueAt === "string") return `→ ${formatDate(entry.newValue.dueAt)}`;
    if (entry.action.includes("reassign") && typeof entry.newValue?.managerId === "string") {
      return `→ ${managers.find((manager) => manager.id === entry.newValue?.managerId)?.name || "—"}`;
    }
    return "";
  }

  return (
    <AppShell>
      <div className="max-w-full min-w-0 overflow-x-hidden">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div><h1 className="text-2xl font-semibold">{t("tasks.title")}</h1><p className="muted mt-1 text-sm">{t("tasks.subtitle")}</p></div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[["open", openCount, "text-[#93c5fd]"], ["overdue", overdueCount, "text-[#fca5a5]"], ["today", counts.today || 0, "text-[#fcd34d]"], ["done", counts.done || 0, "text-[#6ee7b7]"]].map(([key, value, color]) => (
              <div key={key} className="card min-w-20 px-3 py-2 text-center"><div className={`text-xl font-semibold ${color}`}>{value}</div><div className="muted text-[11px]">{t(`tasks.${key}`)}</div></div>
            ))}
          </div>
        </div>

        <form onSubmit={create} className="card mb-5 p-4">
          <div className="mb-3 flex items-center gap-2 font-medium"><CalendarClock className="h-4 w-4 text-[#60a5fa]" />{t("tasks.newTask")}</div>
          <div className={`grid gap-3 md:grid-cols-2 ${canAssign ? "xl:grid-cols-6" : "xl:grid-cols-5"}`}>
            <select required value={form.contactId} onChange={(event) => setForm({ ...form, contactId: event.target.value })}><option value="">{t("meetings.pickClient")}</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.firstName} {contact.lastName}</option>)}</select>
            {canAssign && <select required value={form.managerId} onChange={(event) => setForm({ ...form, managerId: event.target.value })}><option value="">{t("tasks.assignee")}</option>{managers.map((manager) => <option key={manager.id} value={manager.id}>{manager.name}</option>)}</select>}
            <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>{TASK_TYPES.map((type) => <option key={type} value={type}>{t(`taskTypes.${type}`)}</option>)}</select>
            <input required className="xl:col-span-2" placeholder={t("tasks.descriptionHint")} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            <div className="flex min-w-0 gap-2"><input className="min-w-0" required type="datetime-local" value={form.dueAt} onChange={(event) => setForm({ ...form, dueAt: event.target.value })} /><button disabled={saving} className="shrink-0 rounded-xl bg-[#2563eb] px-4 font-medium disabled:opacity-60">{t("common.create")}</button></div>
          </div>
        </form>

        <div className="card mb-4 p-3">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium"><Filter className="h-4 w-4" />{t("tasks.filters")}</div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <label className="relative sm:col-span-2"><Search className="muted absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" /><input className="pl-9" value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} placeholder={t("tasks.search")} /></label>
            {canAssign && <select value={filters.managerId} onChange={(event) => setFilters({ ...filters, managerId: event.target.value })}><option value="">{t("tasks.allManagers")}</option>{managers.map((manager) => <option key={manager.id} value={manager.id}>{manager.name}</option>)}</select>}
            <select value={filters.contactId} onChange={(event) => setFilters({ ...filters, contactId: event.target.value })}><option value="">{t("tasks.allClients")}</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.firstName} {contact.lastName}</option>)}</select>
            <select value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}><option value="">{t("tasks.allTypes")}</option>{TASK_TYPES.map((type) => <option key={type} value={type}>{t(`taskTypes.${type}`)}</option>)}</select>
            <select value={filters.tagId} onChange={(event) => setFilters({ ...filters, tagId: event.target.value })}><option value="">{t("tasks.allTags")}</option>{tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}</select>
            <input aria-label={t("tasks.dateFrom")} title={t("tasks.dateFrom")} type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} />
            <input aria-label={t("tasks.dateTo")} title={t("tasks.dateTo")} type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} />
          </div>
          <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm"><input className="w-auto" type="checkbox" checked={filters.overdueOnly} onChange={(event) => setFilters({ ...filters, overdueOnly: event.target.checked })} />{t("tasks.overdueOnly")}</label>
        </div>

        {selectedIds.size > 0 && (
          <div className="card sticky top-2 z-20 mb-4 flex flex-wrap items-center gap-2 border-[#2563eb] p-3 shadow-xl">
            <strong className="mr-2 text-sm">{t("tasks.selected", { count: selectedIds.size })}</strong>
            <button className="chip" disabled={saving} onClick={() => bulk("RESCHEDULE")}>{t("tasks.moveTomorrow")}</button>
            <button className="chip" disabled={saving} onClick={() => bulk("DONE")}>{t("tasks.markDone")}</button>
            <button className="chip text-[#fca5a5]" disabled={saving} onClick={() => bulk("CANCEL")}>{t("tasks.cancel")}</button>
            {canAssign && <><select className="w-48" value={bulkManagerId} onChange={(event) => setBulkManagerId(event.target.value)}><option value="">{t("tasks.assignee")}</option>{managers.map((manager) => <option key={manager.id} value={manager.id}>{manager.name}</option>)}</select><button className="chip" disabled={saving || !bulkManagerId} onClick={() => bulk("REASSIGN")}>{t("tasks.reassign")}</button></>}
            <button className="muted ml-auto p-2" onClick={() => setSelectedIds(new Set())}><X className="h-4 w-4" /></button>
          </div>
        )}

        {error && <div className="mb-4 rounded-xl border border-[#7f1d1d] bg-[#2b1720] px-4 py-3 text-sm text-[#fca5a5]">{error}</div>}

        <div className={`grid min-w-0 gap-5 ${selected ? "xl:grid-cols-[minmax(0,1fr)_380px]" : ""}`}>
          <div className="min-w-0 space-y-4">
            {shownGroups.map((group) => {
              const state = buckets[group.key];
              const isOverdue = OVERDUE_BUCKETS.includes(group.key);
              const allChecked = state.items.length > 0 && state.items.every((task) => selectedIds.has(task.id));
              return (
                <section key={group.key} className={`min-w-0 rounded-2xl border ${group.tone}`}>
                  <div className={`flex items-center gap-2 px-4 py-3 ${collapsed.has(group.key) ? "" : "border-b border-white/10"}`}>
                    <input className="w-auto" type="checkbox" checked={allChecked} disabled={!state.items.length} onChange={() => setSelectedIds((current) => { const next = new Set(current); state.items.forEach((task) => allChecked ? next.delete(task.id) : next.size < 200 && next.add(task.id)); return next; })} onClick={(event) => event.stopPropagation()} />
                    <button type="button" onClick={() => toggleGroup(group.key)} aria-expanded={!collapsed.has(group.key)} className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left">
                      <span className="flex min-w-0 items-center gap-2 font-medium">{collapsed.has(group.key) ? <ChevronRight className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}{isOverdue ? <AlertTriangle className="h-4 w-4 shrink-0 text-[#f87171]" /> : group.key === "done" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-[#34d399]" /> : <Clock3 className="h-4 w-4 shrink-0 text-[#93a0bb]" />}<span className="truncate">{t(`tasks.${group.key}`)}</span></span>
                      <span className="chip shrink-0">{counts[group.key] || 0}</span>
                    </button>
                  </div>
                  {!collapsed.has(group.key) && <div className="divide-y divide-white/10">
                    {state.loading && !state.items.length && <div className="muted p-5 text-sm">{t("common.loading", "Загрузка…")}</div>}
                    {!state.loading && !state.items.length && <div className="muted p-5 text-sm">{t("tasks.emptyGroup")}</div>}
                    {state.items.map((task) => (
                      <div key={task.id} role="button" tabIndex={0} onClick={() => setSelectedId(task.id)} onKeyDown={(event) => { if (event.key === "Enter") setSelectedId(task.id); }} className={`grid min-w-0 cursor-pointer gap-3 px-4 py-4 text-left hover:bg-white/5 md:grid-cols-[auto_minmax(0,1fr)_auto] ${selectedId === task.id ? "bg-white/5" : ""}`}>
                        <input className="mt-2 w-auto" type="checkbox" checked={selectedIds.has(task.id)} onChange={() => toggleTask(task.id)} onClick={(event) => event.stopPropagation()} />
                        <div className="min-w-0"><div className="mb-2 flex min-w-0 items-center gap-2"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${isOverdue ? "bg-[#7f1d1d] text-[#fecaca]" : "bg-[#1e3a5f] text-[#93c5fd]"}`}><TaskIcon type={task.type} /></span><span className={`truncate ${task.status === "DONE" ? "text-[#9ca3af] line-through" : "font-medium"}`}>{task.description}</span></div><div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">{task.contact ? <Link href={`/contacts/${task.contact.id}`} onClick={(event) => event.stopPropagation()} className="flex items-center gap-1 text-[#93c5fd] hover:underline"><CircleUserRound className="h-3.5 w-3.5" />{task.contact.firstName} {task.contact.lastName}</Link> : <span className="muted">{t("tasks.noClient")}</span>}<span className="muted flex items-center gap-1"><UserRound className="h-3.5 w-3.5" />{task.manager.name}</span>{(task.contact?.tags || []).map(({ tag }) => <span key={tag.id} className="rounded-full px-2 py-0.5" style={{ color: tag.color, backgroundColor: `${tag.color}20` }}>{tag.name}</span>)}</div></div>
                        <div className="flex items-center justify-between gap-3 md:justify-end"><div className={`whitespace-nowrap text-right text-xs ${isOverdue ? "text-[#fca5a5]" : "muted"}`}><div>{formatDate(task.dueAt)}</div><div className="mt-1">{t(`taskTypes.${task.type}`)}</div></div>{task.status === "OPEN" && <button title={t("tasks.markDone")} onClick={(event) => { event.stopPropagation(); updateTask(task.id, { status: "DONE" }); }} className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#334155] text-[#93a0bb] hover:border-[#34d399] hover:text-[#34d399]"><Check className="h-4 w-4" /></button>}<ChevronRight className="muted h-4 w-4 shrink-0" /></div>
                      </div>
                    ))}
                    {state.hasMore && <div className="p-3 text-center"><button className="chip" disabled={state.loading} onClick={() => fetchBucket(group.key, state.nextOffset)}>{state.loading ? t("common.loading", "Загрузка…") : t("tasks.showMore")}</button></div>}
                  </div>}
                </section>
              );
            })}
          </div>

          {selected && <aside className="card h-fit min-w-0 p-5 xl:sticky xl:top-5">
            <div className="mb-5 flex items-start justify-between gap-3"><div><div className={`mb-2 inline-flex rounded-full px-2.5 py-1 text-xs ${selected.status === "DONE" ? "bg-[#14532d] text-[#6ee7b7]" : new Date(selected.dueAt) < new Date() ? "bg-[#7f1d1d] text-[#fca5a5]" : "bg-[#1e3a5f] text-[#93c5fd]"}`}>{selected.status === "DONE" ? t("tasks.done") : new Date(selected.dueAt) < new Date() ? t("tasks.overdue") : t("tasks.open")}</div><h2 className="break-words text-lg font-semibold">{selected.description}</h2><div className="muted mt-1 flex items-center gap-1 text-xs"><TaskIcon type={selected.type} />{t(`taskTypes.${selected.type}`)}</div></div><button className="muted shrink-0 p-1" onClick={() => setSelectedId(null)}><X className="h-5 w-5" /></button></div>
            {selected.contact && <Link href={`/contacts/${selected.contact.id}`} className="mb-5 block rounded-xl border border-[#243049] bg-[#0e1626] p-4 hover:border-[#3b82f6]"><div className="flex items-center justify-between"><span className="font-medium text-[#93c5fd]">{selected.contact.firstName} {selected.contact.lastName}</span><ChevronRight className="h-4 w-4" /></div><div className="muted text-xs">{selected.contact.phoneDisplay}</div>{selected.contact.pipelineStage?.name && <div className="mt-2 text-xs">{selected.contact.pipelineStage.name}</div>}</Link>}
            <dl className="mb-5 grid grid-cols-2 gap-4 text-sm"><div><dt className="muted text-xs">{t("tasks.createdAt")}</dt><dd>{formatDate(selected.createdAt)}</dd></div><div><dt className="muted text-xs">{t("tasks.dueAt")}</dt><dd>{formatDate(selected.dueAt)}</dd></div><div><dt className="muted text-xs">{t("tasks.createdBy")}</dt><dd>{selected.creator?.name || "—"}</dd></div><div><dt className="muted text-xs">{t("tasks.assignee")}</dt><dd>{selected.manager.name}</dd></div></dl>
            {selected.contact?.comment && <div className="mb-5 rounded-xl border border-[#243049] p-3"><div className="muted text-xs">{t("common.comment")}</div><p className="whitespace-pre-wrap break-words text-sm">{selected.contact.comment}</p></div>}
            {selected.status === "OPEN" && <div className="mb-5 space-y-3 border-t border-[#243049] pt-4"><div className="text-sm font-medium">{t("tasks.reschedule")}</div><div className="flex min-w-0 gap-2"><input className="min-w-0" type="datetime-local" value={rescheduleAt} onChange={(event) => setRescheduleAt(event.target.value)} /><button className="chip shrink-0" disabled={saving || !rescheduleAt} onClick={() => updateTask(selected.id, { dueAt: new Date(rescheduleAt).toISOString() })}>{t("common.save")}</button></div><button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#166534] px-4 py-2.5 text-sm" disabled={saving} onClick={() => updateTask(selected.id, { status: "DONE" })}><CheckCircle2 className="h-4 w-4" />{t("tasks.markDone")}</button></div>}
            <div className="border-t border-[#243049] pt-4"><div className="mb-3 flex items-center gap-2 font-medium"><History className="h-4 w-4" />{t("tasks.history")}</div><div className="space-y-3"><div className="relative pl-5 text-sm before:absolute before:left-1 before:top-2 before:h-2 before:w-2 before:rounded-full before:bg-[#3b82f6]"><div>{t("tasks.historyCreated")}</div><div className="muted text-xs">{selected.creator?.name || "—"} · {formatDate(selected.createdAt)}</div></div>{history.filter((entry) => !entry.action.includes("create")).map((entry) => <div key={entry.id} className="relative pl-5 text-sm before:absolute before:left-1 before:top-2 before:h-2 before:w-2 before:rounded-full before:bg-[#64748b]"><div>{historyLabel(entry.action)} <span className="muted">{historyDetail(entry)}</span></div><div className="muted text-xs">{entry.actor?.name || "—"} · {formatDate(entry.createdAt)}</div></div>)}</div></div>
          </aside>}
        </div>
      </div>
    </AppShell>
  );
}
