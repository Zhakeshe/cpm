import { describe, expect, it, vi } from "vitest";
import { idempotent } from "../src/lib/idempotency";
import type { PrismaClient } from "@prisma/client";

function database() {
  const rows = new Map<string, any>();
  return { operationRequest: {
    create: vi.fn(async ({ data }: any) => { if (rows.has(data.id)) throw { code: "P2002" }; rows.set(data.id, { ...data, state: "PENDING" }); }),
    findUnique: vi.fn(async ({ where }: any) => rows.get(where.id)),
    update: vi.fn(async ({ where, data }: any) => { Object.assign(rows.get(where.id), data); }),
  } } as unknown as PrismaClient;
}
const key = "test-request-key-12345";
describe("durable request claims", () => {
  it("replays a completed send without sending twice", async () => {
    const db = database(), send = vi.fn(async () => ({ id: "message-1" }));
    expect(await idempotent(db, "user", "send", key, { text: "hello" }, send)).toEqual({ id: "message-1" });
    expect(await idempotent(db, "user", "send", key, { text: "hello" }, send)).toEqual({ id: "message-1" });
    expect(send).toHaveBeenCalledTimes(1);
  });
  it("rejects a concurrent second request while the provider is still responding", async () => {
    const db = database(); let finish!: (v: object) => void;
    const send = vi.fn(() => new Promise<object>(resolve => { finish = resolve; }));
    const first = idempotent(db, "u", "send", key, {}, send);
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    await expect(idempotent(db, "u", "send", key, {}, send)).rejects.toThrow("ACTION_IN_PROGRESS");
    finish({ id: "accepted" }); await first;
    expect(send).toHaveBeenCalledTimes(1);
  });
  it("does not retry when a provider may have accepted a send before a timeout", async () => {
    const db = database(), send = vi.fn(async () => { throw new Error("timeout"); });
    await expect(idempotent(db, "u", "send", key, {}, send)).rejects.toThrow("timeout");
    await expect(idempotent(db, "u", "send", key, {}, send)).rejects.toThrow("ACTION_UNCERTAIN");
    expect(send).toHaveBeenCalledTimes(1);
  });
  it("isolates users and rejects a key reused with changed payload", async () => {
    const db = database(), send = vi.fn(async () => ({ ok: true }));
    await idempotent(db, "u", "send", key, { text: "a" }, send);
    await expect(idempotent(db, "u", "send", key, { text: "b" }, send)).rejects.toThrow("IDEMPOTENCY_CONFLICT");
    await idempotent(db, "other", "send", key, { text: "b" }, send);
    expect(send).toHaveBeenCalledTimes(2);
  });
  it("fails closed when claims cannot be persisted", async () => {
    const db = database(), send = vi.fn();
    vi.mocked(db.operationRequest.create).mockRejectedValueOnce(new Error("database unavailable"));
    await expect(idempotent(db, "u", "send", key, {}, send)).rejects.toThrow("database unavailable");
    expect(send).not.toHaveBeenCalled();
  });
});
