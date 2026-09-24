"use client";

import { withBase } from "@/lib/utils";
import { useInviteLang } from "@/components/invite-i18n";

export function InviteHero() {
  const { t } = useInviteLang();

  return (
    <section className="invite-hero">
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-14">
        <p className="hero-rise invite-kicker">{t.heroEyebrow}</p>
        <h1 className="hero-rise hero-rise-2 invite-display mt-4">
          {t.heroTitle}
          <em>{t.heroItalic}</em>
        </h1>
        <p className="hero-rise hero-rise-3 mt-6 max-w-2xl text-[17px] leading-8 text-white/78">{t.heroLead}</p>
        <p className="hero-rise hero-rise-4 mt-3 max-w-2xl text-[15px] leading-7 text-white/55">{t.heroBody}</p>
        <div className="hero-rise hero-rise-5 mt-8 flex flex-wrap gap-3">
          <a href="#apply" className="invite-btn-gold">
            {t.ctaPrimary}
          </a>
          <a href="#why" className="invite-btn-ghost">
            {t.ctaSecondary}
          </a>
        </div>
      </div>
      <div className="invite-hero-photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={withBase("/hero-field.jpg")} alt="" />
      </div>
    </section>
  );
}
