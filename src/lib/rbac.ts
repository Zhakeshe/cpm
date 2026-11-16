export type Role = "ADMIN" | "MANAGER" | "SUPERVISOR" | "OPERATOR" | "OBSERVER";

export const ALL_ROLES: Role[] = ["ADMIN", "MANAGER", "SUPERVISOR", "OPERATOR", "OBSERVER"];

export function isReadOnly(role: Role | string): boolean {
  return role === "OBSERVER";
}

export function observerCanRequest(method: string, pathname: string): boolean {
  if (["/api/auth/login", "/api/auth/logout", "/api/auth/forgot", "/api/auth/reset"].includes(pathname)) return true;
  if (!["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())) return false;
  return !["/api/sip", "/api/export", "/api/settings", "/api/wazzup", "/api/meta/waba", "/api/webhook-events", "/api/whatsapp/greeting", "/api/audit", "/api/monitoring"]
    .some(path => pathname === path || pathname.startsWith(path + "/"));
}

export function canSeeAllRecords(role: Role): boolean {
  return role === "ADMIN" || role === "SUPERVISOR" || role === "OBSERVER";
}

export function canManageSettings(role: Role): boolean {
  return role === "ADMIN";
}

export function canManageUsers(role: Role): boolean {
  return role === "ADMIN";
}

export function canReassignManager(role: Role): boolean {
  return role === "ADMIN" || role === "SUPERVISOR";
}

export function canListenAllRecordings(role: Role): boolean {
  return canSeeAllRecords(role);
}

export function canDownloadRecordings(role: Role): boolean {
  return role === "ADMIN";
}

export function scopeManagerId(role: Role, userId: string): string | undefined {
  return canSeeAllRecords(role) ? undefined : userId;
}

export function assertRole(role: Role, allowed: Role[]): void {
  if (!allowed.includes(role)) {
    const err = new Error("FORBIDDEN");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
}
