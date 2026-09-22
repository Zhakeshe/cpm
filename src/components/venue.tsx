import { TBA, VENUE } from "@/lib/constants";

export function Venue() {
  const widget = `https://widgets.2gis.com/widget?type=firmsonmap&options=${encodeURIComponent(
    JSON.stringify({
      pos: { lat: VENUE.lat, lon: VENUE.lon, zoom: 16 },
    }),
  )}`;

  return (
    <section id="venue" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <h2 className="text-2xl font-semibold text-navy">Адрес</h2>
            <p className="mt-4 text-lg text-ink">{VENUE.name}</p>
            <p className="mt-1 text-[16px] leading-7 text-muted">
              {VENUE.address}
              <br />
              {VENUE.city}
            </p>
            <dl className="mt-8 space-y-3 text-sm">
              <div className="flex gap-6">
                <dt className="w-28 text-muted">Дата</dt>
                <dd>{TBA}</dd>
              </div>
              <div className="flex gap-6">
                <dt className="w-28 text-muted">Время</dt>
                <dd>{TBA}</dd>
              </div>
              <div className="flex gap-6">
                <dt className="w-28 text-muted">Команды</dt>
                <dd>{TBA}</dd>
              </div>
            </dl>
            <a
              href={VENUE.twoGisUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex border border-navy px-4 py-2.5 text-sm font-medium text-navy hover:bg-navy hover:text-white"
            >
              Открыть в 2GIS
            </a>
          </div>
          <iframe
            title="K.E.R.N School на карте 2GIS"
            src={widget}
            className="h-[340px] w-full border border-navy/10 bg-[#f4f1ea] sm:h-[420px]"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
