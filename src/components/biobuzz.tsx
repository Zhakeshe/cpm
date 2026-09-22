export function Biobuzz() {
  return (
    <section id="biobuzz" className="bg-[#f3ead2]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-[#8a6a1f]">Сезон FTC 2026–2027</p>
            <h2 className="mt-3 text-5xl leading-none text-navy sm:text-7xl [font-family:var(--font-buzz),Georgia,serif]">
              BIOBUZZ
            </h2>
            <p className="mt-2 text-[#8a6a1f]">presented by RTX</p>
            <p className="mt-8 text-[17px] leading-8 text-navy/80">
              Альянсы собирают POLLEN и NECTAR, загружают HIVE, пока он не опрокинется,
              и в конце матча кладут элементы в FLOWERS. На scrimmage можно отладить
              робота именно под это поле.
            </p>
          </div>
          <svg
            viewBox="0 0 180 200"
            className="hidden h-44 w-40 shrink-0 text-[#c89b4a] lg:block"
            aria-hidden="true"
          >
            <polygon
              points="90,8 166,52 166,140 90,184 14,140 14,52"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <polygon
              points="90,48 132,72 132,120 90,144 48,120 48,72"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              opacity="0.5"
            />
          </svg>
        </div>
        <dl className="mt-14 grid gap-8 border-t border-[#c89b4a]/35 pt-10 sm:grid-cols-3">
          <div>
            <dt className="text-sm font-semibold tracking-wide text-navy">POLLEN</dt>
            <dd className="mt-2 text-sm leading-6 text-navy/70">
              Жёлтые нейтральные элементы. Легче — их больше на тайлах.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold tracking-wide text-navy">NECTAR</dt>
            <dd className="mt-2 text-sm leading-6 text-navy/70">
              Красные и синие, крупнее и тяжелее. Ими HIVE валится быстрее.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold tracking-wide text-navy">HIVE</dt>
            <dd className="mt-2 text-sm leading-6 text-navy/70">
              Улей альянса и четыре FLOWERS на стенках поля.
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
