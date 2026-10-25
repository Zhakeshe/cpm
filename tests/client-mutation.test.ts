import { afterEach, describe, expect, it, vi } from "vitest";
import { mutationJson } from "../src/lib/client-api";
afterEach(() => vi.unstubAllGlobals());
describe("safe browser retries", () => {
  it("shares simultaneous submits and uses a new key for a later intentional send", async () => {
    let complete!: (r: Response) => void;
    const fetcher = vi.fn((_input: any, _init: any) => new Promise<Response>(r => { complete = r; }));
    vi.stubGlobal("fetch", fetcher);
    const a = mutationJson("/send-test-concurrent", { text: "hello" });
    const b = mutationJson("/send-test-concurrent", { text: "hello" });
    expect(fetcher).toHaveBeenCalledTimes(1);
    complete(new Response('{"ok":true}')); await Promise.all([a, b]);
    fetcher.mockImplementation(async () => new Response('{"ok":true}'));
    await mutationJson("/send-test-concurrent", { text: "hello" });
    expect(fetcher.mock.calls[0][1].headers["Idempotency-Key"]).not.toBe(fetcher.mock.calls[1][1].headers["Idempotency-Key"]);
  });
  it("keeps the key across a lost network response", async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new TypeError("network")).mockResolvedValueOnce(new Response('{"ok":true}'));
    vi.stubGlobal("fetch", fetcher);
    await expect(mutationJson("/send-test-retry", { text: "hello" })).rejects.toThrow("network");
    await mutationJson("/send-test-retry", { text: "hello" });
    expect(fetcher.mock.calls[0][1].headers["Idempotency-Key"]).toBe(fetcher.mock.calls[1][1].headers["Idempotency-Key"]);
  });
});
