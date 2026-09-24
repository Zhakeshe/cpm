"use client";

import { useInviteLang } from "@/components/invite-i18n";

export function InviteClose() {
  const { t } = useInviteLang();

  return (
    <section className="invite-close">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="invite-kicker invite-kicker-light">{t.closeKicker}</p>
        <h2 className="invite-h2 invite-h2-light mt-3">
          {t.closeTitle}
          <em>{t.closeItalic}</em>
        </h2>
        <p className="mt-5 max-w-lg text-[16px] leading-7 text-white/65">{t.closeText}</p>
        <a href="#apply" className="invite-btn-gold mt-8">
          {t.submit}
        </a>
      </div>
    </section>
  );
}
