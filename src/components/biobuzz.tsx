import Image from "next/image";

const PIECES = [
  {
    name: "POLLEN",
    text: "Жёлтые, лёгкие. Их больше на тайлах — основа цикла.",
  },
  {
    name: "NECTAR",
    text: "Крупнее и тяжелее: HIVE опрокидывается быстрее.",
  },
  {
    name: "HIVE",
    text: "Улей альянса. В конце матча — элементы в FLOWERS.",
  },
] as const;

export function Biobuzz() {
  return (
    <section id="biobuzz" className="relative overflow-hidden bg-buzz-dark text-buzz-cream">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: "url('/honeycomb.svg')",
          backgroundSize: "72px 125px",
        }}
      />
      <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-buzz-amber/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-buzz-pollen/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <p className="text-[12px] font-semibold tracking-[0.26em] text-buzz-amber uppercase">
              Сезон FTC 2026–2027
            </p>
            <h2 className="mt-4 text-[4.2rem] leading-[0.82] text-buzz-pollen sm:text-[6.4rem] [font-family:var(--font-buzz),Georgia,serif]">
              BIO
              <span className="block">BUZZ</span>
            </h2>
            <p className="mt-3 text-sm tracking-[0.12em] text-buzz-amber/85">presented by RTX</p>
            <p className="mt-8 max-w-md text-[16.5px] leading-8 text-buzz-cream/78">
              Альянсы собирают POLLEN и NECTAR, загружают HIVE, пока он не опрокинется,
              и в конце матча кладут элементы в FLOWERS. На scrimmage можно отладить
              робота именно под это поле.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-4 rounded-[2rem] border border-buzz-amber/30" />
            <div className="absolute -inset-8 -z-10 rotate-3 rounded-[2.2rem] border border-buzz-pollen/15" />
            <div className="relative overflow-hidden rounded-[1.6rem] shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
              <Image
                src="/field-overhead.jpg"
                alt="Игровое поле FTC с роботами и элементами"
                width={1200}
                height={900}
                className="h-[300px] w-full object-cover sm:h-[400px] lg:h-[460px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-buzz-dark/70 via-transparent to-buzz-dark/10" />
              <p className="absolute bottom-4 left-5 text-xs tracking-[0.2em] text-buzz-pollen uppercase">
                Поле · матч
              </p>
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {PIECES.map((piece) => (
            <div
              key={piece.name}
              className="border border-buzz-amber/25 bg-black/25 px-5 py-6 backdrop-blur-sm"
            >
              <p className="text-2xl text-buzz-pollen [font-family:var(--font-buzz),Georgia,serif]">
                {piece.name}
              </p>
              <p className="mt-2 text-sm leading-6 text-buzz-cream/70">{piece.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
