import type { ZadarmaBrowserBootstrap } from "./sip-browser";

type PushEvent = { action?: string; callerid?: string; reconnect?: number };
export type PushSocket = {
  on(event: string, handler: (data?: unknown) => void): void;
  emit(event: string, data: unknown): void;
  close(): void;
  open(): void;
  removeAllListeners(): void;
};
type PushFactory = (url: string, options: Record<string, unknown>) => PushSocket;
type PushHandlers = {
  ready(): void;
  disconnected(): void;
  incoming(caller: string): void;
  ended(): void;
};
declare global { interface Window { io?: PushFactory } }
let library: Promise<PushFactory> | undefined;

function loadLibrary() {
  if (window.io) return Promise.resolve(window.io);
  if (!library) library = new Promise<PushFactory>((resolve, reject) => {
    const script = document.createElement("script");
    // Same Socket.IO version as the provider's official v8 webphone.
    script.src = "https://my.zadarma.com/webphoneWebRTCWidget/v8/js/socket.io.js";
    const timer = setTimeout(() => fail(), 15_000);
    function fail() {
      clearTimeout(timer); script.remove(); library = undefined;
      reject(new Error("CONNECTION_FAILED"));
    }
    script.onload = () => {
      clearTimeout(timer);
      if (window.io) resolve(window.io); else fail();
    };
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return library;
}

/** Incoming calls are announced on this channel before a SIP INVITE exists. */
export function bindZadarmaPush(socket: PushSocket, handlers: PushHandlers) {
  let closed = false;
  let localPing: ReturnType<typeof setInterval> | undefined;
  let globalPing: ReturnType<typeof setInterval> | undefined;
  const clearPings = () => { clearInterval(localPing); clearInterval(globalPing); };
  socket.on("init", () => {
    if (closed) return;
    clearPings();
    localPing = setInterval(() => socket.emit("localPing", {}), 30_000);
    globalPing = setInterval(() => socket.emit("globalPing", {}), 60_000);
    handlers.ready();
  });
  socket.on("update", (data) => {
    if (closed) return;
    let event: PushEvent;
    try { event = (typeof data === "string" ? JSON.parse(data) : data) as PushEvent; }
    catch { return; }
    if (!event || typeof event !== "object") return;
    if (event.action === "incoming") handlers.incoming(typeof event.callerid === "string" ? event.callerid : "");
    else if (event.action === "cancel" || event.action === "answered") handlers.ended();
    else if (event.reconnect === 1) socket.open();
  });
  socket.on("disconnect", () => {
    if (closed) return;
    clearPings(); handlers.disconnected();
  });
  socket.on("connect_error", () => { if (!closed) handlers.disconnected(); });
  return () => {
    closed = true; clearPings(); socket.removeAllListeners(); socket.close();
  };
}

export async function openZadarmaPush(config: ZadarmaBrowserBootstrap, handlers: PushHandlers, signal: AbortSignal) {
  const io = await loadLibrary();
  if (signal.aborted) throw new Error("CONNECTION_FAILED");
  const query = new URLSearchParams({ key: config.key, integrationType: "site", sipId: config.sip });
  const socket = io("https://ws.zadarma.com/webrtc_pushes?" + query, {
    transports: ["websocket"], reconnection: true,
    reconnectionDelay: 2_000, reconnectionDelayMax: 30_000,
  });
  const dispose = bindZadarmaPush(socket, handlers);
  const close = () => { signal.removeEventListener("abort", close); dispose(); };
  signal.addEventListener("abort", close, { once: true });
  return close;
}
