export type Role = "ADMIN" | "MANAGER" | "SUPERVISOR" | "OPERATOR";

export const ALL_ROLES: Role[] = ["ADMIN", "MANAGER", "SUPERVISOR", "OPERATOR"];

export function canSeeAllRecords(role: Role): boolean {
  return role === "ADMIN" || role === "SUPERVISOR";
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
  return role === "ADMIN" || role === "SUPERVISOR";
}

export function canDownloadRecordings(role: Role): boolean {
  return role === "ADMIN";
}

export function scopeManagerId(role: Role, userId: string): string | undefined {
  return canSeeAllRecords(role) ? undefined : userId;
}

/** Managers only see themselves; admins may pass ?manager= to filter one person. */
export function requestedManagerId(role: Role, userId: string, requested?: string | null): string | undefined {
  const scoped = scopeManagerId(role, userId);
  if (scoped) return scoped;
  return requested || undefined;
}

export function assertRole(role: Role, allowed: Role[]): void {
  if (!allowed.includes(role)) {
    const err = new Error("FORBIDDEN");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
}
