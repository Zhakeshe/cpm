import { Countdown } from "@/components/countdown";
import { withBase } from "@/lib/utils";

export function Hero() {
  return (
    <section className="relative isolate min-h-[620px] overflow-hidden bg-navy-deep text-white sm:min-h-[700px] lg:min-h-[780px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={withBase("/hero-field.jpg")}
        alt="Роботы FTC на игровом поле во время матча"
        className="absolute inset-0 h-full w-full object-cover object-[68%_center] saturate-[1.05]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-navy-deep via-navy-deep/88 to-navy/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-transparent to-navy-deep/35" />
      <div className="absolute inset-y-0 left-0 w-1 bg-gold" />

      <div className="relative mx-auto flex min-h-[620px] max-w-6xl flex-col justify-end px-4 pb-14 pt-28 sm:min-h-[700px] sm:px-6 sm:pb-20 lg:min-h-[780px]">
        <p className="text-[12px] font-semibold tracking-[0.28em] text-gold-soft uppercase">
          K.E.R.N School · Astana
        </p>
        <h1 className="mt-5 max-w-xl text-[3.4rem] font-semibold leading-[0.86] tracking-[-0.055em] sm:text-7xl lg:text-[5.4rem]">
          K.E.R.N
          <span className="mt-2 block font-normal italic text-gold-soft">Scrimmage</span>
        </h1>
        <div className="mt-6 h-px w-24 bg-gold" />
        <p className="mt-6 max-w-md text-[17px] leading-8 text-white/82">
          Тренировочные FTC-матчи на площадке школы. Autonomous, TeleOp, поле —
          без отбора и без лишней церемонии.
        </p>
        <div className="mt-10">
          <Countdown />
        </div>
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
    </section>
  );
}
