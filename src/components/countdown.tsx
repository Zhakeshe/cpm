"use client";

import { useEffect, useRef, useState } from "react";
import { animate, createTimer, stagger } from "animejs";
import { EVENT } from "@/lib/constants";

type Parts = { days: number; hours: number; minutes: number; seconds: number };

function split(ms: number): Parts {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function Digit({ digit }: { digit: string }) {
  const reel = useRef<HTMLSpanElement>(null);
  const n = digit === "—" ? 0 : Number(digit);

  useEffect(() => {
    const el = reel.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.style.transform = `translateY(${-n}em)`;
      return;
    }
    const animation = animate(el, {
      y: `${-n}em`,
      duration: 720,
      ease: "out(4)",
    });
    return () => {
      animation.pause();
    };
  }, [n]);

  return (
    <span className="relative inline-block h-[1em] w-[0.62em] overflow-hidden align-top">
      <span ref={reel} className="flex flex-col will-change-transform">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="block h-[1em] leading-[1em]">
            {i}
          </span>
        ))}
      </span>
    </span>
  );
}

function Unit({ value, label }: { value: string; label: string }) {
  return (
    <div className="cd-unit flex flex-col items-center">
      <span className="mb-2 text-[10px] font-semibold tracking-[0.28em] text-gold-soft uppercase">{label}</span>
      <span className="flex font-normal tabular-nums text-[3.1rem] leading-none tracking-[-0.06em] text-gold-soft sm:text-[4.4rem] [font-family:var(--font-buzz),Georgia,serif]">
        {value.split("").map((d, i) => (
          <Digit key={`${label}-${i}`} digit={d} />
        ))}
      </span>
    </div>
  );
}

export function Countdown() {
  const root = useRef<HTMLDivElement>(null);
  const colons = useRef<HTMLSpanElement[]>([]);
  const target = new Date(EVENT.startsAt).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = createTimer({
      duration: 1000,
      loop: true,
      onLoop: tick,
    });
    return () => {
      timer.pause();
    };
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const units = el.querySelectorAll(".cd-unit");
    const animation = animate(units, {
      opacity: [0, 1],
      y: ["1.4rem", "0rem"],
      duration: 900,
      delay: stagger(90),
      ease: "out(3)",
    });
    const colonMotion = colons.current.length
      ? animate(colons.current, {
          opacity: [1, 0.18],
          duration: 640,
          loop: true,
          alternate: true,
          ease: "inOut(2)",
        })
      : null;
    return () => {
      animation.pause();
      colonMotion?.pause();
    };
  }, []);

  const remaining = now === null ? 0 : target - now;
  const started = now !== null && remaining <= 0;
  const parts = split(remaining);
  const cells: [string, string][] = [
    [now === null ? "00" : pad(parts.days), "дней"],
    [now === null ? "00" : pad(parts.hours), "часов"],
    [now === null ? "00" : pad(parts.minutes), "минут"],
    [now === null ? "00" : pad(parts.seconds), "секунд"],
  ];

  if (started) {
    return (
      <p className="text-2xl tracking-[-0.03em] text-gold-soft [font-family:var(--font-buzz),Georgia,serif]">
        Уже началось
      </p>
    );
  }

  return (
    <div ref={root}>
      <p className="text-[11px] font-semibold tracking-[0.34em] text-gold-soft uppercase">До старта</p>
      <div className="mt-5 flex items-end gap-2 sm:gap-4">
        {cells.map(([value, label], index) => (
          <div key={label} className="flex items-end gap-2 sm:gap-4">
            {index > 0 ? (
              <span
                ref={(node) => {
                  if (node) colons.current[index - 1] = node;
                }}
                className="mb-1 select-none text-[2rem] text-gold sm:mb-2 sm:text-[3rem] [font-family:var(--font-buzz),Georgia,serif]"
                aria-hidden
              >
                :
              </span>
            ) : null}
            <Unit value={value} label={label} />
          </div>
        ))}
      </div>
      <p className="mt-5 text-[13px] tracking-[0.08em] text-white/70">
        {EVENT.dateLabel}
        <span className="mx-2 text-gold/70">·</span>
        {EVENT.timeLabel}
      </p>
    </div>
  );
}
