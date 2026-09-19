"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";

let shared: Socket | null = null;
let refCount = 0;

function acquire(): Socket {
  if (!shared) {
    shared = io({ path: "/ws", withCredentials: true });
  }
  refCount += 1;
  return shared;
}

function release() {
  refCount -= 1;
  if (refCount <= 0 && shared) {
    shared.disconnect();
    shared = null;
    refCount = 0;
  }
}

export type RealtimeHandlers = Record<string, (payload: never) => void>;

/**
 * One socket per browser tab: pages subscribe to the events they care about
 * without opening a new connection each time.
 */
export function useRealtime(handlers: RealtimeHandlers) {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    const socket = acquire();
    const names = Object.keys(ref.current);
    const bound = names.map((name) => {
      const fn = (payload: unknown) => {
        (ref.current[name] as unknown as ((p: unknown) => void) | undefined)?.(payload);
      };
      socket.on(name, fn);
      return [name, fn] as const;
    });
    return () => {
      for (const [name, fn] of bound) socket.off(name, fn);
      release();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Object.keys(handlers).join(",")]);
}

export function usePresence() {
  useEffect(() => {
    const socket = acquire();
    const tick = () => socket.emit("presence");
    tick();
    const timer = setInterval(tick, 30_000);
    return () => {
      clearInterval(timer);
      release();
    };
  }, []);
}
