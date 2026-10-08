"use client";

import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";

type WebrtcConfig =
  | { enabled: false; reason: string }
  | { enabled: true; key: string; sip: string };

type ZadarmaWidget = (
  key: string,
  sip: string,
  shape: "square" | "rounded",
  language: string,
  incoming: boolean,
  position: { right: string; bottom: string },
) => void;

declare global {
  interface Window {
    zadarmaWidgetFn?: ZadarmaWidget;
  }
}

const WIDGET_SCRIPTS = [
  "https://my.zadarma.com/webphoneWebRTCWidget/v9/js/loader-phone-lib.js?sub_v=1",
  "https://my.zadarma.com/webphoneWebRTCWidget/v9/js/loader-phone-fn.js?sub_v=1",
];

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing?.dataset.loaded === "true") return resolve();
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("ZADARMA_WIDGET_LOAD_FAILED")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error("ZADARMA_WIDGET_LOAD_FAILED"));
    document.head.appendChild(script);
  });
}

/** Official Zadarma WebRTC widget authenticated with a short-lived server key. */
export function Softphone() {
  const { t } = useI18n();
  const [state, setState] = useState<"loading" | "ready" | "disabled" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const response = await fetch("/api/sip/webrtc-key", { cache: "no-store" });
      if (!response.ok) throw new Error("ZADARMA_WEBRTC_KEY_FAILED");
      const config = (await response.json()) as WebrtcConfig;
      if (cancelled) return;
      if (!config.enabled) {
        setState("disabled");
        return;
      }
      for (const src of WIDGET_SCRIPTS) await loadScript(src);
      if (cancelled) return;
      if (!window.zadarmaWidgetFn) throw new Error("ZADARMA_WIDGET_NOT_AVAILABLE");
      window.zadarmaWidgetFn(config.key, config.sip, "square", "ru", true, {
        right: "10px",
        bottom: "5px",
      });
      setState("ready");
    }

    boot().catch((error) => {
      console.error("Zadarma WebRTC widget failed", error);
      if (!cancelled) setState("error");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "ready" || state === "disabled") return null;
  return (
    <div className="fixed bottom-4 right-4 z-40 card px-4 py-3 w-64">
      <div className="flex items-center gap-2 text-sm">
        <Phone size={14} />
        <span className="muted">
          {state === "loading" ? t("softphone.registering") : t("softphone.error")}
        </span>
      </div>
    </div>
  );
}
