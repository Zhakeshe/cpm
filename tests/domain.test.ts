import { describe, expect, it } from "vitest";
import { displayPhone, normalizePhone, phonesMatch } from "../src/lib/phone";
import { eligibleManagers, pickRoundRobinManager, shouldReassignExistingContact } from "../src/lib/assignment";
import { canSeeAllRecords, canManageSettings, scopeManagerId } from "../src/lib/rbac";
import { placeholdersOf, renderTemplate } from "../src/lib/templates";
import { whatsappMediaGraphBody } from "../src/lib/whatsapp";

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
    { id: "a", isActive: true, acceptsNewLeads: true, isOnline: true },
    { id: "b", isActive: true, acceptsNewLeads: true, isOnline: true },
    { id: "c", isActive: true, acceptsNewLeads: false, isOnline: true },
    { id: "d", isActive: false, acceptsNewLeads: true, isOnline: true },
    { id: "e", isActive: true, acceptsNewLeads: true, isOnline: false },
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
    expect(shouldReassignExistingContact("a", false)).toBe(true);
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

describe("whatsapp templates and media", () => {
  it("collects numbered placeholders", () => {
    expect(placeholdersOf("{{1}}, скидка {{2}} и {{1}}")).toEqual(["{{1}}", "{{2}}"]);
    expect(renderTemplate("{{1}}, скидка {{2}}", ["Алия", "20%"])).toBe("Алия, скидка 20%");
  });

  it("sends photos as image and voice notes as audio with voice=true", () => {
    expect(
      whatsappMediaGraphBody({ to: "77765079188", type: "IMAGE", mediaId: "mid-1", caption: "фото" }),
    ).toEqual({
      to: "77765079188",
      type: "image",
      image: { id: "mid-1", caption: "фото" },
    });
    expect(whatsappMediaGraphBody({ to: "77765079188", type: "VOICE", mediaId: "mid-2", voiceNote: true })).toEqual({
      to: "77765079188",
      type: "audio",
      audio: { id: "mid-2", voice: true },
    });
  });
});
