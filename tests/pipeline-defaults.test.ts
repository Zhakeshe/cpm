import { describe, expect, it } from "vitest";
import { isManagerBlockedPath, VACUUM_PIPELINE_STAGES } from "../src/lib/pipeline-defaults";
import { LEAD_TAGS } from "../src/lib/catalog";

describe("vacuum funnel", () => {
  it("keeps the handwritten client-card stages", () => {
    expect(VACUUM_PIPELINE_STAGES.filter((s) => s.isWon)).toHaveLength(0);
    expect(VACUUM_PIPELINE_STAGES.filter((s) => s.isLost)).toHaveLength(0);
    expect(VACUUM_PIPELINE_STAGES.map((s) => s.name)).toEqual([
      "Новый лид",
      "Demo",
      "Керек емес",
      "ТНБ",
      "ОТКЛ",
      "Ойланамын",
      "Потом звонда",
    ]);
    expect(VACUUM_PIPELINE_STAGES.find((s) => s.slug === "not_needed")?.isLost).toBeFalsy();
    expect(VACUUM_PIPELINE_STAGES.some((s) => s.slug === "first_client")).toBe(false);
  });

  it("keeps the manager tags from the handwritten list", () => {
    expect(LEAD_TAGS.map((t) => t.name)).toEqual([
      "демо шыкты",
      "керек емес",
      "багасын былейын деп едым",
      "Кешке зв",
      "потом звондау керек",
    ]);
  });

  it("blocks admin pages for managers", () => {
    expect(isManagerBlockedPath("/settings")).toBe(true);
    expect(isManagerBlockedPath("/catalog")).toBe(true);
    expect(isManagerBlockedPath("/calls")).toBe(false);
    expect(isManagerBlockedPath("/leads")).toBe(false);
    expect(isManagerBlockedPath("/messages")).toBe(false);
    expect(isManagerBlockedPath("/pipeline")).toBe(false);
  });
});
