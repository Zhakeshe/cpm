"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Phone, PhoneIncoming, PhoneOff, RefreshCw } from "lucide-react";
import { sipFailureReason, type sipReasons } from "@/lib/sip-diagnostics";
import { useI18n } from "@/components/I18nProvider";

type SipConfig =
  | { enabled: false; reason: string }
  | { enabled: true; wsUrl: string; uri: string; password: string; extension: string; displayName: string };

type CallState = "registering" | "ready" | "incoming" | "connecting" | "in-call" | "disabled" | "error";
type PeerConnectionEvent = { peerconnection?: RTCPeerConnection };
type SessionEventHandler = (event?: PeerConnectionEvent & { cause?: string }) => void;
type JsSipSession = {
  answer: (options: { mediaConstraints: { audio: boolean; video: boolean } }) => void;
  terminate: (options?: { status_code: number; reason_phrase: string }) => void;
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
  const [reason, setReason] = useState<typeof sipReasons[number]>("");
  const [micResult, setMicResult] = useState("");
  const [testingMic, setTestingMic] = useState(false);
  const registeredRef = useRef(false);
  const micStream = useRef<MediaStream | null>(null);
  const attached = useRef(new WeakSet<RTCPeerConnection>());
  const [attempt, setAttempt] = useState(0);
  const uaRef = useRef<UaLike | null>(null);
  const sessionRef = useRef<JsSipSession | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const attachAudio = useCallback((session: JsSipSession, connection?: RTCPeerConnection) => {
    const pc = connection || session.connection;
    if (!pc || attached.current.has(pc)) return;
    attached.current.add(pc);
    pc.addEventListener("iceconnectionstatechange", () => { if (pc.iceConnectionState === "failed") setReason("ICE_FAILED"); });
    const play = (stream: MediaStream) => {
      if (!audioRef.current) return;
      audioRef.current.srcObject = stream;
      audioRef.current.play().catch(() => setReason("AUDIO_BLOCKED"));
    };
    pc.addEventListener("track", (event) => {
      const stream = event.streams[0] || new MediaStream([event.track]);
      play(stream);
    });
    const tracks = (pc.getReceivers?.() || []).map((receiver) => receiver.track).filter(Boolean);
    if (tracks.length) play(new MediaStream(tracks));
  }, []);

  useEffect(() => {
    let cancelled = false;
    let registrationTimer: ReturnType<typeof setTimeout>;
    const startTimeout = () => {
      clearTimeout(registrationTimer);
      registrationTimer = setTimeout(() => { if (!cancelled && !registeredRef.current && !sessionRef.current) { setState("error"); setReason("REGISTRATION_TIMEOUT"); } }, 30_000);
    };
    startTimeout();

    async function boot() {
      setState("registering");
      setReason("");
      const response = await fetch("/api/sip/credentials", { cache: "no-store" });
      if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "AUTH_REQUIRED" : "CONNECTION_FAILED");
      const config = await response.json() as SipConfig;
      if (cancelled) return;
      if (!config.enabled) {
        setReason(config.reason === "NO_EXTENSION" ? "NO_EXTENSION" : "NOT_CONFIGURED");
        clearTimeout(registrationTimer); setState("disabled");
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
        if (cancelled) return;
        registeredRef.current = true; clearTimeout(registrationTimer); setReason("");
        if (!cancelled) setState((current) => current === "registering" || current === "error" ? "ready" : current);
      });
      ua.on("registrationFailed", (event) => {
        if (!cancelled) {
          registeredRef.current = false; clearTimeout(registrationTimer);
          setReason("REGISTRATION_FAILED");
          setState("error");
        }
      });
      ua.on("disconnected", () => {
        if (cancelled) return;
        registeredRef.current = false; startTimeout(); setReason("CONNECTION_FAILED");
        if (!sessionRef.current) setState("registering");
      });
      ua.on("unregistered", () => { if (!cancelled) { registeredRef.current = false; startTimeout(); if (!sessionRef.current) setState("registering"); } });
      ua.on("newRTCSession", (event) => {
        if (cancelled || !event?.session) return;
        if (sessionRef.current && sessionRef.current !== event.session) { event.session.terminate({ status_code: 486, reason_phrase: "Busy Here" }); return; }
        const session = event.session;
        sessionRef.current = session;
        setPeer(session.remote_identity?.uri?.user || "");
        session.on("peerconnection", (data) => attachAudio(session, data?.peerconnection));
        session.on("accepted", () => { if (cancelled) return; setState("in-call"); attachAudio(session); });
        session.on("confirmed", () => { if (cancelled) return; setState("in-call"); attachAudio(session); });
        const finish = () => {
          if (cancelled || sessionRef.current !== session) return;
          sessionRef.current = null;
          if (audioRef.current) audioRef.current.srcObject = null;
          setPeer("");
          setState(registeredRef.current ? "ready" : "registering");
        };
        session.on("ended", finish);
        session.on("failed", (data) => { if (cancelled) return; finish(); setReason(sipFailureReason(data?.cause)); });
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
      clearTimeout(registrationTimer);
      if (!cancelled) {
        setReason(error instanceof Error && error.message === "AUTH_REQUIRED" ? "AUTH_REQUIRED" : "CONNECTION_FAILED");
        setState("error");
      }
    });
    return () => {
      cancelled = true; clearTimeout(registrationTimer); registeredRef.current = false;
      try { sessionRef.current?.terminate(); } catch { /* Already ended. */ }
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
      setReason(sipFailureReason(error instanceof Error ? error.name : undefined));
      setState("error");
    }
  }

  function hangup() {
    try { sessionRef.current?.terminate(); } catch { /* Already ended. */ }
    sessionRef.current = null;
    setPeer("");
    if (audioRef.current) audioRef.current.srcObject = null;
    setState(registeredRef.current ? "ready" : "registering");
  }

  useEffect(() => {
    const report = () => { void fetch("/api/sip/diagnostics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ state, reason }) }).catch(() => undefined); };
    report(); const timer = setInterval(report, 60_000);
    return () => clearInterval(timer);
  }, [state, reason]);

  useEffect(() => () => { micStream.current?.getTracks().forEach(track => track.stop()); }, []);

  async function testMicrophone() {
    if (testingMic || sessionRef.current) return;
    setTestingMic(true); setMicResult("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      micStream.current = stream;
      setMicResult(t("stability.micPassed"));
      stream.getTracks().forEach(track => track.stop()); micStream.current = null;
    } catch { setMicResult(t("stability.micDenied")); }
    finally { setTestingMic(false); }
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
        <div className="text-xs muted">{t("stability.sipBrowser")}</div>
        <button className="chip" disabled={testingMic || state === "in-call" || state === "incoming" || state === "connecting"} onClick={testMicrophone}>{t("stability.testMic")}</button>
        {micResult && <p role="status" className="text-xs">{micResult}</p>}
        {reason && <p role="alert" className="text-xs text-[#fca5a5]">{t(`stability.sipErrors.${reason}`, t("stability.sipErrors.CALL_FAILED"))}</p>}
        {reason === "AUDIO_BLOCKED" && <button className="chip" onClick={() => { void audioRef.current?.play().then(() => setReason("")).catch(() => setReason("AUDIO_BLOCKED")); }}>{t("stability.enableAudio")}</button>}
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
            <button type="button" className="chip flex items-center gap-2" onClick={() => setAttempt((value) => value + 1)}>
              <RefreshCw size={14} /> {t("stability.retry")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
