"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/I18nProvider";

export const CONTRACT_PRICES = [850000, 687000, 582000];
export const CONTRACT_GIFTS = [
  { id: "iron", key: "contract.iron" },
  { id: "steam", key: "contract.steam" },
  { id: "stain", key: "contract.stain" },
] as const;

export type NeedMark = "need" | "skip" | null;

function formatPrice(n: number) {
  return `${n.toLocaleString("ru-RU").replace(/\s/g, ".")} ₸`;
}

function priceKey(n: number) {
  return String(n);
}

function asNeed(v: unknown): NeedMark {
  return v === "need" || v === "skip" ? v : null;
}

type Draft = {
  bought: boolean | null;
  prices: Record<string, NeedMark>;
  gifts: Record<string, NeedMark>;
  dealer: string;
};

function fromFields(custom: Record<string, unknown>, dealAmount: string | number): Draft {
  const prices: Record<string, NeedMark> = {};
  const rawPrices = custom.priceNeeds && typeof custom.priceNeeds === "object" ? (custom.priceNeeds as Record<string, unknown>) : {};
  for (const p of CONTRACT_PRICES) {
    prices[priceKey(p)] = asNeed(rawPrices[priceKey(p)]);
  }
  const listed = Number(custom.contractPrice ?? dealAmount);
  if (CONTRACT_PRICES.includes(listed) && prices[priceKey(listed)] == null) {
    prices[priceKey(listed)] = "need";
  }

  const gifts: Record<string, NeedMark> = {};
  const rawGifts = custom.giftNeeds && typeof custom.giftNeeds === "object" ? (custom.giftNeeds as Record<string, unknown>) : {};
  const oldList = Array.isArray(custom.gifts) ? (custom.gifts as string[]) : [];
  for (const g of CONTRACT_GIFTS) {
    const legacyId = g.id === "stain" ? "booster" : g.id;
    gifts[g.id] = asNeed(rawGifts[g.id]) ?? asNeed(rawGifts[legacyId]) ?? (oldList.includes(g.id) || oldList.includes(legacyId) ? "need" : null);
  }

  const bought = typeof custom.bought === "boolean" ? custom.bought : typeof custom.contractDone === "boolean" ? custom.contractDone : null;

  return {
    bought,
    prices,
    gifts,
    dealer: String(custom.dealer || ""),
  };
}

export function chosenDealAmount(prices: Record<string, NeedMark>) {
  const needed = CONTRACT_PRICES.filter((p) => prices[priceKey(p)] === "need");
  return needed[0] ?? 0;
}

function NeedChecks({
  value,
  onChange,
  needLabel,
  skipLabel,
}: {
  value: NeedMark;
  onChange: (next: NeedMark) => void;
  needLabel: string;
  skipLabel: string;
}) {
  return (
    <div className="flex items-center gap-3 shrink-0 text-xs">
      <label className="flex items-center gap-1.5 whitespace-nowrap">
        <input
          type="checkbox"
          checked={value === "need"}
          onChange={() => onChange(value === "need" ? null : "need")}
        />
        {needLabel}
      </label>
      <label className="flex items-center gap-1.5 whitespace-nowrap">
        <input
          type="checkbox"
          checked={value === "skip"}
          onChange={() => onChange(value === "skip" ? null : "skip")}
        />
        {skipLabel}
      </label>
    </div>
  );
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

  async function save() {
    setBusy(true);
    setNotice("");
    const price = chosenDealAmount(draft.prices);
    const giftList = CONTRACT_GIFTS.filter((g) => draft.gifts[g.id] === "need").map((g) => g.id);
    const res = await fetch("/api/contacts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: contactId,
        dealAmount: price,
        customFields: {
          ...customFields,
          bought: draft.bought,
          contractDone: draft.bought,
          contractPrice: price || null,
          dealer: draft.dealer,
          gifts: giftList,
          priceNeeds: draft.prices,
          giftNeeds: draft.gifts,
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
      <p className="text-xs muted">{t("contract.talkHint")}</p>
      <label className="text-sm block">
        {t("contract.client")}
        <input className="mt-1" value={clientName} readOnly />
      </label>

      <div className="space-y-2">
        <label className="flex items-center justify-between gap-2 text-sm">
          <span>{t("contract.acquired")}</span>
          <input
            type="checkbox"
            checked={draft.bought === true}
            onChange={() => setDraft({ ...draft, bought: draft.bought === true ? null : true })}
          />
        </label>
        <label className="flex items-center justify-between gap-2 text-sm">
          <span>{t("contract.notAcquired")}</span>
          <input
            type="checkbox"
            checked={draft.bought === false}
            onChange={() => setDraft({ ...draft, bought: draft.bought === false ? null : false })}
          />
        </label>
      </div>

      <div className="space-y-2">
        <div className="text-sm">{t("contract.price")}</div>
        {CONTRACT_PRICES.map((p) => (
          <div key={p} className="flex items-center justify-between gap-2 border-t border-[#243049] pt-2">
            <span className="text-sm">{formatPrice(p)}</span>
            <NeedChecks
              value={draft.prices[priceKey(p)] ?? null}
              needLabel={t("contract.need")}
              skipLabel={t("contract.notNeed")}
              onChange={(next) => setDraft({ ...draft, prices: { ...draft.prices, [priceKey(p)]: next } })}
            />
          </div>
        ))}
      </div>

      <label className="text-sm block">
        {t("contract.dealer")}
        <input className="mt-1" value={draft.dealer} onChange={(e) => setDraft({ ...draft, dealer: e.target.value })} />
      </label>
      <label className="text-sm block">
        {t("contract.manager")}
        <input className="mt-1" value={managerName || t("common.dash")} readOnly />
      </label>

      <div className="space-y-2">
        <div className="text-sm">{t("contract.gift")}</div>
        {CONTRACT_GIFTS.map((g) => (
          <div key={g.id} className="flex items-center justify-between gap-2 border-t border-[#243049] pt-2">
            <span className="text-sm">{t(g.key)}</span>
            <NeedChecks
              value={draft.gifts[g.id] ?? null}
              needLabel={t("contract.need")}
              skipLabel={t("contract.notNeed")}
              onChange={(next) => setDraft({ ...draft, gifts: { ...draft.gifts, [g.id]: next } })}
            />
          </div>
        ))}
      </div>

      <button type="button" className="rounded-xl bg-[#2563eb] px-3 py-2 text-sm w-full" disabled={busy} onClick={save}>
        {t("common.save")}
      </button>
      {notice && <div className="text-sm text-[#34d399]">{notice}</div>}
    </div>
  );
}
