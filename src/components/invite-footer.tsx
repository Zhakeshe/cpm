"use client";

import { CONTACTS } from "@/lib/constants";
import { useInviteLang } from "@/components/invite-i18n";

export function InviteFooter() {
  const { t } = useInviteLang();

  return (
    <footer className="invite-footer">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>{t.footerNote}</p>
        <div className="flex gap-5">
          <a href={CONTACTS.instagram} target="_blank" rel="noreferrer">
            Instagram
          </a>
          <a href={CONTACTS.whatsapp} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
        </div>
      </div>
    </footer>
  );
}
