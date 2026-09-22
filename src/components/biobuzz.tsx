export function Biobuzz() {
  return (
    <section id="biobuzz" className="honeycomb text-buzz-cream">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-sm tracking-wide text-buzz-amber">2026–2027 · FIRST Tech Challenge</p>
          <h2 className="mt-3 text-5xl leading-none text-buzz-pollen sm:text-7xl [font-family:var(--font-buzz),Georgia,serif]">
            BIOBUZZ
          </h2>
          <p className="mt-2 text-lg text-buzz-amber">presented by RTX</p>
          <p className="mt-6 max-w-xl text-[16px] leading-8 text-buzz-cream/85">
            Сезон про природу и инженерию: альянсы набирают POLLEN и NECTAR,
            загружают HIVE, пока конструкция не опрокинется, и в конце матча
            кладут элементы в FLOWERS по периметру поля.
          </p>
        </div>
        <ul className="space-y-5 border-l border-buzz-amber/40 pl-6 text-sm leading-6">
          <li>
            <span className="font-semibold text-buzz-pollen">POLLEN</span>
            <p className="mt-1 text-buzz-cream/75">Нейтральные жёлтые элементы. Легче, их больше на поле.</p>
          </li>
          <li>
            <span className="font-semibold text-buzz-pollen">NECTAR</span>
            <p className="mt-1 text-buzz-cream/75">Красные и синие, крупнее и тяжелее — HIVE опрокидывается быстрее.</p>
          </li>
          <li>
            <span className="font-semibold text-buzz-pollen">HIVE / FLOWERS</span>
            <p className="mt-1 text-buzz-cream/75">
              Центральные ульи альянсов и четыре цветка на стенках поля. На scrimmage
              можно спокойно отладить intake, shooter и зрение.
            </p>
          </li>
        </ul>
      </div>
    </section>
  );
}
