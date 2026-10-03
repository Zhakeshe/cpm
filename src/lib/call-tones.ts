/** Synthesized telephone tones: no external audio or permission prompts. */
export class CallTones {
  private context: AudioContext | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private voices = new Set<OscillatorNode>();
  async unlock() {
    this.context ||= new AudioContext();
    await this.context.resume();
    return this.context.state === "running";
  }
  start(kind: "incoming" | "outgoing") {
    this.stop();
    const pulse = () => {
      const ctx = this.context;
      if (!ctx || ctx.state !== "running") return;
      const frequency = kind === "incoming" ? 660 : 440;
      const offsets = kind === "incoming" ? [0, 0.35] : [0];
      for (const offset of offsets) {
        const oscillator = ctx.createOscillator(); const gain = ctx.createGain();
        const start = ctx.currentTime + offset; const duration = kind === "incoming" ? 0.2 : 1;
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.08, start + 0.02);
        gain.gain.setValueAtTime(0.08, start + duration - 0.02);
        gain.gain.linearRampToValueAtTime(0, start + duration);
        oscillator.connect(gain); gain.connect(ctx.destination);
        this.voices.add(oscillator);
        oscillator.onended = () => { this.voices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(start); oscillator.stop(start + duration);
      }
    };
    pulse(); this.timer = setInterval(pulse, kind === "incoming" ? 2400 : 4000);
  }
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    for (const voice of this.voices) { try { voice.stop(); } catch { /* already ended */ } }
    this.voices.clear();
  }
  close() { this.stop(); void this.context?.close(); this.context = null; }
}
