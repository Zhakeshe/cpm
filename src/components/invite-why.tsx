"use client";

import { PROGRAMME_INDEXES, PROGRAMME_PHOTOS } from "@/lib/invite-media";
import { withBase } from "@/lib/utils";
import { useInviteLang } from "@/components/invite-i18n";

export function InviteWhy() {
  const { t } = useInviteLang();
  const cards = PROGRAMME_INDEXES.map((index, i) => ({
    ...t.benefits[index],
    photo: PROGRAMME_PHOTOS[i],
  }));

  return (
    <section id="why" className="invite-section">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="invite-kicker">{t.whyKicker}</p>
        <h2 className="invite-h2 mt-3">
          {t.whyTitle}
          <em>{t.whyItalic}</em>
        </h2>
        <div className="invite-photo-grid mt-8">
          {cards.map((item) => (
            <article key={item.title} className="invite-photo-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={withBase(item.photo)} alt="" />
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
