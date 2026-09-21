"use client";

import { useI18n } from "@/components/I18nProvider";
import { useEffect, useState } from "react";

type Channel = {
  slug: string;
  source: string;
  title: string;
  greeting: string;
  waPrefill: string;
  isActive: boolean;
  clicks: number;
  converted: number;
  url: string;
};

export function TrackingLinksSection() {
  const { t } = useI18n();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [publicNumber, setPublicNumber] = useState("");
  const [copied, setCopied] = useState("");
  const [draft, setDraft] = useState({ slug: "", title: "", source: "INSTAGRAM" });

  async function load() {
    const res = await fetch("/api/tracking");
    if (!res.ok) return;
    const data = await res.json();
    setChannels(data.channels || []);
    setPublicNumber(data.publicNumber || "");
  }

  useEffect(() => {
    load();
  }, []);

  async function copy(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(""), 1500);
  }

  async function save(ch: Channel) {
    await fetch("/api/tracking", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: ch.slug,
        title: ch.title,
        greeting: ch.greeting,
        waPrefill: ch.waPrefill,
        isActive: ch.isActive,
      }),
    });
    load();
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    setDraft({ slug: "", title: "", source: "INSTAGRAM" });
    load();
  }

  return (
    <div className="card p-5 mb-6 space-y-4">
      <div className="font-medium">{t("settings.trackingTitle")}</div>
      <div className="muted text-sm">{t("settings.trackingHint")}</div>
      {!publicNumber && <div className="text-sm text-[#fbbf24]">{t("settings.trackingNoNumber")}</div>}
      {channels.map((ch) => (
        <ChannelRow key={ch.slug} channel={ch} copied={copied === ch.url} onCopy={copy} onSave={save} t={t} />
      ))}
      <form onSubmit={add} className="grid md:grid-cols-4 gap-2 pt-2 border-t border-[#243049]">
        <input
          required
          placeholder={t("settings.trackingNewSlug")}
          value={draft.slug}
          onChange={(e) => setDraft({ ...draft, slug: e.target.value.toLowerCase() })}
        />
        <input
          required
          placeholder={t("settings.trackingNewTitle")}
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        />
        <select value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value })}>
          <option value="INSTAGRAM">Instagram</option>
          <option value="TIKTOK">TikTok</option>
          <option value="FACEBOOK">Facebook</option>
          <option value="YOUTUBE">YouTube</option>
          <option value="WEBSITE">Сайт</option>
          <option value="OTHER">Басқа</option>
        </select>
        <button className="rounded-xl bg-[#2563eb]">{t("settings.trackingAdd")}</button>
      </form>
    </div>
  );
}

function ChannelRow({
  channel,
  copied,
  onCopy,
  onSave,
  t,
}: {
  channel: Channel;
  copied: boolean;
  onCopy: (url: string) => void;
  onSave: (ch: Channel) => void;
  t: (path: string) => string;
}) {
  const [edit, setEdit] = useState(channel);
  useEffect(() => {
    setEdit(channel);
  }, [channel]);

  return (
    <div className="border-t border-[#243049] pt-3 space-y-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <div className="font-medium">{channel.title}</div>
        <code className="text-xs break-all">{channel.url}</code>
        <button type="button" className="chip" onClick={() => onCopy(channel.url)}>
          {copied ? t("settings.trackingCopied") : t("settings.trackingCopy")}
        </button>
        <span className="muted text-xs">
          {t("settings.trackingClicks")}: {channel.clicks} · {t("settings.trackingConverted")}: {channel.converted}
        </span>
        <label className="text-xs flex items-center gap-1 ml-auto">
          <input
            type="checkbox"
            className="w-auto"
            checked={edit.isActive}
            onChange={(e) => setEdit({ ...edit, isActive: e.target.checked })}
          />
          {t("settings.active")}
        </label>
      </div>
      <textarea
        rows={2}
        value={edit.greeting}
        onChange={(e) => setEdit({ ...edit, greeting: e.target.value })}
        placeholder={t("settings.trackingGreeting")}
      />
      <input
        value={edit.waPrefill}
        onChange={(e) => setEdit({ ...edit, waPrefill: e.target.value })}
        placeholder={t("settings.trackingPrefill")}
      />
      <button type="button" className="rounded-xl bg-[#2563eb] px-3 py-2 text-sm" onClick={() => onSave(edit)}>
        {t("settings.trackingSave")}
      </button>
    </div>
  );
}
