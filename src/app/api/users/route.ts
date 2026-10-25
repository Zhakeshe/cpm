import { idempotent } from "@/lib/idempotency";
import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireAdmin, requireUser } from "@/lib/api";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { canManageUsers } from "@/lib/rbac";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    if (user.role === "MANAGER" || user.role === "OPERATOR") {
      return NextResponse.json(
        await prisma.user.findMany({
          where: { id: user.id },
          select: publicSelect(),
        }),
      );
    }
    const users = await prisma.user.findMany({
      where: user.role === "ADMIN" && req.nextUrl.searchParams.get("includeInactive") === "1" ? {} : { isActive: true },
      orderBy: { name: "asc" },
      select: publicSelect(),
    });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const withStats = await Promise.all(
      users.map(async (u) => {
        const [activeLeads, tasksToday, callsToday, sales] = await Promise.all([
          prisma.contact.count({ where: { managerId: u.id, archivedAt: null, status: { in: ["NEW", "IN_PROGRESS"] } } }),
          prisma.task.count({ where: { managerId: u.id, status: "OPEN", dueAt: { gte: today } } }),
          prisma.call.count({ where: { managerId: u.id, startedAt: { gte: today } } }),
          prisma.contact.count({ where: { managerId: u.id, status: "WON" } }),
        ]);
        return { ...u, activeLeads, tasksToday, callsToday, sales };
      }),
    );
    return NextResponse.json(withStats);
  } catch (err) {
    return jsonError(err);
  }
}

function publicSelect() {
  return {
    id: true,
    email: true,
    name: true,
    role: true,
    isActive: true,
    acceptsNewLeads: true,
    isOnline: true,
    sipExtension: true,
    lastSeenAt: true,
    createdAt: true,
  };
}

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "MANAGER", "SUPERVISOR", "OPERATOR"]).optional(),
  sipExtension: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const actor = await requireAdmin();
    const body = createSchema.parse(await req.json());
    return NextResponse.json(await idempotent(prisma, actor.id, "users", req.headers.get("Idempotency-Key"), body, async () => {
      const user = await prisma.user.create({
        data: {
          email: body.email.toLowerCase(),
          name: body.name,
          passwordHash: await hashPassword(body.password),
          role: body.role || "MANAGER",
          sipExtension: body.sipExtension,
        },
      });
      await prisma.auditLog.create({
        data: {
          actorId: actor.id,
          action: "user.create",
          entityType: "User",
          entityId: user.id,
          newValue: { email: user.email, role: user.role },
        },
      });
      return { id: user.id };
    }));
  } catch (err) {
    return jsonError(err);
  }
}

const patchSchema = z.object({
  id: z.string().min(1), isActive: z.boolean().optional(), confirmDisable: z.boolean().optional(),
  acceptsNewLeads: z.boolean().optional(), isOnline: z.boolean().optional(),
  role: z.enum(["ADMIN", "MANAGER", "SUPERVISOR", "OPERATOR"]).optional(),
  name: z.string().trim().min(1).optional(), password: z.string().min(8).optional(),
  sipExtension: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const actor = await requireUser();
    const body = patchSchema.parse(await req.json());
    if (!canManageUsers(actor.role) && body.id !== actor.id) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    const data: Record<string, unknown> = {};
    if (canManageUsers(actor.role)) {
      if (typeof body.isActive === "boolean") {
        if (body.id === actor.id && body.isActive === false) {
          return NextResponse.json({ error: "CANNOT_DISABLE_SELF" }, { status: 400 });
        }
        data.isActive = body.isActive;
      }
      if (typeof body.acceptsNewLeads === "boolean") data.acceptsNewLeads = body.acceptsNewLeads;
      if (typeof body.isOnline === "boolean") data.isOnline = body.isOnline;
      if (body.role) data.role = body.role;
      if (body.sipExtension !== undefined) data.sipExtension = body.sipExtension;
      if (body.name) data.name = body.name;
      if (typeof body.password === "string" && body.password.length >= 8) {
        data.passwordHash = await hashPassword(body.password);
      }
      if (data.isActive === false) {
        data.acceptsNewLeads = false;
        data.isOnline = false;
      }
    } else {
      if (typeof body.acceptsNewLeads === "boolean") data.acceptsNewLeads = body.acceptsNewLeads;
      if (typeof body.isOnline === "boolean") data.isOnline = body.isOnline;
    }
    if (data.isActive === false) {
      if (body.confirmDisable !== true) return NextResponse.json({ error: "CONFIRM_DISABLE_REQUIRED" }, { status: 409 });
      const target = await prisma.user.findUnique({ where: { id: body.id }, select: { role: true } });
      if (target?.role === "ADMIN") return NextResponse.json({ error: "CANNOT_DISABLE_ADMIN" }, { status: 409 });
    }
    if (data.isActive === true) {
      data.acceptsNewLeads = true;
      data.isOnline = false;
    }
    const auditValue = { ...data };
    delete auditValue.passwordHash;
    if (typeof body.password === "string" && body.password.length >= 8) {
      auditValue.passwordReset = true;
    }
    const updated = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({ where: { id: body.id }, data });
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "user.update",
          entityType: "User",
          entityId: body.id,
          newValue: auditValue as object,
        },
      });
      return updated;
    });
    return NextResponse.json({ id: updated.id });
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const actor = await requireAdmin();
    const body = z.object({ id: z.string().min(1), confirmDisable: z.literal(true) }).parse(await req.json());
    if (body.id === actor.id) {
      return NextResponse.json({ error: "CANNOT_DELETE_SELF" }, { status: 400 });
    }
    const target = await prisma.user.findUnique({ where: { id: body.id }, select: { id: true, email: true, role: true } });
    if (!target || target.role === "ADMIN") {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    await prisma.$transaction([
      prisma.user.update({
        where: { id: target.id },
        data: { isActive: false, acceptsNewLeads: false, isOnline: false },
      }),
      prisma.auditLog.create({
        data: {
          actorId: actor.id,
          action: "user.delete",
          entityType: "User",
          entityId: target.id,
          oldValue: { email: target.email, role: target.role, isActive: true },
          newValue: { isActive: false },
        },
      }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
