import { describe, expect, it } from "vitest";
import { clientDayStart, taskBucketFilter } from "@/lib/task-buckets";

describe("task time buckets", () => {
  const now = new Date("2026-10-06T08:30:00.000Z");
  const today = clientDayStart(now, -300);

  it("uses the user's timezone for the day boundary", () => {
    expect(today.toISOString()).toBe("2026-10-05T19:00:00.000Z");
  });

  it("shows tasks in the today list only after their deadline", () => {
    expect(taskBucketFilter("overdueToday", now, today)).toEqual({ status: "OPEN", dueAt: { gte: today, lt: now } });
    expect(taskBucketFilter("today", now, today)).toEqual({
      status: "OPEN",
      dueAt: { lt: now },
    });
  });

  it("creates non-overlapping overdue age ranges", () => {
    expect(taskBucketFilter("overdue1to3", now, today).dueAt).toEqual({
      gte: new Date("2026-10-02T19:00:00.000Z"),
      lt: today,
    });
    expect(taskBucketFilter("overdue4to7", now, today).dueAt).toEqual({
      gte: new Date("2026-09-28T19:00:00.000Z"),
      lt: new Date("2026-10-02T19:00:00.000Z"),
    });
    expect(taskBucketFilter("overdueOlder", now, today).dueAt).toEqual({ lt: new Date("2026-09-28T19:00:00.000Z") });
  });
});
