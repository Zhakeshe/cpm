"use client";

import { useInviteLang } from "@/components/invite-i18n";

export function InviteFirst() {
  const { t } = useInviteLang();

  return (
    <section id="first" className="invite-section">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="invite-kicker">{t.firstKicker}</p>
        <h2 className="invite-h2 mt-3">
          {t.firstTitle}
          <em>{t.firstItalic}</em>
        </h2>
        <p className="mt-4 max-w-2xl text-[16px] leading-7 text-[var(--invite-mute)]">{t.firstLead}</p>
        <div className="invite-first-grid mt-8">
          {t.first.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
