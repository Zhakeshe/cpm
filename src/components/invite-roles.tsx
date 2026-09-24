"use client";

import { useEffect, useRef, useState } from "react";
import { INVITE_ROLE_IDS } from "@/lib/invite-copy";
import { ROLE_FOCUS, ROLE_PHOTOS } from "@/lib/invite-media";
import { withBase } from "@/lib/utils";
import { useInviteLang } from "@/components/invite-i18n";

function isCoarsePointer() {
  return window.matchMedia("(pointer: coarse)").matches;
}

export function InviteRoles() {
  const { t } = useInviteLang();
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const root = scroller.current;
    if (!root) return;

    const cards = [...root.querySelectorAll<HTMLElement>(".invite-role-card")];
    const sync = () => {
      const mid = root.scrollLeft + root.clientWidth / 2;
      let next = 0;
      let best = Number.POSITIVE_INFINITY;
      cards.forEach((card, index) => {
        const center = card.offsetLeft + card.offsetWidth / 2;
        const dist = Math.abs(center - mid);
        if (dist < best) {
          best = dist;
          next = index;
        }
      });
      setActive(next);
    };

    sync();
    root.addEventListener("scroll", sync, { passive: true });
    return () => root.removeEventListener("scroll", sync);
  }, []);

  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      isCoarsePointer()
    ) {
      return;
    }
    const timer = window.setInterval(() => {
      const cards = root.querySelectorAll<HTMLElement>(".invite-role-card");
      if (!cards.length) return;
      const next = (active + 1) % cards.length;
      const card = cards[next];
      root.scrollTo({ left: Math.max(0, card.offsetLeft - 24), behavior: "smooth" });
    }, 5200);
    return () => window.clearInterval(timer);
  }, [active]);

  function go(index: number) {
    const root = scroller.current;
    const card = root?.querySelectorAll<HTMLElement>(".invite-role-card")[index];
    if (!root || !card) return;
    root.scrollTo({
      left: Math.max(0, card.offsetLeft - 24),
      behavior: isCoarsePointer() ? "auto" : "smooth",
    });
  }

  return (
    <section id="roles" className="invite-section">
      <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
        <p className="invite-kicker">{t.rolesKicker}</p>
        <h2 className="invite-h2 mt-3">
          {t.rolesTitle}
          <em>{t.rolesItalic}</em>
        </h2>
      </div>
      <div ref={scroller} className="invite-role-scroller">
        {INVITE_ROLE_IDS.map((id, index) => (
          <article key={id} className={`invite-role-card${index === active ? " is-on" : ""}`}>
            <div className="invite-role-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={withBase(ROLE_PHOTOS[id])} alt="" style={{ objectPosition: ROLE_FOCUS[id] }} />
            </div>
            <p>0{index + 1}</p>
            <h3>{t.roles[id].title}</h3>
            <p>{t.roles[id].text}</p>
          </article>
        ))}
      </div>
      <div className="invite-role-dots" role="tablist" aria-label={t.rolesTitle}>
        {INVITE_ROLE_IDS.map((id, index) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={index === active}
            className={index === active ? "is-on" : undefined}
            onClick={() => go(index)}
          />
        ))}
      </div>
    </section>
  );
}
