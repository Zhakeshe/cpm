import { describe, expect, it } from "vitest";
import { totpCode, verifyTotp, generateTotpSecret } from "../src/lib/totp";
import { quoteTotal, vacuumDefaults } from "../src/lib/quotes";
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

describe("contact filters", () => {
  it("maps stage query param onto pipelineStageId", () => {
    const filters = parseContactFilters(new URLSearchParams("stage=stg-new"));
    const where = contactWhere(filters);
    expect(where.AND).toEqual(expect.arrayContaining([{ pipelineStageId: "stg-new" }, { archivedAt: null }]));
  });

  it("filters createdAt by Almaty calendar days", () => {
    const filters = parseContactFilters(new URLSearchParams("from=2026-09-29&to=2026-09-29"));
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
