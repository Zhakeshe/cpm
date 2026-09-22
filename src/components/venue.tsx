import { EVENT, TBA, VENUE } from "@/lib/constants";

export function Venue() {
  const widget = `https://widgets.2gis.com/widget?type=firmsonmap&options=${encodeURIComponent(
    JSON.stringify({
      pos: { lat: VENUE.lat, lon: VENUE.lon, zoom: 16 },
    }),
  )}`;

  return (
    <section id="venue" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="overflow-hidden rounded-2xl border border-navy/10 lg:grid lg:grid-cols-[0.9fr_1.1fr]">
          <div className="bg-navy px-6 py-10 text-white sm:px-10">
            <p className="text-sm text-gold-soft">Площадка</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">Адрес</h2>
            <p className="mt-6 text-lg leading-8">
              {VENUE.name}
              <br />
              {VENUE.address}
              <br />
              {VENUE.city}
            </p>
            <dl className="mt-8 space-y-3 text-sm text-white/75">
              <div className="flex justify-between gap-4 border-b border-white/10 py-2">
                <dt>Дата</dt>
                <dd className="text-white">{EVENT.dateLabel}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-white/10 py-2">
                <dt>Время</dt>
                <dd className="text-white">{EVENT.timeLabel}</dd>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <dt>Команды</dt>
                <dd className="text-white">{TBA}</dd>
              </div>
            </dl>
            <a
              href={VENUE.twoGisUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-navy-deep hover:bg-gold-soft"
            >
              Открыть в 2GIS
            </a>
          </div>
          <iframe
            title="K.E.R.N School на карте 2GIS"
            src={widget}
            className="h-[320px] w-full bg-paper lg:h-full lg:min-h-[420px]"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
