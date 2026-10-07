import { describe, expect, it } from "vitest";
import { isManagerBlockedPath, VACUUM_PIPELINE_STAGES } from "../src/lib/pipeline-defaults";

describe("vacuum funnel", () => {
  it("has one won and one lost column", () => {
    expect(VACUUM_PIPELINE_STAGES.filter((s) => s.isWon)).toHaveLength(1);
    expect(VACUUM_PIPELINE_STAGES.filter((s) => s.isLost)).toHaveLength(1);
    expect(VACUUM_PIPELINE_STAGES.find((s) => s.slug === "thinking")?.name).toBe("Ойланамын");
    expect(VACUUM_PIPELINE_STAGES.find((s) => s.slug === "thinking")?.requiredFields).toEqual([]);
    expect(VACUUM_PIPELINE_STAGES.find((s) => s.slug === "paid")?.requiredFields).toContain("dealAmount");
    expect(VACUUM_PIPELINE_STAGES.filter((s) => ["not_needed", "contacted", "demo", "demo_done", "callback", "thinking"].includes(s.slug)).map((s) => s.name)).toEqual([
      "Керек Емес",
      "ТНБ",
      "Демо Бүгінге",
      "Демо Ертеңге",
      "Патом звонда",
      "Ойланамын",
    ]);
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
