"use client";

import { useEffect, useState } from "react";
import { useI18n } from "./I18nProvider";

export function WhatsAppGreetingSection() {
  const { locale } = useI18n();
  const kk = locale === "kk";
  const [config, setConfig] = useState<{ enabled: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/whatsapp/greeting").then(async (res) => {
      if (!res.ok) throw new Error();
      setConfig(await res.json());
    }).catch(() => setError(kk ? "Баптауды жүктеу мүмкін болмады." : "Не удалось загрузить настройки."));
  }, [kk]);

  async function save() {
    if (!config || busy) return;
    setBusy(true); setNotice(""); setError("");
    try {
      const res = await fetch("/api/whatsapp/greeting", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "INSTAGRAM_LINK_REQUIRED") {
          setError(kk ? "Instagram орнына нақты сілтемені қойыңыз немесе сол абзацты алып тастаңыз." : "Укажите настоящую ссылку Instagram или уберите этот абзац.");
          return;
        }
        throw new Error();
      }
      setConfig(data);
      setNotice(kk ? "Сақталды." : "Сохранено.");
    } catch {
      setError(kk ? "Сақтау мүмкін болмады. Қайта көріңіз." : "Не удалось сохранить. Повторите попытку.");
    } finally { setBusy(false); }
  }

  return <section className="card p-5 mb-6 space-y-3">
    <h2 className="font-medium">{kk ? "WhatsApp автоматты сәлемдесуі" : "Автоприветствие WhatsApp"}</h2>
    <p className="muted text-sm">{kk
      ? "Қосылғаннан кейін WhatsApp-қа алғаш жазған клиентке бір рет жіберіледі. Таргеттен және тікелей келгендерге де жұмыс істейді. Бұрынғы диалогтарға жіберілмейді. «Тоқтату» автоматты сәлемдесуді бұғаттайды."
      : "Одно сообщение клиенту при его первом обращении в WhatsApp после включения — из рекламы или напрямую. В старые диалоги не отправляется. «Тоқтату» блокирует автоприветствие."}</p>
    {config && <>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="w-auto" checked={config.enabled} disabled={busy} onChange={(e) => { setConfig({ ...config, enabled: e.target.checked }); setNotice(""); }} />
        {kk ? "Автоматты жіберуді қосу" : "Включить автоматическую отправку"}
      </label>
      <textarea aria-label={kk ? "Сәлемдесу мәтіні" : "Текст приветствия"} rows={14} maxLength={4000} value={config.text} disabled={busy} onChange={(e) => { setConfig({ ...config, text: e.target.value }); setNotice(""); }} />
      <button type="button" disabled={busy || !config.text.trim()} className="rounded-xl bg-[#2563eb] px-4 py-2 disabled:opacity-50" onClick={save}>
        {busy ? (kk ? "Сақталуда…" : "Сохранение…") : (kk ? "Сақтау" : "Сохранить")}
      </button>
    </>}
    {notice && <p className="text-sm text-[#34d399]" role="status">{notice}</p>}
    {error && <p className="text-sm text-[#f87171]" role="alert">{error}</p>}
  </section>;
}
