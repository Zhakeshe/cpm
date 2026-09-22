import { CONTACTS, VENUE } from "@/lib/constants";

export function Footer() {
  return (
    <footer id="contacts" className="bg-navy-deep text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="text-lg font-semibold">K.E.R.N School</p>
          <p className="mt-2 text-sm text-mist">K.E.R.N Scrimmage</p>
          <p className="mt-4 text-sm leading-6 text-mist/80">
            {VENUE.address}
            <br />
            {VENUE.city}
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <a href={CONTACTS.instagram} className="text-mist hover:text-white" target="_blank" rel="noreferrer">
            Instagram
          </a>
          <a href={CONTACTS.whatsapp} className="text-mist hover:text-white" target="_blank" rel="noreferrer">
            WhatsApp
          </a>
          <a href={VENUE.twoGisUrl} className="text-mist hover:text-white" target="_blank" rel="noreferrer">
            2GIS
          </a>
        </div>
        <p className="text-xs leading-6 text-mist/70">
          FIRST®, FIRST Tech Challenge, BIOBUZZ™ и связанные знаки принадлежат FIRST.
          K.E.R.N Scrimmage — независимая тренировка, пока мероприятие не заявлено
          как официальный FIRST event.
        </p>
      </div>
    </footer>
  );
}
