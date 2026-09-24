"use client";

import { withBase } from "@/lib/utils";

type TextItem = { title: string; note?: string; grant?: string };
type LogoItem = { src: string; alt?: string };

export function InviteMarquee({
  items,
  reverse = false,
}: {
  items: TextItem[];
  reverse?: boolean;
}) {
  const loop = [...items, ...items];

  return (
    <div className={`invite-marquee${reverse ? " is-rev" : ""}`}>
      <div className="invite-marquee-track">
        {loop.map((item, index) => (
          <article key={`${item.title}-${index}`} className="invite-logo-card">
            <strong>{item.title}</strong>
            {item.note ? <span>{item.note}</span> : null}
            {item.grant ? <p>{item.grant}</p> : null}
          </article>
        ))}
      </div>
    </div>
  );
}

export function InviteLogoMarquee({
  logos,
  reverse = false,
}: {
  logos: readonly LogoItem[] | readonly string[];
  reverse?: boolean;
}) {
  const items = logos.map((item) => (typeof item === "string" ? { src: item, alt: "" } : item));
  const loop = [...items, ...items];

  return (
    <div className={`invite-marquee${reverse ? " is-rev" : ""}`}>
      <div className="invite-marquee-track">
        {loop.map((item, index) => (
          <article key={`${item.src}-${index}`} className="invite-brand-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={withBase(item.src)} alt={item.alt || ""} />
          </article>
        ))}
      </div>
    </div>
  );
}
