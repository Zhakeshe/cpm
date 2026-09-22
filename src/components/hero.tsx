import Image from "next/image";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy text-white">
      <div className="absolute inset-y-0 right-0 hidden w-[46%] lg:block">
        <Image
          src="/ftc-robot.jpg"
          alt="Робот FIRST Tech Challenge"
          fill
          className="object-cover"
          sizes="46vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/20 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
        <p className="text-[13px] font-medium text-gold-soft">K.E.R.N School · Астана</p>
        <h1 className="mt-4 max-w-xl text-5xl font-semibold leading-[0.95] tracking-[-0.04em] sm:text-7xl">
          K.E.R.N
          <span className="mt-1 block font-normal italic text-gold-soft">Scrimmage</span>
        </h1>
        <p className="mt-7 max-w-md text-[17px] leading-8 text-white/80">
          Тренировочные FTC-матчи на площадке школы. Autonomous, TeleOp, поле —
          без отбора и без лишней церемонии.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
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
        <p className="mt-10 text-sm text-white/55">4–5 человек · FIRST Tech Challenge · BIOBUZZ 2026–27</p>
      </div>

      <div className="relative lg:hidden">
        <Image
          src="/ftc-robot.jpg"
          alt="Робот FIRST Tech Challenge"
          width={1200}
          height={800}
          className="h-56 w-full object-cover sm:h-72"
          priority
        />
      </div>
    </section>
  );
}
