"use client";

import { useEffect, useState } from "react";
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

export function Countdown() {
  const target = new Date(EVENT.startsAt).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = now === null ? 0 : target - now;
  const started = now !== null && remaining <= 0;
  const parts = split(remaining);

  const cells: [string, string][] = [
    [now === null ? "—" : String(parts.days), "дней"],
    [now === null ? "—" : pad(parts.hours), "часов"],
    [now === null ? "—" : pad(parts.minutes), "минут"],
    [now === null ? "—" : pad(parts.seconds), "секунд"],
  ];

  if (started) {
    return (
      <p className="inline-flex rounded-full border border-gold/40 bg-gold/15 px-5 py-2.5 text-sm font-semibold tracking-[0.14em] text-gold-soft uppercase">
        Уже началось
      </p>
    );
  }

  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.32em] text-gold-soft uppercase">До старта</p>
      <div className="mt-4 inline-flex max-w-full items-stretch gap-1.5 sm:gap-2.5">
        {cells.map(([value, label], index) => (
          <div key={label} className="flex items-stretch gap-1.5 sm:gap-2.5">
            {index > 0 ? (
              <span className="hidden self-center pb-4 text-2xl font-light text-gold/70 sm:block" aria-hidden>
                :
              </span>
            ) : null}
            <div className="min-w-[4.4rem] rounded-2xl border border-white/15 bg-navy-deep/45 px-3 py-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_12px_32px_rgba(0,0,0,0.22)] backdrop-blur-md sm:min-w-[5.4rem] sm:px-4 sm:py-3.5">
              <p className="font-semibold tabular-nums text-[1.85rem] leading-none tracking-[-0.06em] text-white sm:text-[2.35rem]">
                {value}
              </p>
              <p className="mt-2 text-[9px] font-semibold tracking-[0.2em] text-gold-soft uppercase sm:text-[10px]">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 inline-flex rounded-full border border-gold/25 bg-gold/10 px-3.5 py-1.5 text-[12px] tracking-[0.04em] text-gold-soft">
        {EVENT.dateLabel}
        <span className="mx-2 text-gold/50">·</span>
        {EVENT.timeLabel}
      </p>
    </div>
  );
}
