"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";

type Field = { key: string; name: string; fieldType: string; options: string[] };
type Tag = { id: string; name: string; color: string };
type Product = { id: string; name: string; price: string | number };
type Company = { id: string; name: string };

export function ContactSales({
  contactId,
  customFields,
  tags,
  companyId,
  onChange,
}: {
  contactId: string;
  customFields: Record<string, unknown>;
  tags: Array<{ tag: Tag }>;
  companyId?: string | null;
  onChange: () => void;
}) {
  const { t } = useI18n();
  const [fields, setFields] = useState<Field[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [values, setValues] = useState(customFields);
  const [items, setItems] = useState<Array<{ productId?: string; title: string; qty: number; unitPrice: number }>>([]);
  const [pay, setPay] = useState({ amount: "", method: "CASH" });
  const [mergeId, setMergeId] = useState("");
  const [dupes, setDupes] = useState<Array<{ id: string; firstName: string; phoneDisplay: string }>>([]);

  useEffect(() => {
    setValues(customFields);
  }, [customFields]);

  useEffect(() => {
    fetch("/api/custom-fields").then((r) => r.json()).then(setFields);
    fetch("/api/tags").then((r) => r.json()).then(setAllTags);
    fetch("/api/products").then((r) => r.json()).then(setProducts);
    fetch("/api/companies").then((r) => r.json()).then(setCompanies);
    fetch("/api/contacts").then((r) => r.json()).then((rows) => setDupes(rows.filter((x: { id: string }) => x.id !== contactId).slice(0, 40)));
  }, [contactId]);

  async function saveFields() {
    await fetch("/api/contacts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: contactId, customFields: values, companyId }),
    });
    onChange();
  }

  return (
    <div className="space-y-4">
      <div className="card p-5 space-y-2">
        <div className="font-medium">{t("contact.tags")}</div>
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => {
            const on = tags.some((x) => x.tag.id === tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                className="chip"
                style={{ background: on ? tag.color : undefined }}
                onClick={() =>
                  fetch("/api/tags", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contactId, tagId: tag.id, remove: on }),
                  }).then(onChange)
                }
              >
                {tag.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card p-5 space-y-2">
        <div className="font-medium">{t("contact.company")}</div>
        <select
          value={companyId || ""}
          onChange={(e) =>
            fetch("/api/contacts", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: contactId, companyId: e.target.value }),
            }).then(onChange)
          }
        >
          <option value="">{t("common.dash")}</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="card p-5 space-y-2">
        <div className="font-medium">{t("contact.custom")}</div>
        {fields.map((f) => (
          <label key={f.key} className="text-sm block">
            {f.name}
            {f.fieldType === "select" ? (
              <select className="mt-1" value={String(values[f.key] || "")} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}>
                <option value="">{t("common.dash")}</option>
                {(f.options || []).map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <input className="mt-1" value={String(values[f.key] || "")} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
            )}
          </label>
        ))}
        <button type="button" className="rounded-xl bg-[#2563eb] px-3 py-2 text-sm" onClick={saveFields}>
          {t("common.save")}
        </button>
      </div>

      <div className="card p-5 space-y-2">
        <div className="font-medium">{t("quotes.new")}</div>
        {items.map((item, idx) => (
          <div key={idx} className="grid grid-cols-3 gap-2">
            <input value={item.title} onChange={(e) => setItems(items.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)))} />
            <input type="number" value={item.qty} onChange={(e) => setItems(items.map((x, i) => (i === idx ? { ...x, qty: Number(e.target.value) } : x)))} />
            <input type="number" value={item.unitPrice} onChange={(e) => setItems(items.map((x, i) => (i === idx ? { ...x, unitPrice: Number(e.target.value) } : x)))} />
          </div>
        ))}
        <select
          onChange={(e) => {
            const p = products.find((x) => x.id === e.target.value);
            if (!p) return;
            setItems([...items, { productId: p.id, title: p.name, qty: 1, unitPrice: Number(p.price) }]);
          }}
        >
          <option value="">{t("quotes.addProduct")}</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {Number(p.price)}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="rounded-xl bg-[#2563eb] px-3 py-2 text-sm"
          onClick={async () => {
            if (!items.length) return;
            await fetch("/api/quotes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ contactId, items }),
            });
            setItems([]);
            onChange();
          }}
        >
          {t("quotes.create")}
        </button>
        <Link href="/quotes" className="text-sm text-[#93c5fd] block">
          {t("nav.quotes")}
        </Link>
      </div>

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
