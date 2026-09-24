import { INVITE_BENEFITS } from "@/lib/constants";
import { Reveal } from "@/components/reveal";

export function InviteWhy() {
  return (
    <section id="why" className="bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <Reveal>
          <p className="text-[12px] font-semibold tracking-[0.26em] text-gold uppercase">
            Why join us
          </p>
          <h2 className="mt-3 max-w-xl text-3xl font-semibold leading-tight tracking-[-0.03em] text-navy sm:text-4xl">
            A real team, not a club
            <span className="mt-1 block italic text-gold">you join for a week</span>
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INVITE_BENEFITS.map((item, index) => (
            <Reveal key={item.title} delay={index * 70}>
              <article className="h-full rounded-2xl border border-navy/8 bg-white px-5 py-6 shadow-[0_16px_40px_rgba(6,45,89,0.05)]">
                <p className="text-[11px] font-semibold tracking-[0.2em] text-gold uppercase">
                  0{index + 1}
                </p>
                <h3 className="mt-3 text-lg font-semibold text-navy">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted">{item.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
