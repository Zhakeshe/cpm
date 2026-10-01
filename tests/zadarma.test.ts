import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
  zadarmaWebhookEventId, zadarmaApiSignature, zadarmaCallback, zadarmaCallbackParameters, zadarmaDestination,
  mapZadarmaNotify,
  phpHttpBuildQuery,
  verifyZadarmaSignature,
  zadarmaHmacBase64,
  zadarmaNotifySignatureData,
} from "../src/lib/zadarma";

describe("zadarma notify mapping", () => {
  it("maps inbound start and answered hangup", () => {
    const start = mapZadarmaNotify({
      event: "NOTIFY_START",
      pbx_call_id: "in-1",
      caller_id: "77015551122",
      called_did: "77270000000",
      call_start: "2026-09-22 12:00:00",
    });
    expect(start?.event).toBe("call.started");
    expect(start?.direction).toBe("INBOUND");
    expect(start?.from).toBe("77015551122");

    const internal = mapZadarmaNotify({
      event: "NOTIFY_INTERNAL",
      pbx_call_id: "in-1",
      caller_id: "77015551122",
      called_did: "77270000000",
      internal: "101",
      call_start: "2026-09-22 12:00:00",
    });
    expect(internal?.providerInternal).toBe("101");

    const end = mapZadarmaNotify({
      event: "NOTIFY_END",
      pbx_call_id: "in-1",
      caller_id: "77015551122",
      called_did: "77270000000",
      disposition: "answered",
      duration: "42",
      is_recorded: "1",
      call_id_with_rec: "rec-9",
      last_internal: "101",
    });
    expect(end?.event).toBe("call.ended");
    expect(end?.status).toBe("ANSWERED");
    expect(end?.duration).toBe(42);
    expect(end?.recordingUrl).toBe("zadarma:rec-9");
  });

  it("maps outbound start and missed inbound", () => {
    const out = mapZadarmaNotify({
      event: "NOTIFY_OUT_START",
      pbx_call_id: "out-2",
      destination: "77019990000",
      internal: "102",
      call_start: "2026-09-22 12:01:00",
    });
    expect(out?.direction).toBe("OUTBOUND");
    expect(out?.to).toBe("77019990000");
    expect(out?.providerInternal).toBe("102");

    const missed = mapZadarmaNotify({
      event: "NOTIFY_END",
      pbx_call_id: "in-3",
      caller_id: "7701",
      called_did: "7727",
      disposition: "cancel",
    });
    expect(missed?.status).toBe("MISSED");
    expect(mapZadarmaNotify({ event: "NOTIFY_IVR", pbx_call_id: "x" })).toBeNull();
  });

  it("verifies Signature the same way as the PHP docs", () => {
    const body = {
      event: "NOTIFY_START",
      caller_id: "7701",
      called_did: "7727",
      call_start: "2026-01-01 00:00:00",
    };
    const secret = "test-secret";
    const header = zadarmaHmacBase64(zadarmaNotifySignatureData(body), secret);
    expect(verifyZadarmaSignature(body, header, secret)).toBe(true);
    expect(verifyZadarmaSignature(body, "nope", secret)).toBe(false);
    expect(phpHttpBuildQuery({ to: "7701", from: "101" })).toBe("from=101&to=7701");
  });
});

