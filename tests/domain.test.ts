import { describe, expect, it } from "vitest";
import { displayPhone, normalizePhone, phonesMatch } from "../src/lib/phone";
import { eligibleManagers, pickRoundRobinManager, shouldReassignExistingContact } from "../src/lib/assignment";
import { canSeeAllRecords, canManageSettings, requestedManagerId, scopeManagerId } from "../src/lib/rbac";
import { placeholdersOf, renderTemplate } from "../src/lib/templates";
import { whatsappMediaGraphBody } from "../src/lib/whatsapp";
import { dueAtForPreset, followUpReason, isOnFollowUpQueue } from "../src/lib/follow-ups";

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
    expect(requestedManagerId("ADMIN", "admin", "mgr1")).toBe("mgr1");
    expect(requestedManagerId("MANAGER", "u1", "mgr1")).toBe("u1");
    expect(requestedManagerId("ADMIN", "admin", "")).toBeUndefined();
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

describe("follow-up queue", () => {
  const now = new Date("2026-09-20T12:00:00.000Z");

  it("puts imported or website leads without a real touch on the list", () => {
    expect(
      isOnFollowUpQueue(
        { status: "NEW", lastContactAt: now, hasOpenTask: false, hasMessages: false, hasCalls: false },
        now,
      ),
    ).toBe(true);
    expect(followUpReason({ hasMessages: false, hasCalls: false })).toBe("never");
  });

  it("skips won deals, open tasks, and recent WhatsApp conversations", () => {
    expect(
      isOnFollowUpQueue(
        { status: "WON", lastContactAt: null, hasOpenTask: false, hasMessages: false, hasCalls: false },
        now,
      ),
    ).toBe(false);
    expect(
      isOnFollowUpQueue(
        { status: "NEW", lastContactAt: null, hasOpenTask: true, hasMessages: false, hasCalls: false },
        now,
      ),
    ).toBe(false);
    expect(
      isOnFollowUpQueue(
        { status: "IN_PROGRESS", lastContactAt: now, hasOpenTask: false, hasMessages: true, hasCalls: false },
        now,
      ),
    ).toBe(false);
  });

  it("flags clients whose last touch is older than three days", () => {
    const old = new Date("2026-09-10T12:00:00.000Z");
    expect(
      isOnFollowUpQueue(
        { status: "IN_PROGRESS", lastContactAt: old, hasOpenTask: false, hasMessages: true, hasCalls: false },
        now,
      ),
    ).toBe(true);
    expect(followUpReason({ hasMessages: true, hasCalls: false })).toBe("stale");
  });

  it("schedules today in three hours and later presets at 10:00", () => {
    const today = dueAtForPreset("today", now);
    expect(today.getTime() - now.getTime()).toBe(3 * 60 * 60 * 1000);
    const tomorrow = dueAtForPreset("tomorrow", now);
    expect(tomorrow.getHours()).toBe(10);
    expect(tomorrow.getDate()).toBe(now.getDate() + 1);
    expect(dueAtForPreset("in3days", now).getDate()).toBe(now.getDate() + 3);
  });
});
