export type ManagerCandidate = {
  id: string;
  isActive: boolean;
  acceptsNewLeads: boolean;
  isOnline: boolean;
};

export function eligibleManagers(managers: ManagerCandidate[]): ManagerCandidate[] {
  return managers.filter((m) => m.isActive && m.acceptsNewLeads && m.isOnline);
}

/**
 * Round-robin: pick the next manager after lastAssignedId.
 * Managers are processed in stable id order to keep assignment deterministic.
 */
export function pickRoundRobinManager(
  managers: ManagerCandidate[],
  lastAssignedId: string | null,
): ManagerCandidate | null {
  const pool = eligibleManagers(managers).sort((a, b) => a.id.localeCompare(b.id));
  if (pool.length === 0) return null;
  if (!lastAssignedId) return pool[0];
  const idx = pool.findIndex((m) => m.id === lastAssignedId);
  if (idx === -1) return pool[0];
  return pool[(idx + 1) % pool.length];
}

export function shouldReassignExistingContact(
  existingManagerId: string | null,
  existingManagerActive: boolean | null,
): boolean {
  if (!existingManagerId) return true;
  if (existingManagerActive === false) return true;
  return false;
}
