import { INVITE_ROLES } from "@/lib/constants";
import { Reveal } from "@/components/reveal";

export function InviteRoles() {
  return (
    <section id="roles" className="bg-navy-deep text-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <Reveal>
          <p className="text-[12px] font-semibold tracking-[0.26em] text-gold-soft uppercase">
            Roles we are looking for
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-4xl">
            Robotics, media, and the people
            <span className="mt-1 block italic text-gold-soft [font-family:var(--font-buzz),Georgia,serif]">
              who hold the season together
            </span>
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {INVITE_ROLES.map((role, index) => (
            <Reveal key={role.value} delay={index * 55}>
              <article className="h-full border border-white/10 bg-white/4 px-5 py-6 backdrop-blur-sm">
                <h3 className="text-xl font-semibold">{role.title}</h3>
                <p className="mt-2 text-sm leading-7 text-white/68">{role.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
