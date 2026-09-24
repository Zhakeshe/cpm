import { INVITE_WHO } from "@/lib/constants";
import { Reveal } from "@/components/reveal";

export function InviteWho() {
  return (
    <section id="who" className="bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-start">
          <Reveal>
            <p className="text-[12px] font-semibold tracking-[0.26em] text-gold uppercase">
              Who can apply
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.03em] text-navy sm:text-4xl">
              If you want to learn
              <span className="mt-1 block italic text-gold">and actually show up</span>
            </h2>
            <p className="mt-5 max-w-md text-[16px] leading-7 text-ink/70">
              You do not need a finished portfolio. You need curiosity, a role you
              care about, and the habit of finishing work with other people.
            </p>
          </Reveal>
          <div className="grid gap-3">
            {INVITE_WHO.map((item, index) => (
              <Reveal key={item} delay={index * 80}>
                <div className="flex gap-4 rounded-2xl bg-white px-5 py-4 shadow-[0_12px_32px_rgba(6,45,89,0.05)]">
                  <span className="mt-0.5 text-sm font-semibold text-gold">0{index + 1}</span>
                  <p className="text-[15px] leading-7 text-navy">{item}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
