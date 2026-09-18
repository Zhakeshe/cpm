import type { NotificationType, PrismaClient } from "@prisma/client";
import { emitToUser } from "./realtime";

export async function notifyUser(
  db: PrismaClient,
  data: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: object;
  },
) {
  const n = await db.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      body: data.body,
      data: data.data || {},
    },
  });
  emitToUser(data.userId, "notification", {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
  });
  return n;
}

export async function notifyAdmins(
  db: PrismaClient,
  data: Omit<Parameters<typeof notifyUser>[1], "userId">,
) {
  const admins = await db.user.findMany({
    where: { role: "ADMIN", isActive: true },
    select: { id: true },
  });
  await Promise.all(admins.map((a) => notifyUser(db, { ...data, userId: a.id })));
}
