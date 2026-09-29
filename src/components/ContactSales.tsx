"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { ContactContract } from "@/components/ContactContract";
import { ContactTaskForm } from "@/components/ContactTaskForm";

export function ContactSales({
  contactId,
  clientName,
  phone,
  address,
  managerId,
  managerName,
  customFields,
  dealAmount,
  tasks,
  onChange,
}: {
  contactId: string;
  clientName: string;
  phone: string;
  address: string;
  managerId?: string | null;
  managerName: string;
  customFields: Record<string, unknown>;
  dealAmount: string | number;
  tasks: Array<{ id: string; description: string; dueAt: string; status: string; type: string }>;
  onChange: () => void;
}) {
  const { t } = useI18n();
  const [mergeId, setMergeId] = useState("");
  const [dupes, setDupes] = useState<Array<{ id: string; firstName: string; phoneDisplay: string }>>([]);
  const [pay, setPay] = useState({ amount: "", method: "CASH" });

  useEffect(() => {
    fetch("/api/contacts")
      .then((r) => r.json())
      .then((rows) => setDupes(Array.isArray(rows) ? rows.filter((x: { id: string }) => x.id !== contactId).slice(0, 40) : []));
  }, [contactId]);

  return (
    <div className="space-y-4">
      <ContactContract
        contactId={contactId}
        clientName={clientName}
        managerName={managerName}
        customFields={customFields}
        dealAmount={dealAmount}
        onChange={onChange}
      />
      <ContactTaskForm
        contactId={contactId}
        clientName={clientName}
        phone={phone}
        address={address}
        managerId={managerId}
        tasks={tasks}
        onChange={onChange}
      />

      <div className="card p-5 space-y-2">
        <div className="font-medium">{t("payments.title")}</div>
        <div className="grid grid-cols-3 gap-2">
          <input placeholder={t("common.amount")} value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} />
          <select value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>
            <option value="CASH">{t("payments.CASH")}</option>
            <option value="CARD">{t("payments.CARD")}</option>
            <option value="TRANSFER">{t("payments.TRANSFER")}</option>
            <option value="INSTALLMENT">{t("payments.INSTALLMENT")}</option>
          </select>
          <button
            type="button"
            className="rounded-xl bg-[#2563eb] px-3 py-2 text-sm"
            onClick={async () => {
              if (!pay.amount) return;
              await fetch("/api/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contactId, amount: Number(pay.amount), method: pay.method }),
              });
              setPay({ amount: "", method: "CASH" });
              onChange();
            }}
          >
            {t("common.add")}
          </button>
        </div>
      </div>

      <div className="card p-5 space-y-2">
        <div className="font-medium">{t("contact.files")}</div>
        <input
          type="file"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const body = new FormData();
            body.append("file", file);
            await fetch(`/api/contacts/${contactId}/files`, { method: "POST", body });
            e.target.value = "";
            onChange();
          }}
        />
      </div>

      <div className="card p-5 space-y-2">
        <div className="font-medium">{t("contact.merge")}</div>
        <select value={mergeId} onChange={(e) => setMergeId(e.target.value)}>
          <option value="">{t("contact.pickDuplicate")}</option>
          {dupes.map((d) => (
            <option key={d.id} value={d.id}>
              {d.firstName} · {d.phoneDisplay}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="rounded-xl bg-[#7c3aed] px-3 py-2 text-sm"
          onClick={async () => {
            if (!mergeId) return;
            await fetch("/api/contacts/merge", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ primaryId: contactId, secondaryId: mergeId }),
            });
            setMergeId("");
            onChange();
          }}
        >
          {t("contact.mergeNow")}
        </button>
      </div>
    </div>
  );
}
