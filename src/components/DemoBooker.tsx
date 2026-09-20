"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/I18nProvider";

type Props = {
  contactId?: string;
  onDone?: () => void;
};

function toLocalInput(value: string) {
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function DemoBooker({ contactId, onDone }: Props) {
  const { t } = useI18n();
  const timeOpts: Intl.DateTimeFormatOptions = { timeZone: "Asia/Almaty" };
  const [slots, setSlots] = useState<string[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [format, setFormat] = useState("ONLINE");
  const [comment, setComment] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function loadSlots() {
    const data = await fetch("/api/meetings/slots?days=7").then((r) => r.json());
    setSlots(Array.isArray(data.slots) ? data.slots : []);
    setNext(data.next || null);
    if (data.next && !manual) setManual(toLocalInput(data.next));
  }

  useEffect(() => {
    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function book(body: Record<string, unknown>) {
    setNotice("");
    setError("");
    const res = await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, contactId, format, comment }),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(
        payload.error === "SLOT_TAKEN"
          ? t("meetings.slotTaken")
          : payload.error === "SLOT_UNAVAILABLE"
            ? t("meetings.slotUnavailable")
            : t("quickActions.demoFailed"),
      );
      return;
    }
    setNotice(t("quickActions.demoCreated"));
    setComment("");
    await loadSlots();
    onDone?.();
  }

  return (
    <div className="space-y-2">
      <div className="text-xs muted">{t("meetings.autoHint")}</div>
      {next && (
        <button type="button" className="rounded-xl bg-[#2563eb] px-3 py-2 text-sm w-full" onClick={() => book({ auto: true })}>
          {t("meetings.autoBook", { time: new Date(next).toLocaleString("ru-RU", { ...timeOpts, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) })}
        </button>
      )}
      <div className="flex flex-wrap gap-2">
        {slots.slice(0, 12).map((iso) => (
          <button key={iso} type="button" className="chip" onClick={() => book({ startsAt: iso })}>
            {new Date(iso).toLocaleString("ru-RU", { ...timeOpts, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </button>
        ))}
        {slots.length === 0 && <div className="muted text-xs">{t("meetings.noSlots")}</div>}
      </div>
      <div className="text-xs muted">{t("meetings.manualHint")}</div>
      <input type="datetime-local" value={manual} onChange={(e) => setManual(e.target.value)} />
      <select value={format} onChange={(e) => setFormat(e.target.value)}>
        {["ONLINE", "OFFLINE", "PHONE"].map((f) => (
          <option key={f} value={f}>
            {t(`meetingFormats.${f}`)}
          </option>
        ))}
      </select>
      <input placeholder={t("quickActions.comment")} value={comment} onChange={(e) => setComment(e.target.value)} />
      <button
        type="button"
        className="rounded-xl bg-[#1d4ed8] px-3 py-2 text-sm w-full"
        onClick={() => book({ startsAt: new Date(manual).toISOString() })}
      >
        {t("meetings.manualBook")}
      </button>
      {notice && <div className="text-xs text-[#34d399]">{notice}</div>}
      {error && <div className="text-xs text-[#f87171]">{error}</div>}
    </div>
  );
}
