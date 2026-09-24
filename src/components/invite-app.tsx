"use client";

import { InviteClose } from "@/components/invite-close";
import { InviteFooter } from "@/components/invite-footer";
import { InviteForm } from "@/components/invite-form";
import { InviteHeader } from "@/components/invite-header";
import { InviteHero } from "@/components/invite-hero";
import { InviteLangProvider, useInviteLang } from "@/components/invite-i18n";
import { InviteRoles } from "@/components/invite-roles";
import { InviteSeason } from "@/components/invite-season";

function InviteInner() {
  const { t } = useInviteLang();

  return (
    <div className="invite-skin">
      <div className="invite-stage">
        <InviteHeader />
        <InviteHero />
      </div>
      <div className="invite-season-chip">
        <span>{t.seasonChip}</span>
      </div>
      <section className="invite-intro">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="invite-h2">{t.introTitle}</h2>
          <p className="mt-4 text-[16px] leading-7 text-[var(--invite-mute)]">{t.introLead}</p>
        </div>
      </section>
      <main>
        <InviteRoles />
        <InviteSeason />
        <section id="apply" className="invite-section">
          <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
            <p className="invite-kicker">{t.formKicker}</p>
            <h2 className="invite-h2 mt-3">{t.formTitle}</h2>
            <p className="mt-3 text-[16px] leading-7 text-[var(--invite-mute)]">{t.formLead}</p>
            <div className="mt-8">
              <InviteForm />
            </div>
          </div>
        </section>
        <InviteClose />
      </main>
      <InviteFooter />
    </div>
  );
}

export function InviteApp() {
  return (
    <InviteLangProvider>
      <InviteInner />
    </InviteLangProvider>
  );
}
