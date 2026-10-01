"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, PhoneIncoming, Mic, MicOff, Volume2 } from "lucide-react";
import { CallTones } from "@/lib/call-tones";
import { toggleMicrophone } from "@/lib/call-controls";
import { useI18n } from "@/components/I18nProvider";

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
  answer: (opts?: {
    mediaConstraints?: { audio: boolean; video: boolean };
    pcConfig?: { iceServers?: Array<{ urls: string }> };
  }) => void;
  terminate: (options?: { status_code?: number }) => void;
  isMuted: () => { audio: boolean };
  mute: (options: { audio: boolean }) => void;
  unmute: (options: { audio: boolean }) => void;
  connection?: RTCPeerConnection;
  remote_identity?: { uri?: { user?: string } };
};

/**
 * Browser softphone: registers the manager's SIP extension over WebSocket so a
 * headset is enough, with no desk phone or separate client.
 */
export function Softphone() {
  const { t } = useI18n();
  const [state, setState] = useState<CallState>("idle");
  const [muted, setMuted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [callbackPending, setCallbackPending] = useState(false);
  const tonesRef = useRef<CallTones | null>(null);
  const [peer, setPeer] = useState<string>("");
  const [disabledReason, setDisabledReason] = useState<string | null>(null);
  const uaRef = useRef<UaLike | null>(null);
  const sessionRef = useRef<JsSipSession | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const attachAudio = useCallback((session: JsSipSession) => {
    const pc = session.connection;
    if (!pc || !audioRef.current) return;
    const attach = (stream: MediaStream) => {
      if (!audioRef.current) return;
      audioRef.current.srcObject = stream;
      void audioRef.current.play().catch(() => setSoundEnabled(false));
    };
    pc.ontrack = (event) => attach(event.streams[0] || new MediaStream([event.track]));
    const tracks = pc.getReceivers().map((receiver) => receiver.track).filter((track) => track.kind === "audio");
    if (tracks.length) attach(new MediaStream(tracks));
  }, []);

  useEffect(() => {
    const tones = new CallTones(); tonesRef.current = tones;
    let expiry: ReturnType<typeof setTimeout> | undefined;
    const cancel = () => { setCallbackPending(false); if (expiry) clearTimeout(expiry); };
    const pending = () => {
      setCallbackPending(true);
      if (expiry) clearTimeout(expiry);
      expiry = setTimeout(cancel, 45000);
    };
    const unlock = () => { void tones.unlock().then(setSoundEnabled).catch(() => setSoundEnabled(false)); };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("crm:callback-pending", pending);
    window.addEventListener("crm:callback-cancel", cancel);
    return () => {
      if (expiry) clearTimeout(expiry);
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("crm:callback-pending", pending);
      window.removeEventListener("crm:callback-cancel", cancel);
      tones.close();
    };
  }, []);

  useEffect(() => {
    if (soundEnabled && (state === "incoming" || (callbackPending && state !== "in-call"))) {
      tonesRef.current?.start(callbackPending ? "outgoing" : "incoming");
    } else tonesRef.current?.stop();
    return () => tonesRef.current?.stop();
  }, [state, callbackPending, soundEnabled]);

  useEffect(() => {
    if (state !== "in-call") { setSeconds(0); return; }
    const start = Date.now();
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [state]);

  useEffect(() => {
    let cancelled = false;
    const audioElement = audioRef.current;

    async function boot() {
      const config: SipConfig = await fetch("/api/sip/credentials").then((r) => r.json());
      if (cancelled) return;
      if (!config.enabled) {
        setDisabledReason(config.reason);
        return;
      }
      const JsSIP = (await import("jssip")).default;
      if (cancelled) return;
      const socket = new JsSIP.WebSocketInterface(config.wsUrl);
      const ua = new JsSIP.UA({
        sockets: [socket],
        uri: config.uri,
        password: config.password,
        display_name: config.displayName,
        session_timers: false,
        register_expires: 300,
        connection_recovery_max_interval: 30,
      }) as unknown as UaLike;
      uaRef.current = ua;

      ua.on("registered", () => setState("ready"));
      ua.on("registrationFailed", () => setState("error"));
      ua.on("newRTCSession", (event) => {
        const session = event.session;
        if (sessionRef.current) { session.terminate({ status_code: 486 }); return; }
        const handle = session as unknown as JsSipSession;
        sessionRef.current = handle;
        setMuted(false);
        setPeer(handle.remote_identity?.uri?.user || "");
        if (event.originator === "remote") setState("incoming");
        const finish = () => {
          if (sessionRef.current !== handle) return;
          sessionRef.current = null;
          setCallbackPending(false); setMuted(false); setState("ready");
          if (audioRef.current) audioRef.current.srcObject = null;
        };
        session.on("muted", () => setMuted(handle.isMuted().audio));
        session.on("unmuted", () => setMuted(handle.isMuted().audio));
        session.on("peerconnection", () => attachAudio(handle));
        session.on("accepted", () => {
          setState("in-call");
          attachAudio(handle);
        });
        session.on("confirmed", () => {
          setState("in-call");
          attachAudio(handle);
        });
        session.on("ended", finish);
        session.on("failed", finish);
      });

      setState("registering");
      ua.start();
    }

    boot().catch(() => setState("error"));
    return () => {
      cancelled = true;
      sessionRef.current?.terminate();
      sessionRef.current = null;
      uaRef.current?.stop();
      if (audioElement) audioElement.srcObject = null;
    };
  }, [attachAudio]);

  if (disabledReason) return null;

  function answer() {
    tonesRef.current?.stop();
    sessionRef.current?.answer({
      mediaConstraints: { audio: true, video: false },
      pcConfig: { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] },
    });
  }
  function hangup() {
    sessionRef.current?.terminate();
    tonesRef.current?.stop();
    setCallbackPending(false);
    setMuted(false); setState("ready");
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 card px-5 py-4 w-80 max-w-[calc(100vw-2rem)] space-y-3 shadow-2xl">
      <audio ref={audioRef} autoPlay />
      <div className="flex items-center gap-2 text-sm">
        <Phone size={14} />
        <span className="muted">
          {state === "ready" && t("softphone.ready")}
          {state === "registering" && t("softphone.registering")}
          {state === "incoming" && (callbackPending ? t("softphone.callback") : t("softphone.incoming"))}
          {state === "in-call" && t("softphone.inCall")}
          {state === "error" && t("softphone.error")}
          {state === "idle" && t("softphone.idle")}
        </span>
      </div>
      {(state === "incoming" || state === "in-call") && <div className="text-sm">{peer}</div>}
      {state === "incoming" && (
        <div className="flex gap-2">
          <button className="rounded-xl bg-[#16a34a] px-3 py-2 text-sm flex items-center gap-1" onClick={answer}>
            <PhoneIncoming size={14} /> {t("softphone.answer")}
          </button>
          <button className="rounded-xl bg-[#dc2626] px-3 py-2 text-sm" onClick={hangup}>
            {t("softphone.decline")}
          </button>
        </div>
      )}
      {!soundEnabled && <button className="chip flex gap-2 items-center text-xs" onClick={() => {
        void tonesRef.current?.unlock().then(setSoundEnabled).catch(() => setSoundEnabled(false));
        void audioRef.current?.play().catch(() => {});
      }}><Volume2 size={14} />{t("softphone.enableSound")}</button>}
      {state === "in-call" && <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-lg tabular-nums">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</span>
        <button className="chip flex items-center gap-2" aria-pressed={muted} onClick={() => {
          if (sessionRef.current) setMuted(toggleMicrophone(sessionRef.current));
        }}>{muted ? <MicOff size={16} /> : <Mic size={16} />}{t(muted ? "softphone.unmute" : "softphone.mute")}</button>
      </div>}
      {state === "in-call" && (
        <button className="rounded-xl bg-[#dc2626] px-3 py-2 text-sm flex items-center gap-1" onClick={hangup}>
          <PhoneOff size={14} /> {t("softphone.hangup")}
        </button>
      )}
    </div>
  );
}
