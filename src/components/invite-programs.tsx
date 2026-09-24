"use client";

import { PROGRAM_FOCUS, PROGRAM_PHOTOS } from "@/lib/invite-media";
import { withBase } from "@/lib/utils";
import { useInviteLang } from "@/components/invite-i18n";

export function InvitePrograms() {
  const { t } = useInviteLang();

  return (
    <section id="programs" className="invite-section">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="invite-kicker">{t.programsKicker}</p>
        <h2 className="invite-h2 mt-3">
          {t.programsTitle}
          <em>{t.programsItalic}</em>
        </h2>
        <p className="mt-4 max-w-2xl text-[16px] leading-7 text-[var(--invite-mute)]">{t.programsLead}</p>
        <div className="invite-program-grid mt-8">
          {t.programs.map((item, index) => (
            <article key={item.name} className={index === 3 ? "is-ftc" : undefined}>
              <div className="invite-program-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={withBase(PROGRAM_PHOTOS[index] ?? PROGRAM_PHOTOS[0])}
                  alt=""
                  style={{ objectPosition: PROGRAM_FOCUS[index] ?? "center" }}
                />
              </div>
              <div>
                <span>{item.ages}</span>
                <h3>{item.name}</h3>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
