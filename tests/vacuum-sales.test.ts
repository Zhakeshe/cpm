import { describe, expect, it } from "vitest";
import { totpCode, verifyTotp, generateTotpSecret } from "../src/lib/totp";
import { quoteTotal, vacuumDefaults } from "../src/lib/quotes";
import { CONTRACT_GIFTS, CONTRACT_PRICES, chosenDealAmount } from "../src/components/ContactContract";
import { contactWhere, parseContactFilters } from "../src/lib/contact-filters";

describe("totp", () => {
  it("accepts the current code and rejects a wrong one", () => {
    const secret = generateTotpSecret();
    const code = totpCode(secret, 1_700_000_000_000);
    expect(verifyTotp(secret, code, 1_700_000_000_000)).toBe(true);
    expect(verifyTotp(secret, "000000", 1_700_000_000_000)).toBe(false);
  });
});

describe("quotes", () => {
  it("sums vacuum line items", () => {
    expect(quoteTotal([{ title: "Pro 400", qty: 2, unitPrice: 89000 }, { title: "HEPA", qty: 1, unitPrice: 6900 }])).toBe(184900);
  });

  it("ships a default vacuum lineup", () => {
    expect(vacuumDefaults().some((p) => p.sku === "QC-PRO400")).toBe(true);
  });
});

describe("paper contract sheet", () => {
  it("offers the handwritten prices and gifts", () => {
    expect(CONTRACT_PRICES).toEqual([850000, 687000, 582000]);
    expect(CONTRACT_GIFTS.map((g) => g.id)).toEqual(["iron", "steam", "stain"]);
  });

  it("uses the first price marked as needed", () => {
    expect(chosenDealAmount(687000)).toBe(687000);
    expect(chosenDealAmount(null)).toBe(0);
    expect(chosenDealAmount(100)).toBe(0);
  });
});

describe("contact filters", () => {
  it("maps manager query param", () => {
    const filters = parseContactFilters(new URLSearchParams("manager=mgr1"));
    const where = contactWhere(filters);
    expect(where.AND).toEqual(expect.arrayContaining([{ managerId: "mgr1" }, { archivedAt: null }]));
  });

  it("maps stage query param onto pipelineStageId", () => {
    const filters = parseContactFilters(new URLSearchParams("stage=stg-new"));
    const where = contactWhere(filters);
    expect(where.AND).toEqual(expect.arrayContaining([{ pipelineStageId: "stg-new" }, { archivedAt: null }]));
  });

  it("filters createdAt by Almaty calendar days", () => {
    const filters = parseContactFilters(new URLSearchParams("date=2026-09-29"));
    const where = contactWhere(filters);
    expect(where.AND).toEqual(
      expect.arrayContaining([
        {
          createdAt: {
            gte: new Date("2026-09-29T00:00:00+05:00"),
            lte: new Date("2026-09-29T23:59:59.999+05:00"),
          },
        },
      ]),
    );
  });

  it("searches phone, address, and tags", () => {
    const filters = parseContactFilters(new URLSearchParams("q=Алматы"));
    const where = contactWhere(filters);
    const or = (where.AND as object[]).find((x) => "OR" in x) as { OR: object[] };
    expect(or.OR).toEqual(
      expect.arrayContaining([
        { address: { contains: "Алматы", mode: "insensitive" } },
        { city: { contains: "Алматы", mode: "insensitive" } },
        { phoneDisplay: { contains: "Алматы", mode: "insensitive" } },
        { tags: { some: { tag: { name: { contains: "Алматы", mode: "insensitive" } } } } },
      ]),
    );
  });
  it("builds a scoped archived-safe where", () => {
    const filters = parseContactFilters(new URLSearchParams("q=Алия&source=WEBSITE&minAmount=10000"));
    const where = contactWhere(filters, "mgr1");
    expect(where.AND).toEqual(
      expect.arrayContaining([
        { managerId: "mgr1" },
        { archivedAt: null },
        { source: "WEBSITE" },
      ]),
    );
  });
});
