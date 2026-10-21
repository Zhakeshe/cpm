import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma, resetDatabase, seedBaseline } from "./helpers";
import { handleTelephonyEvent } from "../../src/lib/telephony";

describe("SIP телефония", () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedBaseline(2);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("входящий звонок с нового номера создаёт клиента, лид и звонок", async () => {
    await handleTelephonyEvent(prisma, {
      event: "call.started",
      callId: "call-100",
      direction: "INBOUND",
      from: "+7 701 555 11 22",
      to: "77270000000",
      status: "RINGING",
    });

    const contact = await prisma.contact.findUniqueOrThrow({ where: { phoneNormalized: "77015551122" } });
    expect(contact.source).toBe("PHONE_CALL");
    expect(await prisma.lead.count()).toBe(1);

    const call = await prisma.call.findUniqueOrThrow({ where: { externalCallId: "call-100" } });
    expect(call.direction).toBe("INBOUND");
    expect(call.contactId).toBe(contact.id);

    const notification = await prisma.notification.findFirstOrThrow({ where: { type: "INCOMING_CALL" } });
    expect(notification.userId).toBe(call.managerId);
  });

  it("завершение звонка обновляет ту же запись и сохраняет запись разговора", async () => {
    await handleTelephonyEvent(prisma, {
      event: "call.started",
      callId: "call-200",
      direction: "INBOUND",
      from: "77015551133",
      to: "77270000000",
      status: "RINGING",
    });
    await handleTelephonyEvent(prisma, {
      event: "call.ended",
      callId: "call-200",
      direction: "INBOUND",
      from: "77015551133",
      to: "77270000000",
      status: "ANSWERED",
      duration: 272,
      answerDuration: 260,
      recordingUrl: "https://pbx.example.com/rec/200.mp3",
    });

    expect(await prisma.call.count()).toBe(1);
    const call = await prisma.call.findUniqueOrThrow({ where: { externalCallId: "call-200" } });
    expect(call.status).toBe("ANSWERED");
    expect(call.duration).toBe(272);
    expect(call.recordingUrl).toBe("https://pbx.example.com/rec/200.mp3");
    expect(await prisma.callRecording.count({ where: { callId: call.id } })).toBe(1);
  });

  it("маршрутизирует звонок существующего клиента его менеджеру", async () => {
    await handleTelephonyEvent(prisma, {
      event: "call.started",
      callId: "call-300",
      direction: "INBOUND",
      from: "77015551144",
      to: "77270000000",
    });
    const first = await prisma.call.findUniqueOrThrow({ where: { externalCallId: "call-300" } });
    const callbackStage = await prisma.pipelineStage.findUniqueOrThrow({
      where: { pipelineId_slug: { pipelineId: "default", slug: "callback" } },
    });
    await prisma.contact.update({
      where: { id: first.contactId! },
      data: { managerId: "mgr-2", pipelineStageId: callbackStage.id, status: "IN_PROGRESS" },
    });

    await handleTelephonyEvent(prisma, {
      event: "call.started",
      callId: "call-301",
      direction: "INBOUND",
      from: "77015551144",
      to: "77270000000",
    });

    const second = await prisma.call.findUniqueOrThrow({ where: { externalCallId: "call-301" } });
    const contact = await prisma.contact.findUniqueOrThrow({ where: { id: first.contactId! } });
    expect(second.managerId).toBe("mgr-2");
    expect(await prisma.contact.count()).toBe(1);
    expect(contact.pipelineStageId).toBe(callbackStage.id);
    expect(contact.status).toBe("IN_PROGRESS");
  });

  it("исходящий звонок привязывается к менеджеру по SIP-расширению", async () => {
    await handleTelephonyEvent(prisma, {
      event: "call.started",
      callId: "call-400",
      direction: "OUTBOUND",
      from: "102",
      to: "77015551155",
      managerExtension: "102",
    });

    const call = await prisma.call.findUniqueOrThrow({ where: { externalCallId: "call-400" } });
    expect(call.direction).toBe("OUTBOUND");
    expect(call.managerId).toBe("mgr-2");
    expect(await prisma.notification.count({ where: { type: "INCOMING_CALL" } })).toBe(0);
  });

  it("объединяет временный callback id с реальным pbx_call_id", async () => {
    await handleTelephonyEvent(prisma, {
      event: "call.started",
      callId: "zadarma-102-77015551188-1",
      direction: "OUTBOUND",
      from: "102",
      to: "77015551188",
      managerExtension: "102",
      status: "RINGING",
    });
    await handleTelephonyEvent(prisma, {
      event: "call.started",
      callId: "pbx-real-700",
      direction: "OUTBOUND",
      from: "102",
      to: "+7 701 555 11 88",
      managerExtension: "102",
      status: "RINGING",
    });

    expect(await prisma.call.count()).toBe(1);
    expect(await prisma.call.findUnique({ where: { externalCallId: "zadarma-102-77015551188-1" } })).toBeNull();
    expect(await prisma.call.findUnique({ where: { externalCallId: "pbx-real-700" } })).not.toBeNull();
    expect(await prisma.activity.count({ where: { type: "CALL_OUT" } })).toBe(1);
  });

  it("уведомляет о пропущенном звонке", async () => {
    await handleTelephonyEvent(prisma, {
      event: "call.started",
      callId: "call-500",
      direction: "INBOUND",
      from: "77015551166",
      to: "77270000000",
    });
    await handleTelephonyEvent(prisma, {
      event: "call.ended",
      callId: "call-500",
      direction: "INBOUND",
      from: "77015551166",
      to: "77270000000",
      status: "MISSED",
    });

    const missed = await prisma.notification.findFirst({ where: { type: "MISSED_CALL" } });
    expect(missed).not.toBeNull();
  });

  it("attaches a recording without creating a second contact", async () => {
    await handleTelephonyEvent(prisma, {
      event: "call.started",
      callId: "call-600",
      direction: "INBOUND",
      from: "77015551177",
      to: "77270000000",
    });
    await handleTelephonyEvent(prisma, {
      event: "call.recording",
      callId: "call-600",
      direction: "INBOUND",
      from: "",
      to: "",
      recordingUrl: "zadarma:rec-600",
    });
    expect(await prisma.contact.count()).toBe(1);
    const call = await prisma.call.findUniqueOrThrow({ where: { externalCallId: "call-600" } });
    expect(call.recordingUrl).toBe("zadarma:rec-600");
    expect(await prisma.callRecording.count({ where: { callId: call.id } })).toBe(1);
  });
});
