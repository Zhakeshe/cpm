import Image from "next/image";
import { EVENT } from "@/lib/constants";

export function Hero() {
  return (
    <section className="relative isolate min-h-[620px] overflow-hidden bg-navy-deep text-white sm:min-h-[700px] lg:min-h-[780px]">
      <Image
        src="/hero-field.jpg"
        alt="Роботы FTC на игровом поле во время матча"
        fill
        priority
        className="object-cover object-[68%_center] saturate-[1.05]"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-navy-deep via-navy-deep/88 to-navy/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-transparent to-navy-deep/35" />
      <div className="absolute inset-y-0 left-0 w-1 bg-gold" />

      <div className="relative mx-auto flex min-h-[620px] max-w-6xl flex-col justify-end px-4 pb-0 pt-28 sm:min-h-[700px] sm:px-6 lg:min-h-[780px]">
        <div className="max-w-xl pb-12 sm:pb-16">
          <p className="text-[12px] font-semibold tracking-[0.28em] text-gold-soft uppercase">
            {EVENT.dateLabel} · {EVENT.timeLabel} · Astana
          </p>
          <h1 className="mt-5 text-[3.4rem] font-semibold leading-[0.86] tracking-[-0.055em] sm:text-7xl lg:text-[5.4rem]">
            K.E.R.N
            <span className="mt-2 block font-normal italic text-gold-soft">Scrimmage</span>
          </h1>
          <div className="mt-6 h-px w-24 bg-gold" />
          <p className="mt-6 max-w-md text-[17px] leading-8 text-white/82">
            Тренировочные FTC-матчи на площадке школы. Autonomous, TeleOp, поле —
            без отбора и без лишней церемонии.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="#register"
              className="rounded-full bg-gold px-7 py-3.5 text-sm font-semibold text-navy-deep shadow-[0_12px_32px_rgba(0,0,0,0.28)] transition hover:bg-gold-soft"
            >
              Зарегистрировать команду
            </a>
            <a
              href="#venue"
              className="rounded-full border border-white/30 bg-white/8 px-7 py-3.5 text-sm text-white backdrop-blur-md transition hover:bg-white/16"
            >
              Адрес и карта
            </a>
          </div>
        </div>

        <div className="grid grid-cols-3 border-t border-white/15 bg-navy-deep/55 backdrop-blur-md">
          {[
            ["Дата", EVENT.dateLabel],
            ["Начало", EVENT.timeLabel],
            ["Состав", "4–5 человек"],
          ].map(([label, value]) => (
            <div key={label} className="border-r border-white/10 px-3 py-4 last:border-r-0 sm:px-6 sm:py-5">
              <p className="text-[10px] font-medium tracking-[0.18em] text-gold-soft uppercase">{label}</p>
              <p className="mt-1 text-sm font-medium text-white sm:text-[15px]">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
