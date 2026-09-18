import { describe, expect, it } from "vitest";
import { rateLimit, clientIp } from "../src/lib/rate-limit";

describe("rate limiting", () => {
  it("blocks once the limit is exceeded inside the window", async () => {
    const key = `test-${Math.random()}`;
    const first = await rateLimit(key, 2, 60);
    const second = await rateLimit(key, 2, 60);
    const third = await rateLimit(key, 2, 60);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(third.ok).toBe(false);
    expect(third.retryAfter).toBeGreaterThan(0);
  });

  it("counts different keys independently", async () => {
    const a = `test-a-${Math.random()}`;
    const b = `test-b-${Math.random()}`;
    await rateLimit(a, 1, 60);
    const blockedA = await rateLimit(a, 1, 60);
    const freshB = await rateLimit(b, 1, 60);

    expect(blockedA.ok).toBe(false);
    expect(freshB.ok).toBe(true);
  });

  it("reads the client ip from proxy headers", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" });
    expect(clientIp(headers)).toBe("203.0.113.7");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
