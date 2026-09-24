"use client";

import { Reveal } from "@/components/reveal";
import { withBase } from "@/lib/utils";
import { useInviteLang } from "@/components/invite-i18n";

const CARD_FOCUS = ["68% center", "28% 40%", "80% 30%", "45% 70%", "15% 20%", "55% 10%"];

export function InviteWhy() {
  const { t } = useInviteLang();

  return (
    <section id="why" className="invite-section">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <Reveal>
          <p className="invite-kicker">{t.whyKicker}</p>
          <h2 className="invite-h2 mt-3">
            {t.whyTitle}
            <em>{t.whyItalic}</em>
          </h2>
        </Reveal>
        <div className="invite-photo-grid mt-10">
          {t.benefits.map((item, index) => (
            <Reveal key={item.title} delay={index * 50}>
              <article className="invite-photo-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={withBase("/hero-field.jpg")}
                  alt=""
                  style={{ objectPosition: CARD_FOCUS[index] ?? "center" }}
                />
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
