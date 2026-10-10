"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Phone } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";

const STORAGE_KEY = "crm-zadarma-open";

/** Keeps the isolated Zadarma phone alive while allowing the panel to collapse. */
export function Softphone() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(window.localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  function toggle() {
    setOpen((current) => {
      const next = !current;
      window.localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2">
      <div
        className={`overflow-hidden rounded-2xl border border-[#33415f] bg-[#0b1220] shadow-2xl ${
          open ? "visible pointer-events-auto" : "invisible pointer-events-none absolute"
        }`}
        style={{ height: "min(560px, calc(100vh - 90px))", width: "min(390px, calc(100vw - 24px))" }}
        aria-hidden={!open}
      >
        <div className="flex h-12 items-center justify-between border-b border-[#243049] px-4">
          <div className="flex items-center gap-2 text-sm font-medium"><Phone size={15} /> Zadarma WebRTC</div>
          <button type="button" className="chip" onClick={toggle} aria-label={t("softphone.collapse")}>
            <ChevronDown size={15} /> {t("softphone.collapse")}
          </button>
        </div>
        <iframe
          title="Zadarma WebRTC"
          src="/sip-phone"
          allow="microphone; autoplay"
          className="w-full border-0"
          style={{ height: "calc(100% - 48px)" }}
        />
      </div>
      {!open && (
        <button
          type="button"
          className="flex items-center gap-2 rounded-full bg-[#16a34a] px-4 py-3 text-sm font-medium text-white shadow-xl"
          onClick={toggle}
        >
          <Phone size={17} /> {t("softphone.open")} <ChevronUp size={15} />
        </button>
      )}
    </div>
  );
}
