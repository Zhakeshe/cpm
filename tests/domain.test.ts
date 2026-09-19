import { describe, expect, it } from "vitest";
import { displayPhone, normalizePhone, phonesMatch } from "../src/lib/phone";
import { eligibleManagers, pickRoundRobinManager, shouldReassignExistingContact } from "../src/lib/assignment";
import { canSeeAllRecords, canManageSettings, scopeManagerId } from "../src/lib/rbac";

describe("phone normalization", () => {
  it("treats formatted numbers as one identity", () => {
    expect(normalizePhone("+7 747 123 45 67")).toBe("77471234567");
    expect(normalizePhone("77471234567")).toBe("77471234567");
    expect(normalizePhone("8 (747) 123-45-67")).toBe("77471234567");
    expect(phonesMatch("+7 747 123 45 67", "77471234567")).toBe(true);
    expect(displayPhone("77471234567")).toContain("747");
  });
});

describe("round robin", () => {
  const managers = [
    { id: "a", isActive: true, acceptsNewLeads: true },
    { id: "b", isActive: true, acceptsNewLeads: true },
    { id: "c", isActive: true, acceptsNewLeads: false },
    { id: "d", isActive: false, acceptsNewLeads: true },
  ];

  it("skips managers who are OFF or inactive", () => {
    expect(eligibleManagers(managers).map((m) => m.id)).toEqual(["a", "b"]);
  });

  it("rotates through eligible managers", () => {
    const first = pickRoundRobinManager(managers, null);
    expect(first?.id).toBe("a");
    const second = pickRoundRobinManager(managers, "a");
    expect(second?.id).toBe("b");
    const third = pickRoundRobinManager(managers, "b");
    expect(third?.id).toBe("a");
  });

  it("does not reassign existing customer with active manager", () => {
    expect(shouldReassignExistingContact("a", true)).toBe(false);
    expect(shouldReassignExistingContact(null, null)).toBe(true);
  });
});

describe("rbac", () => {
  it("gives admin global access and manager scoped access", () => {
    expect(canSeeAllRecords("ADMIN")).toBe(true);
    expect(canSeeAllRecords("MANAGER")).toBe(false);
    expect(canManageSettings("MANAGER")).toBe(false);
    expect(scopeManagerId("MANAGER", "u1")).toBe("u1");
    expect(scopeManagerId("ADMIN", "u1")).toBeUndefined();
  });
});
