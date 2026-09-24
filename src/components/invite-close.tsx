"use client";

import { useInviteLang } from "@/components/invite-i18n";

export function InviteClose() {
  const { t } = useInviteLang();

  return (
    <section className="invite-close">
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
        <p className="invite-kicker">{t.closeKicker}</p>
        <h2 className="invite-h2 mt-3">
          {t.closeTitle}
          <em>{t.closeItalic}</em>
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-[16px] leading-7 text-[var(--invite-mute)]">{t.closeText}</p>
        <a href="#apply" className="invite-btn-gold mt-8">
          {t.submit}
        </a>
      </div>
    </section>
  );
}
