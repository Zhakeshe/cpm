import { afterEach, expect, it, vi } from "vitest";
import { bindZadarmaPush, type PushSocket } from "../src/lib/zadarma-push";

afterEach(() => vi.useRealTimers());
function fixture() {
  const listeners = new Map<string, (data?: unknown) => void>();
  const socket: PushSocket = {
    on: (name, handler) => { listeners.set(name, handler); },
    emit: vi.fn(), close: vi.fn(), open: vi.fn(),
    removeAllListeners: vi.fn(() => listeners.clear()),
  };
  const handlers = { ready: vi.fn(), disconnected: vi.fn(), incoming: vi.fn(), ended: vi.fn() };
  const close = bindZadarmaPush(socket, handlers);
  return { socket, handlers, close, send: (name: string, data?: unknown) => listeners.get(name)?.(data) };
}
it("receives an incoming call notification before any SIP session exists", () => {
  const f = fixture();
  f.send("init");
  f.send("update", JSON.stringify({ action: "incoming", callerid: "100" }));
  expect(f.handlers.ready).toHaveBeenCalledOnce();
  expect(f.handlers.incoming).toHaveBeenCalledWith("100");
  f.send("update", { action: "cancel" });
  f.send("update", { action: "answered" });
  expect(f.handlers.ended).toHaveBeenCalledTimes(2);
  f.close();
});
it("maintains provider heartbeats and clears them on disconnect and disposal", () => {
  vi.useFakeTimers();
  const f = fixture();
  f.send("init"); f.send("init");
  vi.advanceTimersByTime(60_000);
  expect(f.socket.emit).toHaveBeenCalledTimes(3);
  expect(f.socket.emit).toHaveBeenCalledWith("localPing", {});
  expect(f.socket.emit).toHaveBeenCalledWith("globalPing", {});
  f.send("disconnect");
  expect(f.handlers.disconnected).toHaveBeenCalledOnce();
  vi.advanceTimersByTime(60_000);
  expect(f.socket.emit).toHaveBeenCalledTimes(3);
  f.send("init"); f.close();
  vi.advanceTimersByTime(60_000);
  expect(f.socket.emit).toHaveBeenCalledTimes(3);
  expect(f.socket.close).toHaveBeenCalledOnce();
  f.send("update", { action: "incoming" });
  expect(f.handlers.incoming).not.toHaveBeenCalled();
});
it("ignores malformed notifications without exposing their contents", () => {
  const f = fixture();
  for (const value of ["not JSON", null, 4, { action: "unknown" }]) f.send("update", value);
  expect(f.handlers.incoming).not.toHaveBeenCalled();
  f.send("connect_error", new Error("private endpoint"));
  expect(f.handlers.disconnected).toHaveBeenCalledWith();
  f.close();
});
