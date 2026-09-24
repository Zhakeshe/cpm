import { withBase } from "@/lib/utils";

export function InviteHero() {
  return (
    <section className="relative isolate min-h-[560px] overflow-hidden bg-navy-deep text-white sm:min-h-[700px] lg:min-h-[780px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={withBase("/hero-field.jpg")}
        alt="FTC robots on a competition field"
        className="absolute inset-0 h-full w-full object-cover object-[68%_center] saturate-[1.05]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-navy-deep via-navy-deep/88 to-navy/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-transparent to-navy-deep/35" />
      <div className="absolute inset-y-0 left-0 w-1 bg-gold" />

      <div className="relative mx-auto flex min-h-[560px] max-w-6xl flex-col justify-end px-4 pb-12 pt-24 sm:min-h-[700px] sm:px-6 sm:pb-20 lg:min-h-[780px]">
        <p className="hero-rise text-[12px] font-semibold tracking-[0.28em] text-gold-soft uppercase">
          K.E.R.N School · FTC Team
        </p>
        <h1 className="hero-rise hero-rise-2 mt-5 max-w-3xl text-[2.5rem] font-semibold leading-[0.92] tracking-[-0.05em] sm:text-6xl lg:text-[4.6rem]">
          Join the K.E.R.N
          <span className="mt-1 block font-normal italic text-gold-soft [font-family:var(--font-buzz),Georgia,serif]">
            FTC Team
          </span>
        </h1>
        <div className="hero-rise hero-rise-3 mt-6 h-px w-24 bg-gold" />
        <p className="hero-rise hero-rise-3 mt-6 max-w-xl text-[18px] leading-8 text-white/88">
          We are looking for students who want to build, create, promote, and
          grow together.
        </p>
        <p className="hero-rise hero-rise-4 mt-4 max-w-xl text-[16px] leading-7 text-white/70">
          FIRST Tech Challenge is not only robotics. It is teamwork, media,
          branding, communication, and organization — one crew that designs
          robots and the story around them.
        </p>
        <div className="hero-rise hero-rise-5 mt-9 flex flex-wrap gap-3">
          <a
            href="#apply"
            className="rounded-full bg-gold px-7 py-3.5 text-sm font-semibold text-navy-deep shadow-[0_12px_32px_rgba(0,0,0,0.28)] transition hover:bg-gold-soft"
          >
            Apply Now
          </a>
          <a
            href="#why"
            className="rounded-full border border-white/30 bg-white/8 px-7 py-3.5 text-sm text-white backdrop-blur-md transition hover:bg-white/16"
          >
            Learn More
          </a>
        </div>
      </div>
    </section>
  );
}
