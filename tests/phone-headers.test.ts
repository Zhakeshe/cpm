import { expect, it } from "vitest";
import config from "../next.config";

it("permits only the same-origin phone frame while other CRM routes retain DENY", async () => {
  const rules = await config.headers!();
  const general = rules.find((rule) => rule.source === "/:path*")!;
  const phone = rules.find((rule) => rule.source === "/api/sip/widget")!;
  expect(general.headers).toContainEqual({ key: "X-Frame-Options", value: "DENY" });
  expect(phone.headers).toContainEqual({ key: "X-Frame-Options", value: "SAMEORIGIN" });
  expect(phone.headers).toContainEqual({ key: "Content-Security-Policy", value: "frame-ancestors 'self'" });
  expect(phone.headers).toContainEqual({ key: "Cache-Control", value: "private, no-store" });
  expect(rules.indexOf(phone)).toBeGreaterThan(rules.indexOf(general));
});
