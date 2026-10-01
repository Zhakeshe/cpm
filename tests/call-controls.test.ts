import { afterEach, expect, it, vi } from "vitest";
import { requestZadarmaCall, toggleMicrophone } from "../src/lib/call-controls";
import { CallTones } from "../src/lib/call-tones";
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
it("mutes and unmutes the real microphone session", () => {
  let audio = false;
  const session = { isMuted: () => ({ audio }), mute: vi.fn(() => { audio = true; }), unmute: vi.fn(() => { audio = false; }) };
  expect(toggleMicrophone(session)).toBe(true); expect(session.mute).toHaveBeenCalledWith({ audio: true });
  expect(toggleMicrophone(session)).toBe(false); expect(session.unmute).toHaveBeenCalledWith({ audio: true });
});
it("signals ringback and cancels it if callback fails", async () => {
  const dispatch = vi.fn(); vi.stubGlobal("window", { dispatchEvent: dispatch });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: "SIP_ACCOUNT_NOT_CONFIGURED" }, { status: 503 })));
  await expect(requestZadarmaCall("contact-1")).rejects.toThrow("SIP_ACCOUNT_NOT_CONFIGURED");
  expect(dispatch.mock.calls.map(([event]) => event.type)).toEqual(["crm:callback-pending", "crm:callback-cancel"]);
});
it("stops synthesized ringing immediately and clears the repeat timer", async () => {
  vi.useFakeTimers();
  const stop = vi.fn(); const close = vi.fn();
  const oscillator = () => ({ frequency: { value: 0 }, connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop, onended: null });
  const createOscillator = vi.fn(oscillator);
  vi.stubGlobal("AudioContext", class {
    state = "running"; currentTime = 0; destination = {};
    resume = vi.fn(); close = close; createOscillator = createOscillator;
    createGain() { return { gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() }, connect: vi.fn(), disconnect: vi.fn() }; }
  });
  const tones = new CallTones(); await tones.unlock(); tones.start("incoming");
  expect(createOscillator).toHaveBeenCalledTimes(2);
  tones.stop(); vi.advanceTimersByTime(10000);
  expect(createOscillator).toHaveBeenCalledTimes(2);
  tones.close(); expect(close).toHaveBeenCalledTimes(1);
});
