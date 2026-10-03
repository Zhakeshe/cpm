import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
const mocks = vi.hoisted(() => ({ ingest: vi.fn(), notify: vi.fn(), user: vi.fn(), admins: vi.fn() }));
vi.mock("../src/lib/contacts", () => ({ ingestContact: mocks.ingest }));
vi.mock("../src/lib/notifications", () => ({ notifyUser: mocks.notify }));
vi.mock("../src/lib/realtime", () => ({ emitToUser: mocks.user, emitToAdmins: mocks.admins }));
import { handleTelephonyEvent } from "../src/lib/telephony";
import { mapZadarmaNotify } from "../src/lib/zadarma";

function database() {
  let call: Record<string, unknown> | null = null;
  const db = {
    $transaction: vi.fn(async (fn) => fn(db)), $executeRaw: vi.fn(),
    call: {
      findUnique: vi.fn(async () => call),
      create: vi.fn(async ({ data }) => { call = { id: "call-1", ...data }; return call; }),
      update: vi.fn(async ({ data }) => { call = { ...call, ...Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)) }; return call; }),
    },
    user: { findFirst: vi.fn(async () => ({ id: "manager-1" })), findMany: vi.fn(async () => [{ id: "manager-1" }]) },
    activity: { create: vi.fn() },
    callRecording: { findFirst: vi.fn(async () => null), create: vi.fn(), update: vi.fn() },
  };
  return db;
}

beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv("SIP_ACCOUNTS_JSON", '{"101":{"username":"158925"}}');
  mocks.notify.mockImplementation(async (_db, data) => ({ id: "note-1", ...data }));
  mocks.ingest.mockResolvedValue({ contactId: "contact-1", managerId: "owner", createdContact: false });
});
afterEach(() => vi.unstubAllEnvs());

describe("provider event handling", () => {
  it("never emits incoming notification/UI for outbound and resolves manager by real SIP account", async () => {
    const db = database();
    const event = mapZadarmaNotify({ event: "NOTIFY_OUT_START", pbx_call_id: "provider-1", internal: "158925", destination: "77762010702" })!;
    const { call } = await handleTelephonyEvent(db as unknown as PrismaClient, event);
    expect(call?.managerId).toBe("manager-1");
    expect(mocks.ingest.mock.calls[0][1].phone).toBe("77762010702");
    expect(mocks.notify).not.toHaveBeenCalled();
    expect(mocks.user).toHaveBeenCalledWith("manager-1", "call:outgoing", expect.objectContaining({ direction: "OUTBOUND" }));
    expect(mocks.admins).not.toHaveBeenCalledWith("call:incoming", expect.anything());
  });
  it("deduplicates a retried start using the provider ID", async () => {
    const db = database();
    const event = mapZadarmaNotify({ event: "NOTIFY_OUT_START", pbx_call_id: "provider-1", internal: "158925", destination: "77762010702" })!;
    await handleTelephonyEvent(db as unknown as PrismaClient, event);
    await handleTelephonyEvent(db as unknown as PrismaClient, event);
    expect(db.call.create).toHaveBeenCalledTimes(1);
    expect(db.activity.create).toHaveBeenCalledTimes(1);
    expect(mocks.user).toHaveBeenCalledTimes(1);
  });
  it("keeps inbound direction/contact when ANSWER includes internal and destination", async () => {
    const db = database();
    await handleTelephonyEvent(db as unknown as PrismaClient, mapZadarmaNotify({ event: "NOTIFY_START", pbx_call_id: "p", caller_id: "77762010702", called_did: "77172696753" })!);
    const { call } = await handleTelephonyEvent(db as unknown as PrismaClient, mapZadarmaNotify({ event: "NOTIFY_ANSWER", pbx_call_id: "p", internal: "158925", caller_id: "77762010702", destination: "101" })!);
    expect(call?.direction).toBe("INBOUND"); expect(call?.toNumber).toBe("77172696753");
    expect(mocks.notify).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ type: "INCOMING_CALL" }), false);
    expect(mocks.ingest.mock.calls[1][1].phone).toBe("77762010702");
  });
  it("retries ambiguous out-of-order answers instead of creating an inbound call", async () => {
    const db = database();
    await expect(handleTelephonyEvent(db as unknown as PrismaClient, mapZadarmaNotify({ event: "NOTIFY_ANSWER", pbx_call_id: "p", destination: "101" })!)).rejects.toThrow("TELEPHONY_AWAITING_START");
    expect(db.call.create).not.toHaveBeenCalled(); expect(mocks.notify).not.toHaveBeenCalled();
  });
  it("late starts never resurrect completed calls and missed notifications are not duplicated", async () => {
    const db = database();
    const start = mapZadarmaNotify({ event: "NOTIFY_START", pbx_call_id: "p", caller_id: "77762010702", called_did: "77172696753" })!;
    const end = mapZadarmaNotify({ event: "NOTIFY_END", pbx_call_id: "p", caller_id: "77762010702", called_did: "77172696753", disposition: "no answer" })!;
    await handleTelephonyEvent(db as unknown as PrismaClient, start);
    await handleTelephonyEvent(db as unknown as PrismaClient, end);
    await handleTelephonyEvent(db as unknown as PrismaClient, end);
    const { call } = await handleTelephonyEvent(db as unknown as PrismaClient, start);
    expect(call?.status).toBe("NO_ANSWER"); expect(db.call.create).toHaveBeenCalledTimes(1);
    expect(mocks.notify.mock.calls.filter(([, data]) => data.type === "MISSED_CALL")).toHaveLength(1);
  });
});

