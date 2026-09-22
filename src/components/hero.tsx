import Image from "next/image";

export function Hero() {
  return (
    <section className="bg-navy text-white">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16">
        <p className="text-sm text-gold-soft">K.E.R.N School, Астана</p>
        <div className="mt-6 grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div>
            <h1 className="max-w-xl text-[2.7rem] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-6xl">
              K.E.R.N
              <span className="block font-normal italic text-gold-soft">Scrimmage</span>
            </h1>
            <p className="mt-6 max-w-lg text-[17px] leading-8 text-mist">
              Тренировочные матчи FTC на площадке школы. Команды прогоняют Autonomous
              и TeleOp до официальных турниров сезона, без лишней церемонии —
              поле, матчи, разбор.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#register"
                className="bg-white px-5 py-3 text-sm font-semibold text-navy hover:bg-gold-soft"
              >
                Зарегистрировать команду
              </a>
              <a
                href="#biobuzz"
                className="border border-white/25 px-5 py-3 text-sm text-white hover:border-white"
              >
                Сезон BIOBUZZ
              </a>
            </div>
            <p className="mt-8 text-sm text-mist/80">
              4–5 человек в команде · FIRST Tech Challenge · практика, не квалификация
            </p>
          </div>
          <figure className="relative">
            <Image
              src="/ftc-robot.jpg"
              alt="Робот FIRST Tech Challenge на поле"
              width={840}
              height={630}
              className="h-[280px] w-full object-cover sm:h-[360px]"
              priority
            />
            <figcaption className="mt-3 text-xs leading-5 text-mist/80">
              FTC-робот. На scrimmage важнее стабильность, чем зрелищность.
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
