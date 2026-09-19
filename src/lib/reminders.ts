import type { PrismaClient } from "@prisma/client";
import { notifyUser } from "./notifications";

const MEETING_REMINDER_MINUTES = 30;

/**
 * Runs on a timer in the worker: fires task reminders, flags overdue tasks once,
 * and warns managers shortly before a demo starts.
 */
export async function runReminders(db: PrismaClient, now = new Date()) {
  const [taskReminders, overdueTasks, upcomingMeetings] = await Promise.all([
    db.task.findMany({
      where: { status: "OPEN", reminderSentAt: null, reminderAt: { not: null, lte: now } },
      include: { contact: { select: { firstName: true, lastName: true, phoneDisplay: true } } },
      take: 200,
    }),
    db.task.findMany({
      where: { status: "OPEN", overdueNotifiedAt: null, dueAt: { lt: now } },
      include: { contact: { select: { firstName: true, phoneDisplay: true } } },
      take: 200,
    }),
    db.meeting.findMany({
      where: {
        status: "SCHEDULED",
        reminderSentAt: null,
        startsAt: { gt: now, lte: new Date(now.getTime() + MEETING_REMINDER_MINUTES * 60 * 1000) },
      },
      include: { contact: { select: { firstName: true, lastName: true } } },
      take: 200,
    }),
  ]);

  for (const task of taskReminders) {
    await notifyUser(db, {
      userId: task.managerId,
      type: "NEW_TASK",
      title: "Напоминание по задаче",
      body: `${task.description}${task.contact ? ` — ${task.contact.firstName} ${task.contact.phoneDisplay}` : ""}`,
      data: { taskId: task.id, contactId: task.contactId },
    });
    await db.task.update({ where: { id: task.id }, data: { reminderSentAt: now } });
  }

  for (const task of overdueTasks) {
    await notifyUser(db, {
      userId: task.managerId,
      type: "OVERDUE_TASK",
      title: "Задача просрочена",
      body: `${task.description}${task.contact ? ` — ${task.contact.firstName}` : ""}`,
      data: { taskId: task.id, contactId: task.contactId },
    });
    await db.task.update({ where: { id: task.id }, data: { overdueNotifiedAt: now } });
  }

  for (const meeting of upcomingMeetings) {
    const minutes = Math.max(1, Math.round((meeting.startsAt.getTime() - now.getTime()) / 60000));
    await notifyUser(db, {
      userId: meeting.managerId,
      type: "MEETING_ASSIGNED",
      title: `Демо через ${minutes} мин.`,
      body: meeting.contact ? `${meeting.contact.firstName} ${meeting.contact.lastName}` : meeting.comment,
      data: { meetingId: meeting.id, contactId: meeting.contactId },
    });
    await db.meeting.update({ where: { id: meeting.id }, data: { reminderSentAt: now } });
  }

  return {
    taskReminders: taskReminders.length,
    overdueTasks: overdueTasks.length,
    meetingReminders: upcomingMeetings.length,
  };
}
