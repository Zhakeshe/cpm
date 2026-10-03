"use client";
import { useState } from "react";
import { Download, Play, RotateCcw } from "lucide-react";
import { useI18n } from "./I18nProvider";

export function RecordingPlayer({ callId, canDownload = false }: { callId: string; canDownload?: boolean }) {
  const { t } = useI18n();
  const [opened, setOpened] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const url = `/api/calls/${encodeURIComponent(callId)}/recording`;
  return <div className="space-y-2 min-w-48">
    {!opened || failed ? <button className="chip flex items-center gap-2" onClick={() => {
      setFailed(false); setOpened(true); setAttempt((value) => value + 1);
    }}>{failed ? <RotateCcw size={14} /> : <Play size={14} />}{t(failed ? "calls.retryRecording" : "calls.listen")}</button>
      : <audio key={attempt} controls autoPlay preload="none" src={url} onError={() => setFailed(true)} className="h-9 w-full min-w-48 max-w-64" />}
    {failed && <p className="text-xs text-amber-300">{t("calls.recordingUnavailable")}</p>}
    {canDownload && opened && !failed && <a className="text-xs muted inline-flex items-center gap-1" href={`${url}?download=1`}><Download size={12} />{t("calls.download")}</a>}
  </div>;
}
