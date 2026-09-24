"use client";

import { Reveal } from "@/components/reveal";
import { useInviteLang } from "@/components/invite-i18n";

export function InviteWho() {
  const { t } = useInviteLang();

  return (
    <section id="who" className="invite-section">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <p className="invite-kicker">{t.whoKicker}</p>
          <h2 className="invite-h2 mt-3">
            {t.whoTitle}
            <em>{t.whoItalic}</em>
          </h2>
          <p className="mt-5 max-w-md text-[16px] leading-7 text-[var(--invite-mute)]">{t.whoLead}</p>
        </Reveal>
        <ol className="invite-who">
          {t.who.map((item, index) => (
            <li key={item}>
              <Reveal delay={index * 70}>
                <div className="invite-who-row">
                  <i>{String(index + 1).padStart(2, "0")}</i>
                  <span>{item}</span>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
