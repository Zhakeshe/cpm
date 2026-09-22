import { EVENT } from "@/lib/constants";

export function About() {
  return (
    <section id="about" className="bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-end">
          <h2 className="max-w-sm text-3xl font-semibold leading-tight tracking-[-0.03em] text-navy sm:text-4xl">
            Тренировка перед сезоном,
            <span className="mt-1 block italic text-gold">не турнир FIRST</span>
          </h2>
          <p className="max-w-xl text-[17px] leading-8 text-ink/75">
            {EVENT.dateLabel}, начало в {EVENT.timeLabel}. K.E.R.N Scrimmage —
            практические матчи для школьных FTC-команд: выезд на поле, прогон робота,
            разбор. Qualifier это не заменяет, зато можно спокойно найти, где ломается
            программа и механика.
          </p>
        </div>
      </div>
    </section>
  );
}
