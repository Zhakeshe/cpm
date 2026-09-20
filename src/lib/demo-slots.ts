export const SLOT_MINUTES = 30;
export const WORK_START_HOUR = 10;
export const WORK_END_HOUR = 19;
export const ALMATY_OFFSET_HOURS = 5;
export const AUTO_BUFFER_MS = 60 * 60 * 1000;

export type TimeInterval = { start: Date; end: Date };

export function overlaps(a: TimeInterval, b: TimeInterval) {
  return a.start < b.end && b.start < a.end;
}

export function slotFromAlmaty(year: number, monthIndex: number, day: number, hour: number, minute: number) {
  return new Date(Date.UTC(year, monthIndex, day, hour - ALMATY_OFFSET_HOURS, minute, 0, 0));
}

function almatyYmd(date: Date) {
  const shifted = new Date(date.getTime() + ALMATY_OFFSET_HOURS * 60 * 60 * 1000);
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth(), day: shifted.getUTCDate() };
}

function isAlmatySunday(start: Date) {
  const shifted = new Date(start.getTime() + ALMATY_OFFSET_HOURS * 60 * 60 * 1000);
  return shifted.getUTCDay() === 0;
}

/**
 * Free 30-minute demo slots in Asia/Almaty working hours (10:00–19:00, no Sunday).
 * Automatic booking uses the first slot at least one hour from now.
 */
export function generateOpenSlots(params: {
  from: Date;
  days?: number;
  busy?: TimeInterval[];
  now?: Date;
  durationMinutes?: number;
}) {
  const days = params.days ?? 7;
  const busy = params.busy ?? [];
  const now = params.now ?? new Date();
  const duration = (params.durationMinutes ?? SLOT_MINUTES) * 60 * 1000;
  const { year, month, day } = almatyYmd(params.from);
  const slots: Date[] = [];

  for (let offset = 0; offset < days; offset += 1) {
    for (let hour = WORK_START_HOUR; hour < WORK_END_HOUR; hour += 1) {
      for (let minute = 0; minute < 60; minute += SLOT_MINUTES) {
        const start = slotFromAlmaty(year, month, day + offset, hour, minute);
        const end = new Date(start.getTime() + duration);
        if (isAlmatySunday(start)) continue;
        if (start.getTime() < now.getTime() + AUTO_BUFFER_MS) continue;
        if (busy.some((block) => overlaps({ start, end }, block))) continue;
        slots.push(start);
      }
    }
  }
  return slots;
}

export function nextAutoSlot(params: { busy?: TimeInterval[]; now?: Date; days?: number }) {
  const now = params.now ?? new Date();
  return generateOpenSlots({ from: now, days: params.days ?? 14, busy: params.busy, now })[0] ?? null;
}
