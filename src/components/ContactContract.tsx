"use client";

import { useI18n } from "@/components/I18nProvider";
import { FileSignature } from "lucide-react";
import { useEffect, useState } from "react";

const PRICES = [850000, 687000, 582000];
const GIFTS = ["iron", "steam", "humidifier"];

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
  managerName?: string;
  customFields: Record<string, unknown>;
  dealAmount: string | number;
  onChange: () => void;
}) {
  const { t } = useI18n();
  const [purchase, setPurchase] = useState("");
  const [price, setPrice] = useState("");
  const [gift, setGift] = useState("");
  const [dealer, setDealer] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPurchase(String(customFields.contractPurchaseStatus || ""));
    setPrice(String(customFields.contractPrice || (PRICES.includes(Number(dealAmount)) ? dealAmount : "")));
    setGift(String(customFields.contractGift || ""));
    setDealer(String(customFields.contractDealer || ""));
  }, [customFields, dealAmount]);

  async function save() {
    setSaved(false);
    const nextFields = {
      ...customFields,
      contractPurchaseStatus: purchase,
      contractPrice: price ? Number(price) : null,
      contractGift: gift,
      contractDealer: dealer,
    };
    const response = await fetch("/api/contacts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: contactId, customFields: nextFields, dealAmount: price ? Number(price) : undefined }),
    });
    setSaved(response.ok);
    if (response.ok) onChange();
  }

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center gap-2 font-medium"><FileSignature className="h-4 w-4 text-[#a78bfa]" />{t("contact.contract")}</div>
      <div className="mb-4 grid gap-2 text-sm">
        <div><span className="muted">{t("common.client")}:</span> {clientName}</div>
        <div><span className="muted">{t("common.manager")}:</span> {managerName || t("common.dash")}</div>
      </div>

      <fieldset className="mb-4">
        <legend className="muted mb-2 text-xs">{t("contact.purchaseResult")}</legend>
        <div className="grid grid-cols-2 gap-2">
          {["purchased", "notPurchased"].map((value) => (
            <label key={value} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm ${purchase === value ? "border-[#3b82f6] bg-[#1e3a5f]" : "border-[#243049]"}`}>
              <input className="w-auto" type="radio" name="purchase" value={value} checked={purchase === value} onChange={(event) => setPurchase(event.target.value)} />
              {t(`contact.${value}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mb-4">
        <legend className="muted mb-2 text-xs">{t("contact.contractPrice")}</legend>
        <div className="grid gap-2">
          {PRICES.map((value) => (
            <label key={value} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm ${price === String(value) ? "border-[#3b82f6] bg-[#1e3a5f]" : "border-[#243049]"}`}>
              <input className="w-auto" type="radio" name="contractPrice" value={value} checked={price === String(value)} onChange={(event) => setPrice(event.target.value)} />
              {value.toLocaleString("ru-KZ")} ₸
            </label>
          ))}
        </div>
      </fieldset>

      <label className="mb-4 block text-sm">{t("contact.dealer")}<input className="mt-1" value={dealer} onChange={(event) => setDealer(event.target.value)} /></label>

      <fieldset className="mb-4">
        <legend className="muted mb-2 text-xs">{t("contact.gift")}</legend>
        <div className="grid gap-2">
          {GIFTS.map((value) => (
            <label key={value} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2 text-sm ${gift === value ? "border-[#10b981] bg-[#123329]" : "border-[#243049]"}`}>
              <input className="w-auto" type="radio" name="contractGift" value={value} checked={gift === value} onChange={(event) => setGift(event.target.value)} />
              {t(`contact.gifts.${value}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <button type="button" className="w-full rounded-xl bg-[#2563eb] px-3 py-2 text-sm" onClick={save}>{t("common.save")}</button>
      {saved && <div className="mt-2 text-xs text-[#34d399]">{t("contact.saved")}</div>}
    </div>
  );
}
