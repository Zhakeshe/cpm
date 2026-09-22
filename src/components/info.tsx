import { TBA } from "@/lib/constants";

const rows = [
  { label: "Формат", value: "FTC Scrimmage" },
  { label: "Город", value: "Астана" },
  { label: "Организатор", value: "K.E.R.N School" },
  { label: "Размер команды", value: "4–5 участников" },
  { label: "Количество команд", value: TBA },
  { label: "Дата", value: TBA },
  { label: "Время", value: TBA },
  { label: "Место", value: "K.E.R.N School / адрес будет опубликован позже" },
];

export function Info() {
  return (
    <section className="bg-navy text-white">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">
          Важно знать
        </p>
        <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Важная информация</h2>
        <dl className="mt-10 divide-y divide-white/10 border-y border-white/10">
          {rows.map((row) => (
            <div
              key={row.label}
              className="grid gap-2 py-4 sm:grid-cols-[220px_1fr] sm:items-baseline"
            >
              <dt className="text-sm text-mist">{row.label}</dt>
              <dd className="text-base font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
