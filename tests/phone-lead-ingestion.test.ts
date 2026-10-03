import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { ingestContact } from "../src/lib/contacts";

describe("new phone callers", () => {
  it("creates one contact and lead with the routed manager, reusing normalized numbers on retry", async () => {
    let contact: Record<string, unknown> | null = null;
    const db = {
      contact: {
        findUnique: vi.fn(async () => contact),
        create: vi.fn(async ({ data }) => {
          contact = { id: "caller", ...data, manager: { isActive: true } };
          return contact;
        }),
        update: vi.fn(),
      },
      pipelineStage: { findFirst: vi.fn(async () => ({ id: "new-stage" })) },
      lead: { create: vi.fn(async () => ({ id: "lead-1" })) },
      activity: { create: vi.fn() },
    };
    const input = { phone: "+7 776 201 07 02", source: "PHONE_CALL" as const, newContactManagerId: "routed-manager" };
    const created = await ingestContact(db as unknown as PrismaClient, input);
    const retried = await ingestContact(db as unknown as PrismaClient, { ...input, phone: "87762010702" });
    expect(created.createdLead).toBe(true);
    expect(retried.createdLead).toBe(false);
    expect(retried.contactId).toBe(created.contactId);
    expect(db.contact.create).toHaveBeenCalledTimes(1);
    expect(db.lead.create).toHaveBeenCalledTimes(1);
    expect(db.contact.create).toHaveBeenCalledWith({ data: expect.objectContaining({ phoneNormalized: "77762010702", managerId: "routed-manager" }) });
    expect(db.lead.create).toHaveBeenCalledWith({ data: expect.objectContaining({ managerId: "routed-manager", source: "PHONE_CALL" }) });
  });
});
