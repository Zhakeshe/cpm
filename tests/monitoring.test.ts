import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ previous: null as any, save: vi.fn(async () => ({})), notifications: vi.fn(async (_args: any) => ({ count: 1 })), admins: vi.fn(async () => [{ id: "admin" }]) }));
vi.mock("../src/lib/db", () => ({ prisma: {
  systemSetting: { findUnique: async () => mocks.previous },
  $transaction: async (fn: any) => fn({ systemSetting: { upsert: mocks.save }, user: { findMany: mocks.admins }, notification: { createMany: mocks.notifications } }),
} }));
import { monitorReportSchema, recordMonitorReport } from "../src/lib/monitoring";
const first = "2026-10-25T08:37:14.481828Z", second = "2026-10-25T08:38:14.481828Z";
beforeEach(() => { vi.clearAllMocks(); mocks.previous = null; });
describe("outage reporting", () => {
  it("accepts the host timestamp precision and rejects oversized reports", () => {
    expect(monitorReportSchema.safeParse({ checkedAt: first, checks: { disk: { ok: false, detail: "low" } }, incidents: [] }).success).toBe(true);
    expect(monitorReportSchema.safeParse({ checkedAt: first, checks: { disk: { ok: false, detail: "x".repeat(201) } }, incidents: [] }).success).toBe(false);
  });
  it("delivers outage and recovery transitions retained while CRM was unavailable", async () => {
    await recordMonitorReport({ checkedAt: second, checks: { app: { ok: true, detail: "running" } }, incidents: [{ at: first, issues: ["database"] }, { at: second, issues: [] }] });
    expect(mocks.notifications.mock.calls[0][0].data).toHaveLength(2);
    expect(mocks.save).toHaveBeenCalledTimes(1);
  });
  it("does not repeat notifications on every healthy check", async () => {
    const incidents = [{ at: first, issues: [] }]; mocks.previous = { value: { incidents } };
    await recordMonitorReport({ checkedAt: second, checks: { app: { ok: true, detail: "running" } }, incidents });
    expect(mocks.notifications).not.toHaveBeenCalled();
    expect(mocks.save).toHaveBeenCalledTimes(1);
  });
});
