import { describe, expect, it } from "vitest";
import { isManagerBlockedPath, VACUUM_PIPELINE_STAGES } from "../src/lib/pipeline-defaults";

describe("vacuum funnel", () => {
  it("keeps the handwritten client-card stages", () => {
    expect(VACUUM_PIPELINE_STAGES.filter((s) => s.isWon)).toHaveLength(0);
    expect(VACUUM_PIPELINE_STAGES.filter((s) => s.isLost)).toHaveLength(1);
    expect(VACUUM_PIPELINE_STAGES.map((s) => s.name)).toEqual([
      "Новый лид",
      "Demo",
      "Керек емес",
      "ТНБ",
      "ОТКЛ",
      "Ойланатын",
      "Потом звонда",
    ]);
    expect(VACUUM_PIPELINE_STAGES.find((s) => s.slug === "not_needed")?.isLost).toBe(true);
  });

  it("blocks admin pages for managers", () => {
    expect(isManagerBlockedPath("/settings")).toBe(true);
    expect(isManagerBlockedPath("/catalog")).toBe(true);
    expect(isManagerBlockedPath("/calls")).toBe(true);
    expect(isManagerBlockedPath("/leads")).toBe(false);
    expect(isManagerBlockedPath("/messages")).toBe(false);
    expect(isManagerBlockedPath("/pipeline")).toBe(false);
  });
});
