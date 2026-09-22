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
        <p className="text-[12px] font-semibold tracking-[0.26em] text-buzz-amber uppercase">
          Сезон FTC 2026–2027
        </p>
        <h2 className="mt-4 text-[4.2rem] leading-[0.82] text-buzz-pollen sm:text-[6.4rem] [font-family:var(--font-buzz),Georgia,serif]">
          BIOBUZZ
        </h2>
        <p className="mt-3 text-sm tracking-[0.12em] text-buzz-amber/85">presented by RTX</p>
        <p className="mt-8 max-w-2xl text-[16.5px] leading-8 text-buzz-cream/78">
          Альянсы собирают POLLEN и NECTAR, загружают HIVE, пока он не опрокинется,
          и в конце матча кладут элементы в FLOWERS. На scrimmage можно отладить
          робота именно под это поле.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
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
