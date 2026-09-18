"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, PhoneIncoming } from "lucide-react";

type SipConfig =
  | { enabled: false; reason: string }
  | {
      enabled: true;
      wsUrl: string;
      uri: string;
      password: string;
      extension: string;
      displayName: string;
    };

type CallState = "idle" | "registering" | "ready" | "incoming" | "in-call" | "error";

type SessionEvents = { on: (event: string, handler: () => void) => void };

/** jssip's own event map is stricter than we need, so the UA is used through a narrow surface. */
type UaLike = {
  start: () => void;
  stop: () => void;
  on: {
    (event: "registered" | "registrationFailed", handler: () => void): void;
    (
      event: "newRTCSession",
      handler: (data: { session: JsSipSession & SessionEvents; originator: string }) => void,
    ): void;
  };
};

type JsSipSession = {
  answer: (opts?: { mediaConstraints?: { audio: boolean; video: boolean } }) => void;
  terminate: () => void;
  connection?: RTCPeerConnection;
  remote_identity?: { uri?: { user?: string } };
};

/**
 * Browser softphone: registers the manager's SIP extension over WebSocket so a
 * headset is enough, with no desk phone or separate client.
 */
export function Softphone() {
  const [state, setState] = useState<CallState>("idle");
  const [peer, setPeer] = useState<string>("");
  const [disabledReason, setDisabledReason] = useState<string | null>(null);
  const uaRef = useRef<UaLike | null>(null);
  const sessionRef = useRef<JsSipSession | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const attachAudio = useCallback((session: JsSipSession) => {
    const pc = session.connection;
    if (!pc || !audioRef.current) return;
    pc.ontrack = (event) => {
      if (audioRef.current) audioRef.current.srcObject = event.streams[0];
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const config: SipConfig = await fetch("/api/sip/credentials").then((r) => r.json());
      if (cancelled) return;
      if (!config.enabled) {
        setDisabledReason(config.reason);
        return;
      }
      const JsSIP = (await import("jssip")).default;
      const socket = new JsSIP.WebSocketInterface(config.wsUrl);
      const ua = new JsSIP.UA({
        sockets: [socket],
        uri: config.uri,
        password: config.password,
        display_name: config.displayName,
        session_timers: false,
      }) as unknown as UaLike;
      uaRef.current = ua;

      ua.on("registered", () => setState("ready"));
      ua.on("registrationFailed", () => setState("error"));
      ua.on("newRTCSession", (event) => {
        const session = event.session;
        const handle = session as unknown as JsSipSession;
        sessionRef.current = handle;
        setPeer(handle.remote_identity?.uri?.user || "");
        if (event.originator === "remote") setState("incoming");
        session.on("accepted", () => {
          setState("in-call");
          attachAudio(handle);
        });
        session.on("confirmed", () => {
          setState("in-call");
          attachAudio(handle);
        });
        session.on("ended", () => setState("ready"));
        session.on("failed", () => setState("ready"));
      });

      setState("registering");
      ua.start();
    }

    boot().catch(() => setState("error"));
    return () => {
      cancelled = true;
      uaRef.current?.stop();
    };
  }, [attachAudio]);

  if (disabledReason) return null;

  function answer() {
    sessionRef.current?.answer({ mediaConstraints: { audio: true, video: false } });
  }
  function hangup() {
    sessionRef.current?.terminate();
    setState("ready");
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 card px-4 py-3 w-64 space-y-2">
      <audio ref={audioRef} autoPlay />
      <div className="flex items-center gap-2 text-sm">
        <Phone size={14} />
        <span className="muted">
          {state === "ready" && "Софтфон готов"}
          {state === "registering" && "Регистрация SIP…"}
          {state === "incoming" && "Входящий звонок"}
          {state === "in-call" && "Разговор"}
          {state === "error" && "SIP недоступен"}
          {state === "idle" && "Инициализация"}
        </span>
      </div>
      {(state === "incoming" || state === "in-call") && <div className="text-sm">{peer}</div>}
      {state === "incoming" && (
        <div className="flex gap-2">
          <button className="rounded-xl bg-[#16a34a] px-3 py-2 text-sm flex items-center gap-1" onClick={answer}>
            <PhoneIncoming size={14} /> Ответить
          </button>
          <button className="rounded-xl bg-[#dc2626] px-3 py-2 text-sm" onClick={hangup}>
            Отклонить
          </button>
        </div>
      )}
      {state === "in-call" && (
        <button className="rounded-xl bg-[#dc2626] px-3 py-2 text-sm flex items-center gap-1" onClick={hangup}>
          <PhoneOff size={14} /> Завершить
        </button>
      )}
    </div>
  );
}