it("publishes no UI event when the database transaction fails to commit", async () => {
  const db = database();
  db.$transaction.mockImplementation(async (fn) => { await fn(db); throw new Error("commit failed"); });
  const event = mapZadarmaNotify({ event: "NOTIFY_OUT_START", pbx_call_id: "p", internal: "158925", destination: "77762010702" })!;
  await expect(handleTelephonyEvent(db as unknown as PrismaClient, event)).rejects.toThrow("commit failed");
  expect(mocks.user).not.toHaveBeenCalled(); expect(mocks.admins).not.toHaveBeenCalled();
});

it("assigns a new caller to the manager resolved from the provider account", async () => {
  const db = database();
  mocks.ingest.mockResolvedValue({ contactId: "new-contact", managerId: "manager-1", createdContact: true });
  await handleTelephonyEvent(db as unknown as PrismaClient, mapZadarmaNotify({
    event: "NOTIFY_INTERNAL", pbx_call_id: "new-caller", internal: "158925",
    caller_id: "77762010702", called_did: "77172696753",
  })!);
  expect(mocks.ingest).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
    phone: "77762010702", source: "PHONE_CALL", newContactManagerId: "manager-1",
  }));
  expect(mocks.user).toHaveBeenCalledWith("manager-1", "lead:new", { contactId: "new-contact" });
});

it("retries an early recording and updates the call list when it is attached", async () => {
  const db = database();
  const recording = mapZadarmaNotify({ event: "NOTIFY_RECORD", pbx_call_id: "recorded", call_id_with_rec: "rec-1" })!;
  await expect(handleTelephonyEvent(db as unknown as PrismaClient, recording)).rejects.toThrow("TELEPHONY_AWAITING_START");
  await handleTelephonyEvent(db as unknown as PrismaClient, mapZadarmaNotify({
    event: "NOTIFY_START", pbx_call_id: "recorded", caller_id: "77762010702", called_did: "77172696753",
  })!);
  mocks.user.mockClear(); mocks.admins.mockClear(); mocks.ingest.mockClear();
  const { call } = await handleTelephonyEvent(db as unknown as PrismaClient, recording);
  expect(call?.recordingUrl).toBe("zadarma:rec-1");
  expect(mocks.ingest).not.toHaveBeenCalled();
  expect(mocks.user).toHaveBeenCalledWith("owner", "call:updated", { callId: "call-1" });
  expect(mocks.admins).toHaveBeenCalledWith("call:updated", { callId: "call-1" });
});
