"use client";

import { InviteClose } from "@/components/invite-close";
import { InviteFooter } from "@/components/invite-footer";
import { InviteForm } from "@/components/invite-form";
import { InviteHeader } from "@/components/invite-header";
import { InviteHero } from "@/components/invite-hero";
import { InviteLangProvider, useInviteLang } from "@/components/invite-i18n";
import { InviteRoles } from "@/components/invite-roles";
import { InviteSeason } from "@/components/invite-season";
import { InviteWho } from "@/components/invite-who";
import { InviteWhy } from "@/components/invite-why";

function InviteInner() {
  const { t } = useInviteLang();

  return (
    <div className="invite-skin">
      <InviteHeader />
      <main>
        <InviteHero />
        <InviteWhy />
        <InviteRoles />
        <InviteSeason />
        <InviteWho />
        <section id="apply" className="invite-section">
          <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-20">
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
