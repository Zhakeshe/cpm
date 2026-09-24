"use client";

import { InviteLogoMarquee } from "@/components/invite-marquee";
import { FIRST_PARTNER_LOGOS, KZ_PARTNER_LOGOS, UNI_LOGOS } from "@/lib/invite-media";
import { withBase } from "@/lib/utils";
import { useInviteLang } from "@/components/invite-i18n";

export function InviteSeason() {
  const { t } = useInviteLang();

  return (
    <div id="season">
      <section className="invite-section">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="invite-kicker">{t.pathKicker}</p>
          <h2 className="invite-h2 mt-3">
            {t.pathTitle}
            <em>{t.pathItalic}</em>
          </h2>
          <ol className="invite-path mt-8">
            {t.path.map((step) => (
              <li key={step.n}>
                <p>{step.n}</p>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="invite-rail">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="invite-kicker">{t.unisKicker}</p>
          <h2 className="invite-h2 mt-3">
            {t.unisTitle}
            <em>{t.unisItalic}</em>
          </h2>
          <p className="mt-4 max-w-2xl text-[16px] leading-7 text-[var(--invite-mute)]">{t.unisLead}</p>
        </div>
        <div className="invite-grant-grid mx-auto mt-8 max-w-6xl px-4 sm:px-6">
          {t.unis.map((item, index) => (
            <article key={item.name} className="invite-grant-card">
              <div className="invite-grant-logo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={withBase(UNI_LOGOS[index] ?? UNI_LOGOS[0])} alt="" />
              </div>
              <b>{t.unisGrantBadge}</b>
              <strong>{item.name}</strong>
              <span>{item.place}</span>
              <p>{item.grant}</p>
            </article>
          ))}
        </div>
        <div className="mt-7">
          <InviteLogoMarquee logos={UNI_LOGOS} />
        </div>
      </section>

      <section className="invite-rail">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="invite-kicker">{t.partnersKicker}</p>
          <h2 className="invite-h2 mt-3">
            {t.partnersTitle}
            <em>{t.partnersItalic}</em>
          </h2>
          <p className="mt-4 max-w-2xl text-[16px] leading-7 text-[var(--invite-mute)]">{t.partnersLead}</p>
        </div>
        <div className="mt-7">
          <InviteLogoMarquee logos={FIRST_PARTNER_LOGOS} />
        </div>
        <div className="mt-4">
          <InviteLogoMarquee logos={KZ_PARTNER_LOGOS} reverse />
        </div>
      </section>
    </div>
  );
}
