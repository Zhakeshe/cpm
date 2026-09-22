"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-navy/10 bg-[#f4f1ea]">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center" aria-label="K.E.R.N School">
          <Image
            src="/kern-logo.svg"
            alt="K.E.R.N School"
            width={168}
            height={66}
            className="h-10 w-auto sm:h-11"
            priority
            unoptimized
          />
        </Link>

        <nav className="hidden items-center gap-5 xl:flex" aria-label="Основная навигация">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-navy/75 hover:text-navy"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="#register"
            className="hidden bg-navy px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-navy-mid xl:inline-flex"
          >
            Зарегистрировать команду
          </a>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center border border-navy/15 text-navy xl:hidden"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-navy/10 bg-[#f4f1ea] px-4 py-4 xl:hidden">
          <nav className="flex flex-col gap-1" aria-label="Мобильная навигация">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-sm px-2 py-2.5 text-sm font-medium text-navy"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href="#register"
              className="mt-2 rounded-sm bg-navy px-3 py-3 text-center text-sm font-semibold text-white"
              onClick={() => setOpen(false)}
            >
              Зарегистрировать команду
            </a>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
