"use client";

import { Reveal } from "@/components/reveal";
import { useInviteLang } from "@/components/invite-i18n";

export function InviteSeason() {
  const { t } = useInviteLang();

  return (
    <div id="season">
      <section className="invite-section">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <Reveal>
            <p className="invite-kicker">{t.pathKicker}</p>
            <h2 className="invite-h2 mt-3">
              {t.pathTitle}
              <em>{t.pathItalic}</em>
            </h2>
            <p className="mt-5 max-w-xl text-[16px] leading-7 text-[var(--invite-mute)]">{t.pathLead}</p>
          </Reveal>
          <ol className="invite-path mt-12">
            {t.path.map((step, index) => (
              <li key={step.n}>
                <Reveal delay={index * 80}>
                  <p>{step.n}</p>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="invite-ink-band">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <Reveal>
            <p className="invite-kicker invite-kicker-light">{t.nomsKicker}</p>
            <h2 className="invite-h2 invite-h2-light mt-3">
              {t.nomsTitle}
              <em>{t.nomsItalic}</em>
            </h2>
            <p className="mt-5 max-w-xl text-[16px] leading-7 text-white/60">{t.nomsLead}</p>
          </Reveal>
          <div className="invite-noms mt-12">
            {t.noms.map((item, index) => (
              <Reveal key={item.name} delay={index * 40}>
                <article>
                  <h3>{item.name}</h3>
                  <p>{item.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
          <p className="invite-houston">{t.houston}</p>
        </div>
      </section>

      <section className="invite-section">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <Reveal>
            <p className="invite-kicker">{t.unisKicker}</p>
            <h2 className="invite-h2 mt-3">
              {t.unisTitle}
              <em>{t.unisItalic}</em>
            </h2>
            <p className="mt-5 max-w-xl text-[16px] leading-7 text-[var(--invite-mute)]">{t.unisLead}</p>
          </Reveal>
          <ul className="invite-unis mt-12">
            {t.unis.map((item, index) => (
              <li key={item.name}>
                <Reveal delay={index * 45}>
                  <div className="invite-uni">
                    <strong>{item.name}</strong>
                    <span>{item.place}</span>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="invite-ink-band">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <Reveal>
            <p className="invite-kicker invite-kicker-light">{t.partnersKicker}</p>
            <h2 className="invite-h2 invite-h2-light mt-3">
              {t.partnersTitle}
              <em>{t.partnersItalic}</em>
            </h2>
            <p className="mt-5 max-w-xl text-[16px] leading-7 text-white/60">{t.partnersLead}</p>
          </Reveal>
          <ul className="invite-partners">
            {t.partners.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
