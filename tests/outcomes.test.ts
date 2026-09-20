import { describe, expect, it } from "vitest";
import { normalizeOutcomeReason, OutcomeReasonRequiredError } from "../src/lib/outcomes";

describe("deal outcomes", () => {
  it("keeps known won and lost reasons", () => {
    expect(normalizeOutcomeReason("LOST", "price")).toBe("price");
    expect(normalizeOutcomeReason("WON", "paid_full")).toBe("paid_full");
  });

  it("allows a short custom reason and rejects empty close", () => {
    expect(normalizeOutcomeReason("LOST", "  нет бюджета  ")).toBe("нет бюджета");
    expect(normalizeOutcomeReason("WON", "   ")).toBeNull();
    expect(new OutcomeReasonRequiredError().message).toBe("OUTCOME_REASON_REQUIRED");
  });
});
