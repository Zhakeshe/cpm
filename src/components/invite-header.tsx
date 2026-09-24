"use client";

import Link from "next/link";
import { INVITE_NAV_LINKS } from "@/lib/constants";
import { LOCALE_META, LOCALES } from "@/lib/invite-copy";
import { withBase } from "@/lib/utils";
import { useInviteLang } from "@/components/invite-i18n";

export function InviteHeader() {
  const { t, locale, setLocale } = useInviteLang();

  return (
    <header className="invite-bar">
      <div className="invite-bar-inner">
        <Link href="/" className="flex shrink-0 items-center" aria-label="K.E.R.N School">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={withBase("/kern-logo.svg")}
            alt="K.E.R.N School"
            width={168}
            height={66}
            className="invite-bar-logo"
          />
        </Link>

        <nav className="invite-bar-nav" aria-label="Invite">
          {INVITE_NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="invite-nav">
              {t.nav[link.key]}
            </a>
          ))}
        </nav>

        <div className="invite-langs" role="group" aria-label="Language">
          {LOCALES.map((item) => (
            <button
              key={item}
              type="button"
              className={item === locale ? "is-on" : undefined}
              onClick={() => setLocale(item)}
            >
              {LOCALE_META[item].short}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
