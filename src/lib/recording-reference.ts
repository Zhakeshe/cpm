export type RecordedCall = {
  recordingUrl?: string | null;
  recordings?: Array<{ url?: string | null }>;
};

/** Both legacy Call URLs and separate Recording rows are playable references. */
export function recordingReference(call: RecordedCall): string | null {
  return call.recordingUrl || call.recordings?.find((recording) => recording.url)?.url || null;
}
