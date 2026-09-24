"use client";

import { InviteMarquee } from "@/components/invite-marquee";
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
        </div>
        <div className="mt-7">
          <InviteMarquee items={t.unis.map((item) => ({ title: item.name, note: item.place }))} />
        </div>
      </section>

      <section className="invite-rail">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="invite-kicker">{t.partnersKicker}</p>
          <h2 className="invite-h2 mt-3">
            {t.partnersTitle}
            <em>{t.partnersItalic}</em>
          </h2>
        </div>
        <div className="mt-7">
          <InviteMarquee items={t.partners.map((name) => ({ title: name }))} reverse />
        </div>
      </section>
    </div>
  );
}
