"use client";

import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";
import { withBase } from "@/lib/utils";
import { useInviteLang } from "@/components/invite-i18n";

export function InviteHero() {
  const { t } = useInviteLang();
  const copy = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = copy.current;
    if (
      !root ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia("(pointer: coarse)").matches
    ) {
      return;
    }
    const nodes = root.querySelectorAll(".invite-rise");
    const motion = animate(nodes, {
      y: [12, 0],
      delay: stagger(70),
      duration: 620,
      ease: "out(3)",
    });
    return () => {
      motion.pause();
    };
  }, [t.heroTitle]);

  return (
    <section className="invite-hero">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="invite-hero-bg" src={withBase("/invite-hero.jpg")} alt="" />
      <div className="invite-hero-veil" />
      <div ref={copy} className="invite-hero-copy">
        <p className="invite-hero-eye invite-rise">{t.heroItalic}</p>
        <h1 className="invite-rise">{t.heroTitle}</h1>
        <p className="invite-hero-lead invite-rise">{t.heroLead}</p>
        <div className="invite-hero-actions invite-rise">
          <a href="#apply" className="invite-btn-gold">
            {t.ctaPrimary}
          </a>
          <a href="#first" className="invite-btn-ghost">
            {t.ctaSecondary}
          </a>
        </div>
        <a href="#first" className="invite-scroll invite-rise">
          <span>{t.scrollHint}</span>
        </a>
      </div>
    </section>
  );
}
