import { CONTACTS, VENUE } from "@/lib/constants";

export function Footer() {
  return (
    <footer id="contacts" className="bg-navy-deep text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <p className="text-lg font-semibold">K.E.R.N School</p>
          <p className="mt-1 text-sm italic text-gold-soft">K.E.R.N Scrimmage</p>
          <p className="mt-4 text-sm leading-6 text-white/65">
            {VENUE.address}
            <br />
            {VENUE.city}
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <a href={CONTACTS.instagram} className="text-white/70 hover:text-white" target="_blank" rel="noreferrer">
            Instagram
          </a>
          <a href={CONTACTS.whatsapp} className="text-white/70 hover:text-white" target="_blank" rel="noreferrer">
            WhatsApp
          </a>
          <a href={VENUE.twoGisUrl} className="text-white/70 hover:text-white" target="_blank" rel="noreferrer">
            2GIS
          </a>
        </div>
        <p className="text-xs leading-6 text-white/45">
          FIRST®, FIRST Tech Challenge, BIOBUZZ™ принадлежат FIRST. Это независимый
          scrimmage, пока он не заявлен как официальный FIRST event.
        </p>
      </div>
    </footer>
  );
}
