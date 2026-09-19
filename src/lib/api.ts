import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSession, type SessionUser } from "./auth";
import { prisma } from "./db";
import { canManageSettings, type Role } from "./rbac";
import { clientIp, rateLimit } from "./rate-limit";

const API_LIMIT = Number(process.env.API_RATE_LIMIT || 600);
const API_WINDOW_SEC = 60;

export class RateLimitError extends Error {
  status = 429;
  constructor(public retryAfter: number) {
    super("RATE_LIMIT");
  }
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw Object.assign(new Error("UNAUTHORIZED"), { status: 401 });
  }
  const live = await prisma.user.findUnique({
    where: { id: session.id },
    select: { isActive: true, email: true, name: true, role: true },
  });
  if (!live?.isActive) {
    throw Object.assign(new Error("ACCOUNT_DISABLED"), { status: 403 });
  }
  const limit = await rateLimit(`api:user:${session.id}`, API_LIMIT, API_WINDOW_SEC);
  if (!limit.ok) {
    throw new RateLimitError(limit.retryAfter);
  }
  return { ...session, email: live.email, name: live.name, role: live.role };
}

export function jsonError(err: unknown) {
  const status = (err as { status?: number }).status || 500;
  const message = (err as Error).message || "ERROR";
  if (status >= 500) {
    console.error(err);
  }
  const headers: Record<string, string> =
    err instanceof RateLimitError ? { "Retry-After": String(err.retryAfter || 60) } : {};
  return NextResponse.json({ error: message }, { status, headers });
}

export async function requireRole(roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw Object.assign(new Error("FORBIDDEN"), { status: 403 });
  }
  return user;
}

export async function requireAdmin() {
  return requireRole(["ADMIN"]);
}

export function isAdmin(user: SessionUser) {
  return canManageSettings(user.role) || user.role === "ADMIN";
}

export async function requestIp() {
  return clientIp(await headers());
}
