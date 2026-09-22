"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const items = [
  {
    q: "Что такое Scrimmage?",
    a: "Это тренировочное FTC-мероприятие с матчами, где команды могут протестировать роботов до официальных соревнований.",
  },
  {
    q: "Сколько человек может быть в команде?",
    a: "Для данного Scrimmage команда должна состоять из 4–5 участников.",
  },
  {
    q: "Нужно ли иметь полностью готового робота?",
    a: "Желательно, но окончательные технические требования будут сообщены зарегистрированным командам.",
  },
  {
    q: "Можно ли участвовать начинающим командам?",
    a: "Да. Scrimmage предназначен как для начинающих, так и для более опытных FTC-команд.",
  },
  {
    q: "Когда будет дата?",
    a: "Дата, время и окончательный формат будут отправлены зарегистрированным командам.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-paper">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">FAQ</p>
        <h2 className="mt-3 text-3xl font-semibold text-navy">Частые вопросы</h2>
        <div className="mt-8 divide-y divide-mist border-y border-mist bg-white">
          {items.map((item, index) => {
            const expanded = open === index;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={expanded}
                  onClick={() => setOpen(expanded ? null : index)}
                >
                  <span className="text-sm font-semibold text-navy sm:text-base">
                    {item.q}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-gold transition ${expanded ? "rotate-180" : ""}`}
                  />
                </button>
                {expanded ? (
                  <p className="px-5 pb-5 text-sm leading-7 text-muted">{item.a}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
