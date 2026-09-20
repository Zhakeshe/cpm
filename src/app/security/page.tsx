"use client";

import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/components/I18nProvider";
import { useEffect, useState } from "react";

export default function SecurityPage() {
  const { t } = useI18n();
  const [enabled, setEnabled] = useState(false);
  const [secret, setSecret] = useState("");
  const [url, setUrl] = useState("");
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    fetch("/api/auth/totp").then((r) => r.json()).then((d) => setEnabled(Boolean(d.enabled)));
  }, []);
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-6">{t("security.title")}</h1>
      <div className="card p-5 max-w-xl space-y-3">
        <div>{enabled ? t("security.on") : t("security.off")}</div>
        <button
          className="rounded-xl bg-[#2563eb] px-4 py-2"
          type="button"
          onClick={async () => {
            const res = await fetch("/api/auth/totp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "start" }) });
            const data = await res.json();
            setSecret(data.secret || "");
            setUrl(data.url || "");
          }}
        >
          {t("security.start")}
        </button>
        {secret && (
          <div className="text-sm space-y-2">
            <div className="muted break-all">{secret}</div>
            <div className="muted break-all text-xs">{url}</div>
            <input placeholder="000000" value={code} onChange={(e) => setCode(e.target.value)} />
            <button
              type="button"
              className="rounded-xl bg-[#16a34a] px-4 py-2"
              onClick={async () => {
                const res = await fetch("/api/auth/totp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "confirm", code }) });
                setNotice(res.ok ? t("security.enabled") : t("security.badCode"));
                if (res.ok) setEnabled(true);
              }}
            >
              {t("security.confirm")}
            </button>
          </div>
        )}
        {enabled && (
          <button
            type="button"
            className="chip"
            onClick={async () => {
              const res = await fetch("/api/auth/totp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "disable", code }) });
              if (res.ok) setEnabled(false);
            }}
          >
            {t("security.disable")}
          </button>
        )}
        {notice && <div className="text-sm text-[#34d399]">{notice}</div>}
      </div>
    </AppShell>
  );
}
