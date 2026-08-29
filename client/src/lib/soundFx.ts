let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    void audioCtx.resume();
  }
  return audioCtx;
}

/** Play a subtle harmonic resonant chime for interface interactions. */
export function playChime(freq = 520, duration = 0.35, isEnabled = true) {
  if (!isEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      freq * 1.5,
      ctx.currentTime + duration
    );

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Gracefully handle browser autoplay policies
  }
}

/** Play a subtle toggle transition sound. */
export function playToggleSound(turningOn: boolean, isEnabled = true) {
  if (!isEnabled && !turningOn) return;
  if (turningOn) {
    playChime(440, 0.25, true);
    setTimeout(() => playChime(660, 0.3, true), 80);
  } else {
    playChime(330, 0.15, true);
  }
}
