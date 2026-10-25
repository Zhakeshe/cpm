import { afterEach, describe, expect, it, vi } from "vitest";
import { sendWazzupText, WazzupApiError } from "../src/lib/wazzup";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("Wazzup live-send response handling", () => {
  const params = { apiKey: "private-test-key", channelId: "channel", chatId: "77015550001", text: "Private greeting" };

  it("passes a stable automation ID, preserves unanswered count and bounds the request", async () => {
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ messageId: "provider-id" }), { status: 201 }));
    vi.stubGlobal("fetch", request);
    const result = await sendWazzupText({ ...params, crmMessageId: "welcome-contact", clearUnanswered: false, timeoutMs: 15000 });
    expect(result).toEqual({ id: "provider-id", mocked: false });
    expect(JSON.parse(request.mock.calls[0][1].body)).toMatchObject({ crmMessageId: "welcome-contact", clearUnanswered: false });
    expect(request.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });

  it("keeps the actual provider rejection and trace ID without logging private response content", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: "POST_MESSAGE_ERROR", requestId: "8a3c8a481bff5dcce3da7e5c2357e734",
      data: [{ code: "UNKNOWN_ERROR", description: "private response content" }], extra: params.apiKey,
    }), { status: 400 })));
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    let error: WazzupApiError | undefined;
    try { await sendWazzupText(params); } catch (err) { error = err as WazzupApiError; }
    expect(error).toBeInstanceOf(WazzupApiError);
    expect(error?.details).toEqual({ providerStatus: 400, providerCode: "POST_MESSAGE_ERROR", requestId: "8a3c8a481bff5dcce3da7e5c2357e734", providerErrors: ["UNKNOWN_ERROR"] });
    expect(JSON.stringify(log.mock.calls)).not.toContain(params.apiKey);
    expect(JSON.stringify(log.mock.calls)).not.toContain(params.text);
    expect(JSON.stringify(log.mock.calls)).not.toContain("private response content");
  });

  it("handles a non-JSON provider failure without retaining its body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("private HTML error", { status: 502 })));
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(sendWazzupText(params)).rejects.toMatchObject({ details: { providerStatus: 502 } });
    expect(JSON.stringify(log.mock.calls)).not.toContain("private HTML error");
  });
});
