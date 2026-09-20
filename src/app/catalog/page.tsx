"use client";

import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/components/I18nProvider";
import { useEffect, useState } from "react";

type Product = { id: string; sku: string; name: string; price: string | number; stock: number; category: string; isActive: boolean };

export default function CatalogPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Product[]>([]);
  const [draft, setDraft] = useState({ sku: "", name: "", price: "", stock: "0", category: "vacuum" });
  const load = () => fetch("/api/products").then((r) => r.json()).then(setRows);
  useEffect(() => {
    load();
  }, []);
  return (
    <AppShell>
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-semibold">{t("catalog.title")}</h1>
        <button className="chip" type="button" onClick={() => fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ seed: true }) }).then(load)}>
          {t("catalog.seed")}
        </button>
      </div>
      <form
        className="card p-4 mb-6 grid md:grid-cols-5 gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...draft, price: Number(draft.price), stock: Number(draft.stock) }),
          });
          setDraft({ sku: "", name: "", price: "", stock: "0", category: "vacuum" });
          load();
        }}
      >
        <input required placeholder="SKU" value={draft.sku} onChange={(e) => setDraft({ ...draft, sku: e.target.value })} />
        <input required placeholder={t("common.name")} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <input required placeholder={t("common.amount")} value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
        <input placeholder="stock" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: e.target.value })} />
        <button className="rounded-xl bg-[#2563eb]">{t("common.add")}</button>
      </form>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#182235] text-[#93a0bb]">
            <tr>
              <th className="text-left p-3">SKU</th>
              <th className="text-left p-3">{t("common.name")}</th>
              <th className="text-left p-3">{t("common.amount")}</th>
              <th className="text-left p-3">{t("catalog.stock")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-[#243049]">
                <td className="p-3">{p.sku}</td>
                <td className="p-3">{p.name}</td>
                <td className="p-3">{Number(p.price)} ₸</td>
                <td className="p-3">{p.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
