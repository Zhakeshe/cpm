"use client";

import { withBase } from "@/lib/utils";
import { useInviteLang } from "@/components/invite-i18n";

export function InviteHero() {
  const { t } = useInviteLang();

  return (
    <section className="invite-hero">
      <div className="mx-auto grid max-w-6xl items-end gap-10 px-4 pb-14 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <div>
          <p className="hero-rise invite-kicker">{t.heroEyebrow}</p>
          <h1 className="hero-rise hero-rise-2 invite-display mt-5">
            {t.heroTitle}
            <em>{t.heroItalic}</em>
          </h1>
          <p className="hero-rise hero-rise-3 mt-6 max-w-xl text-[18px] leading-8 text-[var(--invite-ink)]/80">
            {t.heroLead}
          </p>
          <p className="hero-rise hero-rise-4 mt-4 max-w-xl text-[15px] leading-7 text-[var(--invite-mute)]">
            {t.heroBody}
          </p>
          <div className="hero-rise hero-rise-5 mt-9 flex flex-wrap gap-3">
            <a href="#apply" className="invite-btn-gold">
              {t.ctaPrimary}
            </a>
            <a href="#roles" className="invite-btn-ghost">
              {t.ctaSecondary}
            </a>
          </div>
        </div>

        <aside className="hero-rise hero-rise-3 invite-plate">
          <div className="invite-frame">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={withBase("/hero-field.jpg")}
              alt=""
              className="h-full w-full object-cover object-[70%_center]"
            />
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] font-semibold tracking-[0.18em] text-[var(--invite-mute)] uppercase">
            <span>FTC · K.E.R.N</span>
            <span>Astana</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
