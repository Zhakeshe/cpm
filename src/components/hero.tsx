import Image from "next/image";
import { MapPin, Swords, Users, Cpu } from "lucide-react";

const facts = [
  { icon: Cpu, label: "FIRST Tech Challenge" },
  { icon: MapPin, label: "Астана" },
  { icon: Users, label: "4–5 участников" },
  { icon: Swords, label: "Практические матчи" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy text-white">
      <div className="pointer-events-none absolute inset-0 blueprint-grid opacity-40" />
      <div className="pointer-events-none absolute -right-24 top-10 hidden h-[520px] w-[520px] rounded-full border border-white/10 lg:block" />
      <div className="pointer-events-none absolute right-24 top-32 hidden h-[280px] w-[280px] rounded-full border border-gold/25 lg:block" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold-soft">
            K.E.R.N SCHOOL · ASTANA
          </p>
          <h1 className="mt-5 font-semibold leading-[0.92] tracking-tight">
            <span className="block text-5xl sm:text-6xl md:text-7xl">K.E.R.N</span>
            <span className="mt-2 block text-3xl text-gold-soft sm:text-4xl md:text-5xl">
              FTC Scrimmage
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-mist sm:text-lg">
            Практический FTC Scrimmage для школьных команд в Астане.
            Участники смогут протестировать робота в формате реальных матчей,
            проверить Autonomous и TeleOp, получить соревновательный опыт
            и подготовиться к официальным турнирам FIRST Tech Challenge.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#register"
              className="inline-flex items-center justify-center rounded-sm bg-gold px-5 py-3 text-sm font-semibold text-navy-deep transition hover:bg-gold-soft"
            >
              Зарегистрировать команду
            </a>
            <a
              href="#format"
              className="inline-flex items-center justify-center rounded-sm border border-white/25 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/60"
            >
              Подробнее о формате
            </a>
          </div>
          <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {facts.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="border border-white/10 bg-white/5 px-3 py-3"
              >
                <Icon size={16} className="text-gold-soft" />
                <p className="mt-2 text-xs leading-5 text-mist">{label}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="absolute -inset-3 border border-gold/20" />
          <div className="relative overflow-hidden border border-white/10 bg-navy-deep">
            <Image
              src="/ftc-robot.jpg"
              alt="Демонстрационный робот FIRST Tech Challenge"
              width={800}
              height={600}
              className="h-full w-full object-cover opacity-90"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/70 via-transparent to-transparent" />
            <p className="absolute bottom-4 left-4 right-4 text-xs tracking-wide text-mist">
              FIRST Tech Challenge · практические матчи
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
