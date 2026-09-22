import { CONTACTS } from "@/lib/constants";

export function Footer() {
  return (
    <footer id="contacts" className="bg-navy-deep text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <p className="text-lg font-semibold tracking-wide">K.E.R.N School</p>
          <p className="mt-2 text-sm text-mist">K.E.R.N FTC Scrimmage</p>
          <p className="mt-4 text-sm text-mist/80">Astana, Kazakhstan</p>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-soft">
            Контакты организаторов
          </p>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <a
              href={CONTACTS.instagram}
              className="text-mist transition hover:text-white"
              target="_blank"
              rel="noreferrer"
            >
              Instagram
            </a>
            <a
              href={CONTACTS.whatsapp}
              className="text-mist transition hover:text-white"
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
          </div>
        </div>
        <p className="text-xs leading-6 text-mist/70 md:text-right">
          FIRST®, FIRST Tech Challenge и связанные товарные знаки принадлежат FIRST.
          Данное мероприятие является независимым scrimmage, если оно официально не
          заявлено как FIRST event.
        </p>
      </div>
    </footer>
  );
}
