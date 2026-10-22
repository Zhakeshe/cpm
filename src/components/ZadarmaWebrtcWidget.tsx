"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Phone, PhoneIncoming, PhoneOff, RefreshCw } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";

type SipConfig =
  | { enabled: false; reason: string }
  | { enabled: true; wsUrl: string; uri: string; password: string; extension: string; displayName: string };

type CallState = "registering" | "ready" | "incoming" | "connecting" | "in-call" | "disabled" | "error";
type PeerConnectionEvent = { peerconnection?: RTCPeerConnection };
type SessionEventHandler = (event?: PeerConnectionEvent) => void;
type JsSipSession = {
  answer: (options: { mediaConstraints: { audio: boolean; video: boolean } }) => void;
  terminate: () => void;
  on: (event: string, handler: SessionEventHandler) => void;
  connection?: RTCPeerConnection;
  remote_identity?: { uri?: { user?: string } };
};
type UaLike = {
  start: () => void;
  stop: () => void;
  on: (event: string, handler: (data?: { session: JsSipSession; originator: string; cause?: string }) => void) => void;
};

/** Direct PBX WebRTC client. It does not depend on Zadarma's domain widget key. */
export function ZadarmaWebrtcWidget() {
  const { t } = useI18n();
  const [state, setState] = useState<CallState>("registering");
  const [peer, setPeer] = useState("");
  const [reason, setReason] = useState("");
  const [attempt, setAttempt] = useState(0);
  const uaRef = useRef<UaLike | null>(null);
  const sessionRef = useRef<JsSipSession | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const attachAudio = useCallback((session: JsSipSession, connection?: RTCPeerConnection) => {
    const pc = connection || session.connection;
    if (!pc) return;
    const play = (stream: MediaStream) => {
      if (!audioRef.current) return;
      audioRef.current.srcObject = stream;
      audioRef.current.play().catch(() => undefined);
    };
    pc.addEventListener("track", (event) => {
      const stream = event.streams[0];
      if (stream) play(stream);
    });
    const tracks = (pc.getReceivers?.() || []).map((receiver) => receiver.track).filter(Boolean);
    if (tracks.length) play(new MediaStream(tracks));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      setState("registering");
      setReason("");
      const response = await fetch("/api/sip/credentials", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP_${response.status}`);
      const config = await response.json() as SipConfig;
      if (cancelled) return;
      if (!config.enabled) {
        setReason(config.reason);
        setState("disabled");
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
        register: true,
        register_expires: 300,
        session_timers: false,
        connection_recovery_min_interval: 2,
        connection_recovery_max_interval: 30,
      }) as unknown as UaLike;
      uaRef.current = ua;

      ua.on("registered", () => {
        if (!cancelled) setState((current) => current === "registering" || current === "error" ? "ready" : current);
      });
      ua.on("registrationFailed", (event) => {
        if (!cancelled) {
          setReason(event?.cause || "REGISTRATION_FAILED");
          setState("error");
        }
      });
      ua.on("disconnected", () => {
        if (!cancelled) setState((current) => current === "in-call" ? current : "registering");
      });
      ua.on("newRTCSession", (event) => {
        if (!event?.session) return;
        const session = event.session;
        sessionRef.current = session;
        setPeer(session.remote_identity?.uri?.user || "");
        session.on("peerconnection", (data) => attachAudio(session, data?.peerconnection));
        session.on("accepted", () => { setState("in-call"); attachAudio(session); });
        session.on("confirmed", () => { setState("in-call"); attachAudio(session); });
        const finish = () => {
          sessionRef.current = null;
          setPeer("");
          setState("ready");
        };
        session.on("ended", finish);
        session.on("failed", finish);
        if (event.originator === "remote") {
          setState("incoming");
          window.parent.postMessage({ type: "crm:sip-incoming" }, window.location.origin);
        } else {
          setState("connecting");
        }
      });
      ua.start();
    }

    boot().catch((error) => {
      console.error("Zadarma SIP registration failed", error);
      if (!cancelled) {
        setReason(error instanceof Error ? error.message : "REGISTRATION_FAILED");
        setState("error");
      }
    });
    return () => {
      cancelled = true;
      sessionRef.current?.terminate();
      uaRef.current?.stop();
      sessionRef.current = null;
      uaRef.current = null;
    };
  }, [attempt, attachAudio]);

  function answer() {
    const session = sessionRef.current;
    if (!session) return;
    try {
      setState("connecting");
      session.answer({ mediaConstraints: { audio: true, video: false } });
    } catch (error) {
      console.error("Zadarma call answer failed", error);
      setReason(error instanceof Error ? error.message : "ANSWER_FAILED");
      setState("error");
    }
  }

  function hangup() {
    sessionRef.current?.terminate();
    sessionRef.current = null;
    setPeer("");
    setState("ready");
  }

  const label = state === "ready" ? t("softphone.ready")
    : state === "registering" ? t("softphone.registering")
      : state === "incoming" ? t("softphone.incoming")
        : state === "connecting" ? t("softphone.registering")
          : state === "in-call" ? t("softphone.inCall")
            : state === "disabled" ? t("softphone.notConfigured")
              : t("softphone.error");

  return (
    <div className="flex min-h-screen flex-col bg-[#0b1220] p-4 text-white">
      <audio ref={audioRef} autoPlay playsInline />
      <div className="card space-y-4 p-4">
        <div className="flex items-center gap-2 text-sm">
          <Phone size={16} />
          <span>{label}</span>
          <span className={`ml-auto h-2.5 w-2.5 rounded-full ${state === "ready" || state === "in-call" ? "bg-[#22c55e]" : state === "error" || state === "disabled" ? "bg-[#ef4444]" : "bg-[#f59e0b]"}`} />
        </div>
        {peer && <div className="rounded-xl border border-[#2a3650] px-3 py-2 text-sm">{peer}</div>}
        {state === "incoming" && (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="flex items-center justify-center gap-2 rounded-xl bg-[#16a34a] px-3 py-3 text-sm" onClick={answer}>
              <PhoneIncoming size={16} /> {t("softphone.answer")}
            </button>
            <button type="button" className="flex items-center justify-center gap-2 rounded-xl bg-[#dc2626] px-3 py-3 text-sm" onClick={hangup}>
              <PhoneOff size={16} /> {t("softphone.decline")}
            </button>
          </div>
        )}
        {(state === "connecting" || state === "in-call") && (
          <button type="button" className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#dc2626] px-3 py-3 text-sm" onClick={hangup}>
            <PhoneOff size={16} /> {t("softphone.hangup")}
          </button>
        )}
        {(state === "error" || state === "disabled") && (
          <div className="space-y-3">
            {reason && <div className="break-all text-xs text-[#fca5a5]">{reason}</div>}
            <button type="button" className="chip flex items-center gap-2" onClick={() => setAttempt((value) => value + 1)}>
              <RefreshCw size={14} /> Повторить
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
