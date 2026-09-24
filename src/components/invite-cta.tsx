import { INVITE_PUBLIC_URL } from "@/lib/constants";
import { withBase } from "@/lib/utils";

export function InviteCta() {
  return (
    <section className="bg-navy-deep text-white">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.2fr_auto]">
        <div>
          <p className="text-[12px] font-semibold tracking-[0.26em] text-gold-soft uppercase">
            Last step
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-5xl">
            Become part of
            <span className="mt-1 block italic text-gold-soft [font-family:var(--font-buzz),Georgia,serif]">
              K.E.R.N FTC
            </span>
          </h2>
          <p className="mt-5 max-w-lg text-[16px] leading-7 text-white/72">
            Scan the QR code or fill in the application form and we will contact
            you.
          </p>
          <a
            href="#apply"
            className="mt-8 inline-flex rounded-full bg-gold px-7 py-3.5 text-sm font-semibold text-navy-deep transition hover:bg-gold-soft"
          >
            Submit Application
          </a>
        </div>
        <div className="justify-self-start rounded-3xl border border-gold/35 bg-white p-5 text-navy lg:justify-self-end">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={withBase("/invite-qr.svg")}
            alt={`QR code to ${INVITE_PUBLIC_URL}`}
            width={220}
            height={220}
            className="h-52 w-52"
          />
          <p className="mt-3 text-center text-[11px] font-semibold tracking-[0.16em] text-navy/55 uppercase">
            kern.ushqn.com/invite
          </p>
        </div>
      </div>
    </section>
  );
}
