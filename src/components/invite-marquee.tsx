"use client";

type Item = { title: string; note?: string };

export function InviteMarquee({
  items,
  reverse = false,
}: {
  items: Item[];
  reverse?: boolean;
}) {
  const loop = [...items, ...items];

  return (
    <div className={`invite-marquee${reverse ? " is-rev" : ""}`} aria-hidden={false}>
      <div className="invite-marquee-track">
        {loop.map((item, index) => (
          <article key={`${item.title}-${index}`} className="invite-logo-card">
            <strong>{item.title}</strong>
            {item.note ? <span>{item.note}</span> : null}
          </article>
        ))}
      </div>
    </div>
  );
}
