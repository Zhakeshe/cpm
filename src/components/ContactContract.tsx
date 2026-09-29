"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/I18nProvider";

export const CONTRACT_PRICES = [850000, 687000, 582000];
export const CONTRACT_GIFTS = [
  { id: "iron", key: "contract.iron" },
  { id: "steam", key: "contract.steam" },
  { id: "stain", key: "contract.stain" },
] as const;

function formatPrice(n: number) {
  return `${n.toLocaleString("ru-RU").replace(/\s/g, ".")} ₸`;
}

type Draft = {
  bought: boolean | null;
  price: number | null;
  gifts: string[];
  dealer: string;
};

export function chosenDealAmount(price: number | null) {
  return price && CONTRACT_PRICES.includes(price) ? price : 0;
}

function fromFields(custom: Record<string, unknown>, dealAmount: string | number): Draft {
  const rawPrices = custom.priceNeeds && typeof custom.priceNeeds === "object" ? (custom.priceNeeds as Record<string, unknown>) : {};
  const fromNeeds = CONTRACT_PRICES.find((p) => rawPrices[String(p)] === "need");
  const listed = Number(custom.contractPrice ?? dealAmount);
  const price = fromNeeds ?? (CONTRACT_PRICES.includes(listed) ? listed : null);

  const rawGifts = custom.giftNeeds && typeof custom.giftNeeds === "object" ? (custom.giftNeeds as Record<string, unknown>) : {};
  const oldList = Array.isArray(custom.gifts) ? (custom.gifts as string[]) : [];
  const gifts = CONTRACT_GIFTS.map((g) => g.id).filter((id) => {
    const legacy = id === "stain" ? "booster" : id;
    return rawGifts[id] === "need" || rawGifts[legacy] === "need" || oldList.includes(id) || oldList.includes(legacy);
  });

  const bought = typeof custom.bought === "boolean" ? custom.bought : typeof custom.contractDone === "boolean" ? custom.contractDone : null;

  return { bought, price, gifts, dealer: String(custom.dealer || "") };
}

function Tick({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <input type="checkbox" checked={checked} onChange={onChange} />
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
    const price = chosenDealAmount(draft.price);
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
          gifts: draft.gifts,
          priceNeeds: Object.fromEntries(CONTRACT_PRICES.map((p) => [String(p), p === draft.price ? "need" : null])),
          giftNeeds: Object.fromEntries(CONTRACT_GIFTS.map((g) => [g.id, draft.gifts.includes(g.id) ? "need" : null])),
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

      <div className="space-y-2">
        <label className="flex items-center justify-between gap-2 text-sm">
          <span>{t("contract.acquired")}</span>
          <Tick
            checked={draft.bought === true}
            onChange={() => setDraft({ ...draft, bought: draft.bought === true ? null : true })}
          />
        </label>
        <label className="flex items-center justify-between gap-2 text-sm">
          <span>{t("contract.notAcquired")}</span>
          <Tick
            checked={draft.bought === false}
            onChange={() => setDraft({ ...draft, bought: draft.bought === false ? null : false })}
          />
        </label>
      </div>

      <div className="space-y-2">
        <div className="text-sm">{t("contract.price")}</div>
        {CONTRACT_PRICES.map((p) => (
          <label key={p} className="flex items-center justify-between gap-2 border-t border-[#243049] pt-2 text-sm">
            <span>{formatPrice(p)}</span>
            <Tick
              checked={draft.price === p}
              onChange={() => setDraft({ ...draft, price: draft.price === p ? null : p })}
            />
          </label>
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
          <label key={g.id} className="flex items-center justify-between gap-2 border-t border-[#243049] pt-2 text-sm">
            <span>{t(g.key)}</span>
            <Tick
              checked={draft.gifts.includes(g.id)}
              onChange={() =>
                setDraft({
                  ...draft,
                  gifts: draft.gifts.includes(g.id) ? draft.gifts.filter((id) => id !== g.id) : [...draft.gifts, g.id],
                })
              }
            />
          </label>
        ))}
      </div>

      <button type="button" className="rounded-xl bg-[#2563eb] px-3 py-2 text-sm w-full" disabled={busy} onClick={save}>
        {t("common.save")}
      </button>
      {notice && <div className="text-sm text-[#34d399]">{notice}</div>}
    </div>
  );
}
