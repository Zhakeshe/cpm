"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const items = [
  {
    q: "Это официальный турнир FIRST?",
    a: "Нет. Это scrimmage школы K.E.R.N. Дата qualifier и статус FIRST event, если он появится, придут отдельно.",
  },
  {
    q: "Что такое BIOBUZZ?",
    a: "Игра сезона FTC 2026–2027: POLLEN, NECTAR, HIVE и FLOWERS. На scrimmage как раз можно отладить робота под это поле.",
  },
  {
    q: "Сколько человек в команде?",
    a: "4 или 5. Больше в заявке не принимаем.",
  },
  {
    q: "Робот обязан быть полностью готов?",
    a: "Желательно ехать с тем, что уже едет. Точные техтребования пришлём зарегистрированным командам.",
  },
  {
    q: "Где площадка?",
    a: "K.E.R.N School, Жошы хан көшесі, 10Б, Астана. Карта — в блоке адреса и в 2GIS.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold text-navy">Вопросы</h2>
        <div className="mt-6 divide-y divide-navy/10 border-y border-navy/10">
          {items.map((item, index) => {
            const expanded = open === index;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 py-4 text-left"
                  aria-expanded={expanded}
                  onClick={() => setOpen(expanded ? null : index)}
                >
                  <span className="text-sm font-medium text-navy sm:text-base">{item.q}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-navy/50 transition ${expanded ? "rotate-180" : ""}`}
                  />
                </button>
                {expanded ? (
                  <p className="pb-4 text-sm leading-7 text-muted">{item.a}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
