"use client";

import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/components/I18nProvider";
import { addDays, isSameDay, startOfDay } from "date-fns";
import {
  AlertTriangle, CalendarClock, Check, CheckCircle2, ChevronRight, CircleUserRound,
  ChevronDown, Clock3, MessageCircle, Phone, Search, Send, UserRound, Video, X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Tag = { id: string; name: string; color: string };
type Person = { id: string; name: string };
type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  phoneDisplay: string;
  comment: string;
  source: string;
  status: string;
  pipelineStage?: { id: string; name: string } | null;
  tags?: Array<{ tag: Tag }>;
};
type Task = {
  id: string;
  type: string;
  description: string;
  dueAt: string;
  status: "OPEN" | "DONE" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  contact?: Contact | null;
  manager: Person;
  creator?: Person | null;
};

const TASK_TYPES = ["CALL", "WHATSAPP", "DEMO", "MEETING", "SEND_PROPOSAL", "FOLLOW_UP", "OTHER"];

function localDateTimeValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function initialDueAt() {
  const tomorrow = addDays(startOfDay(new Date()), 1);
  tomorrow.setHours(10, 0, 0, 0);
  return localDateTimeValue(tomorrow);
}

function TaskIcon({ type, className = "h-4 w-4" }: { type: string; className?: string }) {
  if (type === "CALL") return <Phone className={className} />;
  if (type === "WHATSAPP") return <MessageCircle className={className} />;
  if (type === "DEMO") return <Video className={className} />;
  if (type === "SEND_PROPOSAL") return <Send className={className} />;
  return <CalendarClock className={className} />;
}

