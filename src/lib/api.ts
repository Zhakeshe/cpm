import { NextResponse } from "next/server";
import { getSession, type SessionUser } from "./auth";
import { canManageSettings, type Role } from "./rbac";

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw Object.assign(new Error("UNAUTHORIZED"), { status: 401 });
  }
  return session;
}

export function jsonError(err: unknown) {
  const status = (err as { status?: number }).status || 500;
  const message = (err as Error).message || "ERROR";
  if (status >= 500 && message !== "UNAUTHORIZED" && message !== "FORBIDDEN") {
    console.error(err);
  }
  return NextResponse.json({ error: message }, { status: status === 500 && message === "FORBIDDEN" ? 403 : status });
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
