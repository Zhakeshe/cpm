"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/I18nProvider";

type Channel = { channelId: string; name?: string; transport?: string; state?: string };

export function WazzupSection() {
  const { t } = useI18n();
  const [info, setInfo] = useState<{
    configured: boolean;
    hasApiKey: boolean;
    channelId: string;
    status: string;
    lastError?: string | null;
    channels: Channel[];
  } | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [channelId, setChannelId] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/wazzup");
    if (!res.ok) return;
    const data = await res.json();
    setInfo(data);
    setChannelId(data.channelId || "");
  }

  useEffect(() => {
    load();
  }, []);

  async function save(subscribe: boolean) {
    setBusy(true);
    setNotice("");
    setError("");
    const res = await fetch("/api/wazzup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: apiKey || undefined, channelId, subscribe }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(t("settings.wazzupFailed"));
      return;
    }
    setApiKey("");
    setNotice(subscribe ? t("settings.wazzupSubscribed") : t("settings.wazzupSaved"));
    await load();
    return data;
  }

  return (
    <div className="card p-5 mb-6 space-y-3">
      <div className="font-medium">{t("settings.wazzupTitle")}</div>
      <div className="muted text-sm">{t("settings.wazzupHint")}</div>
      <div className="text-sm">
        {t("settings.wazzupStatus")}: {info?.status || t("common.dash")}
        {info?.hasApiKey ? ` · ${t("settings.wazzupKeySet")}` : ""}
      </div>
      <input
        type="password"
        placeholder={t("settings.wazzupKey")}
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
      />
      <input placeholder={t("settings.wazzupChannel")} value={channelId} onChange={(e) => setChannelId(e.target.value)} />
      {(info?.channels || []).length > 0 && (
        <select value={channelId} onChange={(e) => setChannelId(e.target.value)}>
          <option value="">{t("settings.wazzupPickChannel")}</option>
          {info?.channels.map((ch) => (
            <option key={ch.channelId} value={ch.channelId}>
              {(ch.name || ch.channelId) + (ch.transport ? ` · ${ch.transport}` : "") + (ch.state ? ` · ${ch.state}` : "")}
            </option>
          ))}
        </select>
      )}
      <div className="flex gap-2">
        <button className="rounded-xl bg-[#2563eb] px-4 py-2" type="button" disabled={busy} onClick={() => save(false)}>
          {t("common.save")}
        </button>
        <button className="chip" type="button" disabled={busy} onClick={() => save(true)}>
          {t("settings.wazzupConnect")}
        </button>
      </div>
      {notice && <div className="text-sm text-[#34d399]">{notice}</div>}
      {error && <div className="text-sm text-[#f87171]">{error}</div>}
      {info?.lastError && <div className="text-sm text-[#f87171]">{info.lastError}</div>}
    </div>
  );
}