export default function TasksPage() {
  const { t, localeTag } = useI18n();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [managers, setManagers] = useState<Person[]>([]);
  const [canAssign, setCanAssign] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [managerFilter, setManagerFilter] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    () => new Set(["overdue", "later", "done"]),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [rescheduleAt, setRescheduleAt] = useState("");
  const [form, setForm] = useState({
    type: "CALL", description: "", dueAt: initialDueAt(), contactId: "", managerId: "",
  });

  const loadTasks = useCallback(async () => {
    const response = await fetch("/api/tasks");
    if (!response.ok) throw new Error("TASKS_LOAD_FAILED");
    const rows = await response.json();
    setTasks(Array.isArray(rows) ? rows : []);
  }, []);

  useEffect(() => {
    Promise.all([
      loadTasks(),
      fetch("/api/contacts").then((response) => response.json()),
      fetch("/api/users").then((response) => response.json()),
      fetch("/api/auth/me").then((response) => response.json()),
    ])
      .then(([, contactRows, managerRows, me]) => {
        setContacts(Array.isArray(contactRows) ? contactRows : []);
        setManagers(Array.isArray(managerRows) ? managerRows : []);
        setCanAssign(me?.role === "ADMIN" || me?.role === "SUPERVISOR");
        setForm((current) => ({ ...current, managerId: current.managerId || me?.id || "" }));
      })
      .catch(() => setError(t("tasks.loadFailed")))
      .finally(() => setLoading(false));
  }, [loadTasks, t]);

  const selected = useMemo(() => tasks.find((task) => task.id === selectedId) || null, [selectedId, tasks]);

  useEffect(() => {
    if (selected) setRescheduleAt(localDateTimeValue(new Date(selected.dueAt)));
  }, [selected]);

  const filteredTasks = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    return tasks.filter((task) => {
      if (managerFilter && task.manager.id !== managerFilter) return false;
      if (!needle) return true;
      const client = task.contact ? `${task.contact.firstName} ${task.contact.lastName}` : "";
      return `${task.description} ${client} ${task.manager.name}`.toLocaleLowerCase().includes(needle);
    });
  }, [managerFilter, search, tasks]);

  const groups = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = addDays(today, 1);
    const afterTomorrow = addDays(today, 2);
    const afterWeek = addDays(today, 8);
    const open = filteredTasks.filter((task) => task.status === "OPEN");
    return [
      { key: "overdue", items: open.filter((task) => new Date(task.dueAt) < now), tone: "border-[#7f1d1d] bg-[#2b1720]" },
      { key: "today", items: open.filter((task) => new Date(task.dueAt) >= now && isSameDay(new Date(task.dueAt), today)), tone: "border-[#1d4ed8] bg-[#13233f]" },
      { key: "tomorrow", items: open.filter((task) => isSameDay(new Date(task.dueAt), tomorrow)), tone: "border-[#334155] bg-[#151e32]" },
      { key: "week", items: open.filter((task) => new Date(task.dueAt) >= afterTomorrow && new Date(task.dueAt) < afterWeek), tone: "border-[#334155] bg-[#151e32]" },
      { key: "later", items: open.filter((task) => new Date(task.dueAt) >= afterWeek), tone: "border-[#334155] bg-[#151e32]" },
      { key: "done", items: filteredTasks.filter((task) => task.status === "DONE"), tone: "border-[#14532d] bg-[#11271f]" },
    ];
  }, [filteredTasks]);

  const counts = useMemo(() => {
    const now = new Date();
    return {
      open: tasks.filter((task) => task.status === "OPEN").length,
      overdue: tasks.filter((task) => task.status === "OPEN" && new Date(task.dueAt) < now).length,
      today: tasks.filter((task) => task.status === "OPEN" && new Date(task.dueAt) >= now && isSameDay(new Date(task.dueAt), now)).length,
      done: tasks.filter((task) => task.status === "DONE").length,
    };
  }, [tasks]);

  function setQuickDue(days: number) {
    const date = days === 0 ? new Date(Date.now() + 60 * 60 * 1000) : addDays(startOfDay(new Date()), days);
    if (days === 0) date.setMinutes(0, 0, 0);
    else date.setHours(10, 0, 0, 0);
    setForm((current) => ({ ...current, dueAt: localDateTimeValue(date) }));
  }

  function toggleGroup(key: string) {
    setCollapsedGroups((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        dueAt: new Date(form.dueAt).toISOString(),
        contactId: form.contactId || undefined,
        managerId: canAssign ? form.managerId || undefined : undefined,
      }),
    });
    if (!response.ok) {
      setError(t("tasks.createFailed"));
      setSaving(false);
      return;
    }
    setForm((current) => ({ ...current, description: "", dueAt: initialDueAt() }));
    await loadTasks();
    setSaving(false);
  }

  async function updateTask(id: string, payload: { status?: Task["status"]; dueAt?: string }) {
    setSaving(true);
    setError("");
    const response = await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...payload }),
    });
    if (!response.ok) {
      setError(t("tasks.updateFailed"));
      setSaving(false);
      return;
    }
    await loadTasks();
    setSaving(false);
  }

  const formatDate = (value: string) => new Date(value).toLocaleString(localeTag, {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t("tasks.title")}</h1>
          <p className="muted mt-1 text-sm">{t("tasks.subtitle")}</p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            ["open", counts.open, "text-[#93c5fd]"],
            ["overdue", counts.overdue, "text-[#fca5a5]"],
            ["today", counts.today, "text-[#fcd34d]"],
            ["done", counts.done, "text-[#6ee7b7]"],
          ].map(([key, value, color]) => (
            <div key={key} className="card min-w-20 px-3 py-2 text-center">
              <div className={`text-xl font-semibold ${color}`}>{value}</div>
              <div className="muted text-[11px]">{t(`tasks.${key}`)}</div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={create} className="card mb-5 p-4">
        <div className="mb-3 flex items-center gap-2 font-medium">
          <CalendarClock className="h-4 w-4 text-[#60a5fa]" />{t("tasks.newTask")}
        </div>
        <div className={`grid gap-3 md:grid-cols-2 ${canAssign ? "xl:grid-cols-6" : "xl:grid-cols-5"}`}>
          <select required value={form.contactId} onChange={(event) => setForm({ ...form, contactId: event.target.value })}>
            <option value="">{t("meetings.pickClient")}</option>
            {contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.firstName} {contact.lastName}</option>)}
          </select>
          {canAssign && (
            <select required value={form.managerId} onChange={(event) => setForm({ ...form, managerId: event.target.value })}>
              <option value="">{t("tasks.assignee")}</option>
              {managers.map((manager) => <option key={manager.id} value={manager.id}>{manager.name}</option>)}
            </select>
          )}
          <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
            {TASK_TYPES.map((type) => <option key={type} value={type}>{t(`taskTypes.${type}`)}</option>)}
          </select>
          <input required className="xl:col-span-2" placeholder={t("tasks.descriptionHint")} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <div className="flex gap-2">
            <input required type="datetime-local" value={form.dueAt} onChange={(event) => setForm({ ...form, dueAt: event.target.value })} />
            <button disabled={saving} className="min-w-28 rounded-xl bg-[#2563eb] px-4 font-medium disabled:opacity-60">{t("common.create")}</button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="muted">{t("tasks.quickDate")}:</span>
          <button type="button" className="chip" onClick={() => setQuickDue(0)}>{t("tasks.today")}</button>
          <button type="button" className="chip" onClick={() => setQuickDue(1)}>{t("tasks.tomorrow")}</button>
        </div>
      </form>

      {error && <div className="mb-4 rounded-xl border border-[#7f1d1d] bg-[#2b1720] px-4 py-3 text-sm text-[#fca5a5]">{error}</div>}

      <div className="mb-4 flex flex-wrap gap-3">
        <label className="relative min-w-64 flex-1">
          <Search className="muted absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("tasks.search")} />
        </label>
        {canAssign && (
          <select className="max-w-64" value={managerFilter} onChange={(event) => setManagerFilter(event.target.value)}>
            <option value="">{t("tasks.allManagers")}</option>
            {managers.map((manager) => <option key={manager.id} value={manager.id}>{manager.name}</option>)}
          </select>
        )}
      </div>

      <div className={`grid gap-5 ${selected ? "xl:grid-cols-[minmax(0,1fr)_380px]" : ""}`}>
        <div className="space-y-4">
          {loading && <div className="card muted p-8 text-center">{t("common.loading", "Загрузка…")}</div>}
          {!loading && groups.map((group) => (
            <section key={group.key} className={`rounded-2xl border ${group.tone}`}>
              <button
                type="button"
                onClick={() => toggleGroup(group.key)}
                aria-expanded={!collapsedGroups.has(group.key)}
                className={`flex w-full items-center justify-between px-4 py-3 text-left hover:bg-white/5 ${collapsedGroups.has(group.key) ? "" : "border-b border-white/10"}`}
              >
                <div className="flex items-center gap-2 font-medium">
                  {collapsedGroups.has(group.key) ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {group.key === "overdue" ? <AlertTriangle className="h-4 w-4 text-[#f87171]" /> : group.key === "done" ? <CheckCircle2 className="h-4 w-4 text-[#34d399]" /> : <Clock3 className="h-4 w-4 text-[#93a0bb]" />}
                  {t(`tasks.${group.key}`)}
                </div>
                <span className="chip">{group.items.length}</span>
              </button>
              {!collapsedGroups.has(group.key) && <div className="divide-y divide-white/10">
                {group.items.length === 0 && <div className="muted px-4 py-5 text-sm">{t("tasks.emptyGroup")}</div>}
                {group.items.map((task) => {
                  const isOverdue = task.status === "OPEN" && new Date(task.dueAt) < new Date();
                  return (
                    <div
                      role="button"
                      tabIndex={0}
                      key={task.id}
                      onClick={() => setSelectedId(task.id)}
                      onKeyDown={(event) => { if (event.key === "Enter") setSelectedId(task.id); }}
                      className={`grid w-full cursor-pointer gap-3 px-4 py-4 text-left transition hover:bg-white/5 md:grid-cols-[1fr_auto] ${selectedId === task.id ? "bg-white/5" : ""}`}
                    >
                      <div className="min-w-0">
                        <div className="mb-2 flex items-center gap-2">
                          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${isOverdue ? "bg-[#7f1d1d] text-[#fecaca]" : "bg-[#1e3a5f] text-[#93c5fd]"}`}><TaskIcon type={task.type} /></span>
                          <span className={task.status === "DONE" ? "text-[#9ca3af] line-through" : "font-medium"}>{task.description}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                          {task.contact ? (
                            <Link href={`/contacts/${task.contact.id}`} onClick={(event) => event.stopPropagation()} className="flex items-center gap-1 text-[#93c5fd] hover:underline">
                              <CircleUserRound className="h-3.5 w-3.5" />{task.contact.firstName} {task.contact.lastName}
                            </Link>
                          ) : <span className="muted">{t("tasks.noClient")}</span>}
                          <span className="muted flex items-center gap-1"><UserRound className="h-3.5 w-3.5" />{task.manager.name}</span>
                          {(task.contact?.tags || []).map(({ tag }) => <span key={tag.id} className="rounded-full px-2 py-0.5" style={{ color: tag.color, backgroundColor: `${tag.color}20`, border: `1px solid ${tag.color}55` }}>{tag.name}</span>)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 md:justify-end">
                        <div className={`text-right text-xs ${isOverdue ? "text-[#fca5a5]" : "muted"}`}><div>{formatDate(task.dueAt)}</div><div className="mt-1">{t(`taskTypes.${task.type}`)}</div></div>
                        {task.status === "OPEN" && (
                          <span role="button" tabIndex={0} title={t("tasks.markDone")} onClick={(event) => { event.stopPropagation(); updateTask(task.id, { status: "DONE" }); }} onKeyDown={(event) => { if (event.key === "Enter") updateTask(task.id, { status: "DONE" }); }} className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#334155] text-[#93a0bb] hover:border-[#34d399] hover:text-[#34d399]"><Check className="h-4 w-4" /></span>
                        )}
                        <ChevronRight className="muted h-4 w-4" />
                      </div>
                    </div>
                  );
                })}
              </div>}
            </section>
          ))}
        </div>

        {selected && (
          <aside className="card h-fit p-5 xl:sticky xl:top-5">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <div className={`mb-2 inline-flex rounded-full px-2.5 py-1 text-xs ${selected.status === "DONE" ? "bg-[#14532d] text-[#6ee7b7]" : new Date(selected.dueAt) < new Date() ? "bg-[#7f1d1d] text-[#fca5a5]" : "bg-[#1e3a5f] text-[#93c5fd]"}`}>
                  {selected.status === "DONE" ? t("tasks.done") : new Date(selected.dueAt) < new Date() ? t("tasks.overdue") : t("tasks.open")}
                </div>
                <h2 className="text-lg font-semibold">{selected.description}</h2>
                <div className="muted mt-1 flex items-center gap-1 text-xs"><TaskIcon type={selected.type} />{t(`taskTypes.${selected.type}`)}</div>
              </div>
              <button type="button" className="muted rounded-lg p-1 hover:bg-white/10" onClick={() => setSelectedId(null)} aria-label={t("common.close", "Закрыть")}><X className="h-5 w-5" /></button>
            </div>

            {selected.contact && (
              <Link href={`/contacts/${selected.contact.id}`} className="mb-5 block rounded-xl border border-[#243049] bg-[#0e1626] p-4 hover:border-[#3b82f6]">
                <div className="mb-1 flex items-center justify-between gap-2"><span className="font-medium text-[#93c5fd]">{selected.contact.firstName} {selected.contact.lastName}</span><ChevronRight className="h-4 w-4" /></div>
                <div className="muted text-xs">{selected.contact.phoneDisplay}</div>
                {selected.contact.pipelineStage?.name && <div className="mt-2 text-xs">{selected.contact.pipelineStage.name}</div>}
                <div className="mt-2 flex flex-wrap gap-1">{(selected.contact.tags || []).map(({ tag }) => <span key={tag.id} className="rounded-full px-2 py-0.5 text-xs" style={{ color: tag.color, backgroundColor: `${tag.color}20` }}>{tag.name}</span>)}</div>
              </Link>
            )}

            <dl className="mb-5 grid grid-cols-2 gap-x-3 gap-y-4 text-sm">
              <div><dt className="muted text-xs">{t("tasks.createdAt")}</dt><dd className="mt-1">{formatDate(selected.createdAt)}</dd></div>
              <div><dt className="muted text-xs">{t("tasks.dueAt")}</dt><dd className="mt-1">{formatDate(selected.dueAt)}</dd></div>
              <div><dt className="muted text-xs">{t("tasks.createdBy")}</dt><dd className="mt-1">{selected.creator?.name || t("common.dash", "—")}</dd></div>
              <div><dt className="muted text-xs">{t("tasks.assignee")}</dt><dd className="mt-1">{selected.manager.name}</dd></div>
            </dl>

            {selected.contact?.comment && (
              <div className="mb-5 rounded-xl border border-[#243049] p-3"><div className="muted mb-1 text-xs">{t("common.comment")}</div><p className="whitespace-pre-wrap text-sm">{selected.contact.comment}</p></div>
            )}

            {selected.status === "OPEN" && (
              <div className="space-y-3 border-t border-[#243049] pt-4">
                <div className="text-sm font-medium">{t("tasks.reschedule")}</div>
                <div className="flex gap-2"><input type="datetime-local" value={rescheduleAt} onChange={(event) => setRescheduleAt(event.target.value)} /><button type="button" disabled={saving} className="chip shrink-0 disabled:opacity-60" onClick={() => updateTask(selected.id, { dueAt: new Date(rescheduleAt).toISOString() })}>{t("common.save")}</button></div>
                <button type="button" disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#166534] px-4 py-2.5 text-sm font-medium disabled:opacity-60" onClick={() => updateTask(selected.id, { status: "DONE" })}><CheckCircle2 className="h-4 w-4" />{t("tasks.markDone")}</button>
              </div>
            )}
          </aside>
        )}
      </div>
    </AppShell>
  );
}
