export const sipReasons = ["", "NO_EXTENSION", "NOT_CONFIGURED", "AUTH_REQUIRED", "REGISTRATION_FAILED", "REGISTRATION_TIMEOUT", "CONNECTION_FAILED", "MICROPHONE_DENIED", "AUDIO_BLOCKED", "ICE_FAILED", "CALL_FAILED"] as const;
export function sipFailureReason(cause: string | undefined): typeof sipReasons[number] {
  if (cause === "User Denied Media Access" || cause === "NotAllowedError" || cause === "PermissionDeniedError") return "MICROPHONE_DENIED";
  if (cause === "WebRTC Error" || cause === "RTP Timeout") return "ICE_FAILED";
  return "CALL_FAILED";
}
