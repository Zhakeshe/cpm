"use client";

import { useState } from "react";
import { useI18n } from "@/components/I18nProvider";

export function ExportButton({ href }: { href: string }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      const res = await fetch(href);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const disposition = res.headers.get("content-disposition") || "";
      const match = disposition.match(/filename="([^"]+)"/);
      a.href = url;
      a.download = match?.[1] || "export.csv";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="chip" disabled={busy} onClick={download}>
      {busy ? t("common.loading") : t("common.export")}
    </button>
  );
}
