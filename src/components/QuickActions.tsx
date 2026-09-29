"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, FileText, MessageSquare, PhoneCall } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { DemoBooker } from "@/components/DemoBooker";

type Props = {
  contactId: string;
  onDone?: () => void;
  compact?: boolean;
};

type Product = { id: string; name: string; price: string | number };

/**
 * КП, демо and callback stay on the card and in the inbox so the manager
 * never leaves the client to take the next sales step.
 */
export function QuickActions({ contactId, onDone, compact }: Props) {
  const { t } = useI18n();
  const [panel, setPanel] = useState<"quote" | "demo" | "callback" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => (r.ok ? r.json() : []))
      .then(setProducts);
  }, []);

  function toggle(id: string) {
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function createQuote() {
    setError("");
    setMessage("");
    const items = products
      .filter((p) => picked.includes(p.id))
      .map((p) => ({ productId: p.id, title: p.name, qty: 1, unitPrice: Number(p.price) }));
    if (!items.length) {
      setError(t("quickActions.pickProduct"));
      return;
    }
    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId, items }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(t("quickActions.quoteFailed"));
      return;
    }
    const text = `${data.number || "КП"}: ${items.map((i) => i.title).join(", ")} — ${Number(data.total || 0).toLocaleString("ru-KZ")} ₸`;
    await fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId, text }),
    }).catch(() => undefined);
    setMessage(t("quickActions.quoteCreated", { number: data.number || "" }));
    setPanel(null);
    setPicked([]);
    onDone?.();
  }

  async function callback(preset: "today" | "tomorrow" | "in3days") {
    setError("");
    setMessage("");
    const res = await fetch("/api/follow-ups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId, preset, description: t("quickActions.callbackTask") }),
    });
    if (!res.ok) {
      setError(t("quickActions.callbackFailed"));
      return;
    }
    setMessage(t("quickActions.callbackCreated"));
    setPanel(null);
    onDone?.();
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {!compact && (
          <button className="chip" type="button" onClick={() => setPanel(panel === "quote" ? null : "quote")}>
            <FileText size={14} /> {t("quickActions.quote")}
          </button>
        )}
        <button className="chip" type="button" onClick={() => setPanel(panel === "demo" ? null : "demo")}>
          <CalendarPlus size={14} /> {t("quickActions.demo")}
        </button>
        <button className="chip" type="button" onClick={() => setPanel(panel === "callback" ? null : "callback")}>
          <PhoneCall size={14} /> {t("quickActions.callback")}
        </button>
        {compact && (
          <a className="chip" href={`/messages?contact=${contactId}`}>
            <MessageSquare size={14} /> {t("quickActions.whatsapp")}
          </a>
        )}
        {!compact && (
          <a className="chip" href={`/contacts/${contactId}`}>
            {t("quickActions.card")}
          </a>
        )}
      </div>

      {message && <div className="text-xs text-[#34d399]">{message}</div>}
      {error && <div className="text-xs text-[#f87171]">{error}</div>}

      {panel === "quote" && !compact && (
        <div className="card p-3 space-y-2">
          <div className="text-xs muted">{t("quickActions.quoteHint")}</div>
          <div className="flex flex-wrap gap-2">
            {products.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`chip ${picked.includes(p.id) ? "bg-[#1d4ed8]" : ""}`}
                onClick={() => toggle(p.id)}
              >
                {p.name} · {Number(p.price).toLocaleString("ru-KZ")}
              </button>
            ))}
            {products.length === 0 && <div className="muted text-xs">{t("quickActions.noProducts")}</div>}
          </div>
          <button className="rounded-xl bg-[#2563eb] px-3 py-2 text-sm w-full" type="button" onClick={createQuote}>
            {t("quickActions.sendQuote")}
          </button>
        </div>
      )}

      {panel === "demo" && (
        <div className="card p-3">
          <DemoBooker
            contactId={contactId}
            onDone={() => {
              setPanel(null);
              setMessage(t("quickActions.demoCreated"));
              onDone?.();
            }}
          />
        </div>
      )}

      {panel === "callback" && (
        <div className="card p-3 space-y-2">
          <div className="text-xs muted">{t("quickActions.callbackHint")}</div>
          <div className="flex flex-wrap gap-2">
            <button className="chip" type="button" onClick={() => callback("today")}>
              {t("followUps.today")}
            </button>
            <button className="rounded-xl bg-[#2563eb] px-3 py-2 text-sm" type="button" onClick={() => callback("tomorrow")}>
              {t("followUps.tomorrow")}
            </button>
            <button className="chip" type="button" onClick={() => callback("in3days")}>
              {t("followUps.in3days")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
