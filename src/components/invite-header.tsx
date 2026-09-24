"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { INVITE_NAV_LINKS } from "@/lib/constants";
import { LOCALE_META, LOCALES } from "@/lib/invite-copy";
import { withBase } from "@/lib/utils";
import { useInviteLang } from "@/components/invite-i18n";

export function InviteHeader() {
  const [open, setOpen] = useState(false);
  const { t, locale, setLocale } = useInviteLang();

  return (
    <header className="invite-bar sticky top-0 z-50">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center" aria-label="K.E.R.N School">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={withBase("/kern-logo.svg")}
            alt="K.E.R.N School"
            width={168}
            height={66}
            className="h-10 w-auto sm:h-11"
          />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Invite">
          {INVITE_NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="invite-nav">
              {t.nav[link.key]}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
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
          <a href="#apply" className="invite-btn-navy hidden sm:inline-flex">
            {t.apply}
          </a>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--invite-line)] text-[var(--invite-ink)] lg:hidden"
            aria-label={open ? "Close" : "Menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-[var(--invite-line)] bg-[var(--invite-cream)] px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {INVITE_NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-2 py-2.5 text-sm font-medium text-[var(--invite-ink)]"
                onClick={() => setOpen(false)}
              >
                {t.nav[link.key]}
              </a>
            ))}
            <a
              href="#apply"
              className="invite-btn-navy mt-2 justify-center"
              onClick={() => setOpen(false)}
            >
              {t.apply}
            </a>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
