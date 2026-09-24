"use client";

import { INVITE_ROLE_IDS } from "@/lib/invite-copy";
import { Reveal } from "@/components/reveal";
import { useInviteLang } from "@/components/invite-i18n";

export function InviteRoles() {
  const { t } = useInviteLang();

  return (
    <section id="roles" className="invite-section">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <Reveal>
          <p className="invite-kicker">{t.rolesKicker}</p>
          <h2 className="invite-h2 mt-3">
            {t.rolesTitle}
            <em>{t.rolesItalic}</em>
          </h2>
        </Reveal>
        <div className="invite-bento mt-12">
          {INVITE_ROLE_IDS.map((id, index) => (
            <Reveal key={id} delay={index * 50}>
              <article className={index === 0 ? "is-lead" : undefined}>
                <p>0{index + 1}</p>
                <h3>{t.roles[id].title}</h3>
                <p>{t.roles[id].text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