beforeEach(() => { vi.stubEnv("SIP_CORPORATE_NUMBER", "+77172696753"); vi.stubEnv("ZADARMA_DESTINATION_FORMAT", "international"); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("documented callback contract", () => {
  it.each(["+7 776 201 07 02", "87762010702", "7762010702"])("normalizes %s", (input) => {
    expect(zadarmaDestination(input)).toBe("77762010702");
  });
  it("does not prepend Kazakhstan's country code to an explicit international number", () => {
    expect(zadarmaDestination("+49 30 12345678")).toBe("493012345678");
    expect(zadarmaDestination("+33 123456789")).toBe("33123456789");
    expect(() => zadarmaDestination("call 77762010702")).toThrow("INVALID_DESTINATION");
    expect(() => zadarmaDestination("101")).toThrow("INVALID_DESTINATION");
  });
  it("sets from/sip to the real account, to to the customer; never submits CallerID", () => {
    vi.stubEnv("SIP_CORPORATE_NUMBER", "+77172696753");
    expect(zadarmaCallbackParameters({ callbackEndpoint: "158925", toNumber: "+7 776 201 07 02" }))
      .toEqual({ from: "158925", sip: "158925", to: "77762010702" });
    expect(() => zadarmaCallbackParameters({ callbackEndpoint: "158925", toNumber: "+77172696753" })).toThrow("INVALID_DESTINATION");
  });
  it("encodes PHP RFC1738 punctuation and uses a fixed API signing vector", () => {
    expect(phpHttpBuildQuery({ value: "!'()* ~" })).toBe("value=%21%27%28%29%2A+%7E");
    expect(zadarmaApiSignature("/v1/request/callback/", { from: "158925", to: "77762010702", sip: "158925" }, "test-secret"))
      .toBe("MmZmNTViODE2NjQyZjE0OGViZDUxZWMzNjMzODBiZjU0NjE3MGFkMg==");
  });
  it("requires an actual success response and does not invent a provider call ID", async () => {
    vi.stubEnv("ZADARMA_USER_KEY", "test-key"); vi.stubEnv("ZADARMA_SECRET", "test-secret");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "success", time: 123 })));
    vi.stubGlobal("fetch", fetchMock); vi.spyOn(console, "info").mockImplementation(() => {});
    const result = await zadarmaCallback({ managerId: "u1", sipAccount: "158925", callbackEndpoint: "158925", toNumber: "77762010702" });
    expect(result).toEqual({ accepted: true, direction: "OUTBOUND" });
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.zadarma.com/v1/request/callback/?from=158925&sip=158925&to=77762010702");
  });
  it.each([{ status: "error", message: "Field to cannot be equal to Callerid" }, {}])("propagates a provider failure without false acceptance", async (response) => {
    vi.stubEnv("ZADARMA_USER_KEY", "test-key"); vi.stubEnv("ZADARMA_SECRET", "test-secret");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(response))));
    vi.spyOn(console, "error").mockImplementation(() => {}); vi.spyOn(console, "info").mockImplementation(() => {});
    await expect(zadarmaCallback({ managerId: "u1", sipAccount: "158925", callbackEndpoint: "158925", toNumber: "77762010702" })).rejects.toThrow("ZADARMA_API_ERROR");
  });
  it("fails closed when API credentials or webhook secret are missing", async () => {
    vi.stubEnv("ZADARMA_USER_KEY", ""); vi.stubEnv("ZADARMA_SECRET", "");
    vi.spyOn(console, "info").mockImplementation(() => {});
    await expect(zadarmaCallback({ managerId: "u1", sipAccount: "158925", callbackEndpoint: "158925", toNumber: "77762010702" })).rejects.toThrow("ZADARMA_NOT_CONFIGURED");
    expect(verifyZadarmaSignature({}, null, "")).toBe(false);
  });
  it("does not guess ANSWER or RECORD direction from the presence of internal", () => {
    expect(mapZadarmaNotify({ event: "NOTIFY_ANSWER", pbx_call_id: "in-1", internal: "101", destination: "101" })?.direction).toBeUndefined();
    expect(mapZadarmaNotify({ event: "NOTIFY_RECORD", pbx_call_id: "out-1", call_id_with_rec: "rec" })?.direction).toBeUndefined();
    expect(mapZadarmaNotify({ event: "NOTIFY_OUT_END", pbx_call_id: "out-1", destination: "77762010702", disposition: "answered" })?.direction).toBe("OUTBOUND");
  });
});

it("deduplicates exact deliveries without dropping INTERNAL/record notifications", () => {
  const start = { pbx_call_id: "p", event: "NOTIFY_START" };
  expect(zadarmaWebhookEventId(start)).toBe(zadarmaWebhookEventId({ ...start }));
  expect(zadarmaWebhookEventId({ ...start, event: "NOTIFY_INTERNAL", internal: "107" })).not.toBe(zadarmaWebhookEventId(start));
  expect(zadarmaWebhookEventId({ ...start, event: "NOTIFY_RECORD", call_id_with_rec: "rec-1" }))
    .not.toBe(zadarmaWebhookEventId({ ...start, event: "NOTIFY_RECORD", call_id_with_rec: "rec-2" }));
});

 it.each(["+7 776 201 07 02", "87762010702", "77762010702"])("explicit domestic mode dials %s with 8", (input) => {
  vi.stubEnv("ZADARMA_DESTINATION_FORMAT", "kz-domestic");
  expect(zadarmaCallbackParameters({ callbackEndpoint: "158925", toNumber: input })).toEqual({ from: "158925", sip: "158925", to: "87762010702" });
});
it("domestic mode keeps corporate-number protection and foreign destinations", () => {
  vi.stubEnv("ZADARMA_DESTINATION_FORMAT", "kz-domestic");
  expect(() => zadarmaCallbackParameters({ callbackEndpoint: "158925", toNumber: "87172696753" })).toThrow("INVALID_DESTINATION");
  expect(zadarmaCallbackParameters({ callbackEndpoint: "158925", toNumber: "+49 30 12345678" }).to).toBe("493012345678");
});
it("rejects an unknown destination mode", () => {
  vi.stubEnv("ZADARMA_DESTINATION_FORMAT", "typo");
  expect(() => zadarmaCallbackParameters({ callbackEndpoint: "158925", toNumber: "77762010702" })).toThrow("ZADARMA_NOT_CONFIGURED");
});
