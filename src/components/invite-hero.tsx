"use client";

import { withBase } from "@/lib/utils";
import { useInviteLang } from "@/components/invite-i18n";

export function InviteHero() {
  const { t } = useInviteLang();

  return (
    <section className="invite-hero">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="invite-hero-bg" src={withBase("/hero-field.jpg")} alt="" />
      <div className="invite-hero-veil" />
      <div className="invite-hero-copy">
        <p className="invite-hero-eye">{t.heroItalic}</p>
        <h1>{t.heroTitle}</h1>
        <p className="invite-hero-lead">{t.heroLead}</p>
        <div className="invite-hero-actions">
          <a href="#apply" className="invite-btn-gold">
            {t.ctaPrimary}
          </a>
          <a href="#why" className="invite-btn-ghost">
            {t.ctaSecondary}
          </a>
        </div>
      </div>
    </section>
  );
}
