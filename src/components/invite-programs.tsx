"use client";

import { useEffect, useState } from "react";
import { PROGRAM_CARDS } from "@/lib/invite-media";
import { withBase } from "@/lib/utils";
import { useInviteLang } from "@/components/invite-i18n";

export function InvitePrograms() {
  const { t } = useInviteLang();
  const [teaser, setTeaser] = useState<string | null>(null);

  useEffect(() => {
    if (!teaser) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTeaser(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [teaser]);

  return (
    <section id="programs" className="invite-section">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="invite-kicker">{t.programsKicker}</p>
        <h2 className="invite-h2 mt-3">{t.programsTitle}</h2>
        <p className="mt-4 max-w-2xl text-[16px] leading-7 text-[var(--invite-mute)]">{t.programsLead}</p>
        <div className="invite-pkz-grid mt-8">
          {t.programs.map((item, index) => {
            const card = PROGRAM_CARDS[index];
            if (!card) return null;
            return (
              <article key={item.name} className="invite-pkz-card">
                <div
                  className="invite-pkz-cover"
                  style={{ backgroundImage: `linear-gradient(90deg, rgb(0 0 0 / 0.42), rgb(0 0 0 / 0.12)), url(${withBase(card.photo)})` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={withBase(card.mark)} alt={t.programsBrand} />
                  <i style={{ background: card.color }} />
                </div>
                <div className="invite-pkz-body">
                  <span style={{ color: card.color, background: `${card.color}20` }}>{item.ages}</span>
                  <p>{item.text}</p>
                  <div className="invite-pkz-actions">
                    <a href={card.more} target="_blank" rel="noreferrer" style={{ background: card.color }}>
                      {t.programsMore}
                    </a>
                    <button type="button" onClick={() => setTeaser(card.youtube)}>
                      {t.programsTeaser}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {teaser ? (
        <div className="invite-teaser" role="dialog" aria-modal="true" aria-label={t.programsTeaser}>
          <button type="button" className="invite-teaser-veil" onClick={() => setTeaser(null)} aria-label="Close" />
          <div className="invite-teaser-sheet">
            <button type="button" className="invite-teaser-close" onClick={() => setTeaser(null)}>
              ×
            </button>
            <div className="invite-teaser-box">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${teaser}?autoplay=1&rel=0`}
                title={t.programsTeaser}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
