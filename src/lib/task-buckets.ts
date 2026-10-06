export const TASK_BUCKETS = [
  "overdueToday",
  "overdue1to3",
  "overdue4to7",
  "overdueOlder",
  "today",
  "tomorrow",
  "week",
  "later",
  "done",
] as const;

export type TaskBucket = (typeof TASK_BUCKETS)[number];

export function addUtcDays(date: Date, amount: number) {
  return new Date(date.getTime() + amount * 24 * 60 * 60 * 1000);
}

export function clientDayStart(now: Date, timezoneOffset: number) {
  const local = new Date(now.getTime() - timezoneOffset * 60_000);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() + timezoneOffset * 60_000);
}

export function taskBucketFilter(bucket: TaskBucket, now: Date, today: Date) {
  const tomorrow = addUtcDays(today, 1);
  const afterTomorrow = addUtcDays(today, 2);
  const afterWeek = addUtcDays(today, 8);
  if (bucket === "overdueToday") return { status: "OPEN" as const, dueAt: { gte: today, lt: now } };
  if (bucket === "overdue1to3") return { status: "OPEN" as const, dueAt: { gte: addUtcDays(today, -3), lt: today } };
  if (bucket === "overdue4to7") return { status: "OPEN" as const, dueAt: { gte: addUtcDays(today, -7), lt: addUtcDays(today, -3) } };
  if (bucket === "overdueOlder") return { status: "OPEN" as const, dueAt: { lt: addUtcDays(today, -7) } };
  if (bucket === "today") return { status: "OPEN" as const, dueAt: { gte: now, lt: tomorrow } };
  if (bucket === "tomorrow") return { status: "OPEN" as const, dueAt: { gte: tomorrow, lt: afterTomorrow } };
  if (bucket === "week") return { status: "OPEN" as const, dueAt: { gte: afterTomorrow, lt: afterWeek } };
  if (bucket === "later") return { status: "OPEN" as const, dueAt: { gte: afterWeek } };
  return { status: "DONE" as const };
}
