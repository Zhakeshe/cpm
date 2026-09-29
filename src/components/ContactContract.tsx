"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/I18nProvider";

export const CONTRACT_PRICES = [850000, 682000, 582000];
export const CONTRACT_GIFTS = [
  { id: "iron", key: "contract.iron" },
  { id: "steam", key: "contract.steam" },
  { id: "booster", key: "contract.booster" },
] as const;

function formatPrice(n: number) {
  return `${n.toLocaleString("ru-RU").replace(/\s/g, ".")} ₸`;
}

type Draft = {
  done: boolean | null;
  price: number | null;
  dealer: string;
  gifts: string[];
};

function fromFields(custom: Record<string, unknown>, dealAmount: string | number): Draft {
  const gifts = Array.isArray(custom.gifts) ? (custom.gifts as string[]) : [];
  const priceRaw = custom.contractPrice ?? dealAmount;
  const price = Number(priceRaw);
  return {
    done: typeof custom.contractDone === "boolean" ? custom.contractDone : null,
    price: CONTRACT_PRICES.includes(price) ? price : null,
    dealer: String(custom.dealer || ""),
    gifts,
  };
}

export function ContactContract({
  contactId,
  clientName,
  managerName,
  customFields,
  dealAmount,
  onChange,
}: {
  contactId: string;
  clientName: string;
  managerName: string;
  customFields: Record<string, unknown>;
  dealAmount: string | number;
  onChange: () => void;
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState<Draft>(() => fromFields(customFields, dealAmount));
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setDraft(fromFields(customFields, dealAmount));
  }, [customFields, dealAmount]);

  function toggleGift(id: string) {
    setDraft((prev) => ({
      ...prev,
      gifts: prev.gifts.includes(id) ? prev.gifts.filter((g) => g !== id) : [...prev.gifts, id],
    }));
  }

  async function save() {
    setBusy(true);
    setNotice("");
    const res = await fetch("/api/contacts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: contactId,
        dealAmount: draft.price ?? 0,
        customFields: {
          ...customFields,
          contractDone: draft.done,
          contractPrice: draft.price,
          dealer: draft.dealer,
          gifts: draft.gifts,
        },
      }),
    });
    setBusy(false);
    if (!res.ok) return;
    setNotice(t("contract.saved"));
    onChange();
  }

  return (
    <div className="card p-5 space-y-3">
      <div className="font-medium">{t("contract.title")}</div>
      <label className="text-sm block">
        {t("contract.client")}
        <input className="mt-1" value={clientName} readOnly />
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          className={`chip ${draft.done === true ? "bg-[#16a34a]" : ""}`}
          onClick={() => setDraft({ ...draft, done: true })}
        >
          {t("contract.conducted")}
        </button>
        <button
          type="button"
          className={`chip ${draft.done === false ? "bg-[#64748b]" : ""}`}
          onClick={() => setDraft({ ...draft, done: false })}
        >
          {t("contract.notConducted")}
        </button>
      </div>
      <div>
        <div className="text-sm mb-1">{t("contract.price")}</div>
        <div className="flex flex-col gap-1">
          {CONTRACT_PRICES.map((p) => (
            <button
              key={p}
              type="button"
              className={`chip text-left ${draft.price === p ? "bg-[#1d4ed8]" : ""}`}
              onClick={() => setDraft({ ...draft, price: p })}
            >
              {formatPrice(p)}
            </button>
          ))}
        </div>
      </div>
      <label className="text-sm block">
        {t("contract.dealer")}
        <input className="mt-1" value={draft.dealer} onChange={(e) => setDraft({ ...draft, dealer: e.target.value })} />
      </label>
      <label className="text-sm block">
        {t("contract.manager")}
        <input className="mt-1" value={managerName || t("common.dash")} readOnly />
      </label>
      <div>
        <div className="text-sm mb-1">{t("contract.gift")}</div>
        <div className="flex flex-wrap gap-2">
          {CONTRACT_GIFTS.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`chip ${draft.gifts.includes(g.id) ? "bg-[#1d4ed8]" : ""}`}
              onClick={() => toggleGift(g.id)}
            >
              {t(g.key)}
            </button>
          ))}
        </div>
      </div>
      <button type="button" className="rounded-xl bg-[#2563eb] px-3 py-2 text-sm w-full" disabled={busy} onClick={save}>
        {t("common.save")}
      </button>
      {notice && <div className="text-sm text-[#34d399]">{notice}</div>}
    </div>
  );
}
