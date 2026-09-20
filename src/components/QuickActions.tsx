"use client";

import { useState } from "react";
import { CalendarPlus, ListPlus, MessageSquare, Phone } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { DemoBooker } from "@/components/DemoBooker";

type Props = {
  contactId: string;
  onDone?: () => void;
  compact?: boolean;
};

const TASK_TYPES = ["CALL", "WHATSAPP", "DEMO", "MEETING", "SEND_PROPOSAL", "FOLLOW_UP", "OTHER"];
function defaultDateTime(hoursAhead: number) {
  const d = new Date(Date.now() + hoursAhead * 3600 * 1000);
  d.setMinutes(0, 0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

/**
 * Task and demo creation live next to the conversation and the contact card so a
 * manager never has to leave the client to schedule the next step.
 */
export function QuickActions({ contactId, onDone, compact }: Props) {
  const { t } = useI18n();
  const [panel, setPanel] = useState<"task" | "meeting" | null>(null);
  const [message, setMessage] = useState("");
  const [task, setTask] = useState({ type: "CALL", description: "", dueAt: defaultDateTime(24), reminder: true });

  async function createTask() {
    if (!task.description.trim()) {
      setMessage(t("quickActions.describeTask"));
      return;
    }
    const reminderAt = task.reminder
      ? new Date(new Date(task.dueAt).getTime() - 10 * 60 * 1000).toISOString()
      : undefined;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactId,
        type: task.type,
        description: task.description,
        dueAt: new Date(task.dueAt).toISOString(),
        reminderAt,
      }),
    });
    setMessage(res.ok ? t("quickActions.taskCreated") : t("quickActions.taskFailed"));
    if (res.ok) {
      setPanel(null);
      setTask({ ...task, description: "" });
      onDone?.();
    }
  }

  async function call() {
    const res = await fetch("/api/calls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId }),
    });
    setMessage(res.ok ? t("quickActions.calling") : t("quickActions.callFailed"));
    onDone?.();
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <a className="chip" href={`/messages?contact=${contactId}`}>
          <MessageSquare size={14} /> {t("quickActions.whatsapp")}
        </a>
        <button className="chip" onClick={call}>
          <Phone size={14} /> {t("quickActions.call")}
        </button>
        <button className="chip" onClick={() => setPanel(panel === "task" ? null : "task")}>
          <ListPlus size={14} /> {t("quickActions.task")}
        </button>
        <button className="chip" onClick={() => setPanel(panel === "meeting" ? null : "meeting")}>
          <CalendarPlus size={14} /> {t("quickActions.demo")}
        </button>
        {!compact && (
          <a className="chip" href={`/contacts/${contactId}`}>
            {t("quickActions.card")}
          </a>
        )}
      </div>

      {message && <div className="text-xs text-[#34d399]">{message}</div>}

      {panel === "task" && (
        <div className="card p-3 space-y-2">
          <select value={task.type} onChange={(e) => setTask({ ...task, type: e.target.value })}>
            {TASK_TYPES.map((value) => (
              <option key={value} value={value}>
                {t(`taskTypes.${value}`)}
              </option>
            ))}
          </select>
          <input
            placeholder={t("quickActions.what")}
            value={task.description}
            onChange={(e) => setTask({ ...task, description: e.target.value })}
          />
          <input type="datetime-local" value={task.dueAt} onChange={(e) => setTask({ ...task, dueAt: e.target.value })} />
          <label className="text-xs flex items-center gap-2">
            <input
              type="checkbox"
              className="w-auto"
              checked={task.reminder}
              onChange={(e) => setTask({ ...task, reminder: e.target.checked })}
            />
            {t("quickActions.remind")}
          </label>
          <button className="rounded-xl bg-[#2563eb] px-3 py-2 text-sm w-full" onClick={createTask}>
            {t("quickActions.createTask")}
          </button>
        </div>
      )}

      {panel === "meeting" && (
        <div className="card p-3">
          <DemoBooker
            contactId={contactId}
            onDone={() => {
              setPanel(null);
              onDone?.();
            }}
          />
        </div>
      )}
    </div>
  );
}
