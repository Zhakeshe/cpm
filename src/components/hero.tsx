export function Hero() {
  return (
    <section className="bg-navy text-white">
      <div className="mx-auto grid max-w-6xl items-end gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-[13px] font-medium text-gold-soft">K.E.R.N School · Астана</p>
          <h1 className="mt-5 text-5xl font-semibold leading-[0.92] tracking-[-0.04em] sm:text-7xl">
            K.E.R.N
            <span className="mt-2 block font-normal italic text-gold-soft">Scrimmage</span>
          </h1>
          <p className="mt-8 max-w-lg text-[17px] leading-8 text-white/80">
            Тренировочные FTC-матчи на площадке школы. Autonomous, TeleOp, поле —
            без отбора и без лишней церемонии.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="#register"
              className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-navy-deep transition hover:bg-gold-soft"
            >
              Зарегистрировать команду
            </a>
            <a
              href="#venue"
              className="rounded-full border border-white/25 px-6 py-3 text-sm text-white transition hover:border-white"
            >
              Адрес и карта
            </a>
          </div>
        </div>
        <ul className="space-y-5 border-l border-gold/40 pb-2 pl-6 text-sm leading-6 text-white/70">
          <li>
            <span className="block text-gold-soft">Команда</span>
            4–5 участников
          </li>
          <li>
            <span className="block text-gold-soft">Сезон</span>
            BIOBUZZ 2026–2027
          </li>
          <li>
            <span className="block text-gold-soft">Формат</span>
            Практика, не квалификация FIRST
          </li>
        </ul>
      </div>
    </section>
  );
}
