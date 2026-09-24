"use client";

import { Reveal } from "@/components/reveal";
import { useInviteLang } from "@/components/invite-i18n";

export function InviteWhy() {
  const { t } = useInviteLang();

  return (
    <section id="why" className="invite-section">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <Reveal>
          <p className="invite-kicker">{t.whyKicker}</p>
          <h2 className="invite-h2 mt-3">
            {t.whyTitle}
            <em>{t.whyItalic}</em>
          </h2>
        </Reveal>
        <ol className="invite-index mt-12">
          {t.benefits.map((item, index) => (
            <li key={item.title}>
              <Reveal delay={index * 60}>
                <div className="invite-index-row">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
