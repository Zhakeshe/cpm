import { describe, expect, it } from "vitest";
import { contactWhere } from "../src/lib/contact-filters";

describe("contact filters", () => {
  it("searches client metadata and normalized phone", () => {
    const where = contactWhere({ q: "+7 701 123" }) as { AND: Array<{ OR?: unknown[] }> };
    const search = where.AND.find((part) => part.OR)?.OR || [];

    expect(search).toContainEqual({ address: { contains: "+7 701 123", mode: "insensitive" } });
    expect(search).toContainEqual({ manager: { name: { contains: "+7 701 123", mode: "insensitive" } } });
    expect(search).toContainEqual({ phoneNormalized: { contains: "7701123" } });
  });

  it("uses an exclusive end for a single-day range", () => {
    const where = contactWhere({ from: "2026-10-05T00:00:00.000Z", to: "2026-10-06T00:00:00.000Z" }) as {
      AND: Array<{ createdAt?: { gte: Date; lt: Date } }>;
    };
    const createdAt = where.AND.find((part) => part.createdAt)?.createdAt;

    expect(createdAt?.gte.toISOString()).toBe("2026-10-05T00:00:00.000Z");
    expect(createdAt?.lt.toISOString()).toBe("2026-10-06T00:00:00.000Z");
  });
});
