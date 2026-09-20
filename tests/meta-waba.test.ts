import { describe, expect, it } from "vitest";
import {
  extractTemplateBody,
  humanizeTemplateName,
  mapMetaTemplateStatus,
  mappedTemplateFromMeta,
} from "../src/lib/meta-waba";

describe("Meta WABA template mapping", () => {
  it("maps Graph statuses onto CRM template states", () => {
    expect(mapMetaTemplateStatus("APPROVED")).toBe("APPROVED");
    expect(mapMetaTemplateStatus("PENDING")).toBe("PENDING");
    expect(mapMetaTemplateStatus("REJECTED")).toBe("REJECTED");
    expect(mapMetaTemplateStatus("DISABLED")).toBe("REJECTED");
    expect(mapMetaTemplateStatus("PAUSED")).toBe("REJECTED");
    expect(mapMetaTemplateStatus()).toBe("PENDING");
  });

  it("reads the BODY component and humanizes the Meta name", () => {
    expect(extractTemplateBody([{ type: "HEADER", text: "Hi" }, { type: "BODY", text: "Hello {{1}}" }])).toBe(
      "Hello {{1}}",
    );
    expect(humanizeTemplateName("hello_world")).toBe("Hello World");
  });

  it("turns a Graph template into an upsert row", () => {
    const mapped = mappedTemplateFromMeta({
      name: "hello_world",
      language: "en_US",
      status: "APPROVED",
      category: "UTILITY",
      components: [{ type: "BODY", text: "Welcome {{1}}" }],
    });
    expect(mapped).toMatchObject({
      metaName: "hello_world",
      language: "en_US",
      name: "Hello World",
      status: "APPROVED",
      isActive: true,
      body: "Welcome {{1}}",
      placeholders: ["{{1}}"],
    });
  });

  it("keeps pending verification templates inactive", () => {
    const mapped = mappedTemplateFromMeta({
      name: "sale_now_discount",
      language: "ru",
      status: "PENDING",
      category: "MARKETING",
      components: [{ type: "BODY", text: "{{1}}, скидка {{2}}" }],
    });
    expect(mapped?.status).toBe("PENDING");
    expect(mapped?.isActive).toBe(false);
  });

  it("ignores templates without a Meta name", () => {
    expect(mappedTemplateFromMeta({ language: "ru" })).toBeNull();
  });
});
