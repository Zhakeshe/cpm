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
    [String(parts.days), "дней"],
    [pad(parts.hours), "часов"],
    [pad(parts.minutes), "минут"],
    [pad(parts.seconds), "секунд"],
  ];

  return (
    <div>
      {started ? (
        <p className="text-2xl font-semibold tracking-[-0.03em] text-gold-soft">Уже началось</p>
      ) : (
        <div className="flex flex-wrap gap-3 sm:gap-5">
          {cells.map(([value, label]) => (
            <div key={label} className="min-w-[4.5rem]">
              <p className="font-semibold tabular-nums text-[2.35rem] leading-none tracking-[-0.06em] sm:text-5xl">
                {now === null ? "—" : value}
              </p>
              <p className="mt-2 text-[10px] font-medium tracking-[0.18em] text-gold-soft uppercase">
                {label}
              </p>
            </div>
          ))}
        </div>
      )}
      <p className="mt-5 text-sm text-white/75">
        {EVENT.dateLabel} · {EVENT.timeLabel}
      </p>
    </div>
  );
}
