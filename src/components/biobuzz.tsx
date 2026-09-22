export function Biobuzz() {
  return (
    <section id="biobuzz" className="honeycomb text-buzz-cream">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <p className="text-sm text-buzz-amber">Сезон FTC 2026–2027</p>
        <h2 className="mt-3 text-6xl leading-none text-buzz-pollen sm:text-8xl [font-family:var(--font-buzz),Georgia,serif]">
          BIOBUZZ
        </h2>
        <p className="mt-2 text-buzz-amber">presented by RTX</p>
        <p className="mt-8 max-w-2xl text-[17px] leading-8 text-buzz-cream/85">
          Альянсы собирают POLLEN и NECTAR, загружают HIVE, пока он не опрокинется,
          и в конце матча кладут элементы в FLOWERS. На scrimmage можно отладить
          робота именно под это поле.
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            ["POLLEN", "Жёлтые нейтральные элементы. Легче — их больше на тайлах."],
            ["NECTAR", "Красные и синие, крупнее и тяжелее. Ими HIVE валится быстрее."],
            ["HIVE", "Бистабильный улей альянса плюс четыре FLOWERS на стенках поля."],
          ].map(([title, text]) => (
            <article
              key={title}
              className="border border-buzz-amber/25 bg-black/20 px-5 py-6"
            >
              <h3 className="text-lg text-buzz-pollen [font-family:var(--font-buzz),Georgia,serif]">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-buzz-cream/70">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
