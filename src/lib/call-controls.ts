export type MicrophoneSession = {
  isMuted: () => { audio: boolean };
  mute: (options: { audio: boolean }) => void;
  unmute: (options: { audio: boolean }) => void;
};

export function toggleMicrophone(session: MicrophoneSession) {
  if (session.isMuted().audio) session.unmute({ audio: true });
  else session.mute({ audio: true });
  return session.isMuted().audio;
}

export async function requestZadarmaCall(contactId: string) {
  const signal = (name: string) => {
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(name, { detail: { contactId } }));
  };
  signal("crm:callback-pending");
  try {
    const response = await fetch("/api/calls", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contactId }),
    });
    const body = await response.json();
    if (!response.ok || body.accepted !== true) throw new Error(body.error || "ZADARMA_API_ERROR");
    return body;
  } catch (error) {
    signal("crm:callback-cancel");
    throw error;
  }
}
