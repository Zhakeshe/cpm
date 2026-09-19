import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export const prisma = new PrismaClient();

export async function resetDatabase() {
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.activity.deleteMany(),
    prisma.callRecording.deleteMany(),
    prisma.call.deleteMany(),
    prisma.message.deleteMany(),
    prisma.messageTemplate.deleteMany(),
    prisma.conversation.deleteMany(),
    prisma.task.deleteMany(),
    prisma.meeting.deleteMany(),
    prisma.managerChange.deleteMany(),
    prisma.lead.deleteMany(),
    prisma.contact.deleteMany(),
    prisma.webhookEvent.deleteMany(),
    prisma.passwordResetToken.deleteMany(),
    prisma.user.deleteMany(),
    prisma.pipelineStage.deleteMany(),
    prisma.pipeline.deleteMany(),
    prisma.managerAssignmentState.deleteMany(),
  ]);
}

export async function seedBaseline(managerCount = 3) {
  const pipeline = await prisma.pipeline.create({
    data: { name: "Основная воронка", isDefault: true },
  });
  await prisma.pipelineStage.createMany({
    data: [
      { pipelineId: pipeline.id, slug: "new", name: "Новый лид", order: 1 },
      { pipelineId: pipeline.id, slug: "contacted", name: "Связались", order: 2 },
      { pipelineId: pipeline.id, slug: "paid", name: "Оплатил", order: 3, isWon: true },
    ],
  });
  const passwordHash = await bcrypt.hash("Manager123!", 4);
  const managers = [];
  for (let i = 0; i < managerCount; i++) {
    managers.push(
      await prisma.user.create({
        data: {
          // ids drive round-robin ordering, so keep them predictable
          id: `mgr-${i + 1}`,
          email: `manager${i + 1}@test.local`,
          name: `Manager ${i + 1}`,
          passwordHash,
          role: "MANAGER",
          sipExtension: String(101 + i),
        },
      }),
    );
  }
  const admin = await prisma.user.create({
    data: {
      id: "admin-1",
      email: "admin@test.local",
      name: "Admin",
      passwordHash,
      role: "ADMIN",
    },
  });
  await prisma.managerAssignmentState.create({ data: { id: "global" } });
  return { pipeline, managers, admin };
}

export function whatsappPayload(params: {
  messageId: string;
  from: string;
  text: string;
  name?: string;
  timestamp?: number;
}) {
  return {
    entry: [
      {
        changes: [
          {
            value: {
              contacts: [{ wa_id: params.from, profile: { name: params.name || "WA User" } }],
              messages: [
                {
                  id: params.messageId,
                  from: params.from,
                  timestamp: String(params.timestamp || Math.floor(Date.now() / 1000)),
                  type: "text",
                  text: { body: params.text },
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

export function whatsappStatusPayload(messageId: string, status: string) {
  return {
    entry: [
      {
        changes: [
          {
            value: {
              statuses: [{ id: messageId, status, timestamp: String(Math.floor(Date.now() / 1000)) }],
            },
          },
        ],
      },
    ],
  };
}
