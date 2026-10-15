/**
 * Singapore Public Transit Audio Chimes using Web Audio API
 * Provides clean, authentic arrival chimes without external assets.
 */

class SoundService {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    // Lazy initialize on first user interaction
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Authentic Singapore transit approaching chime
   * Pleasant ascending 3-tone chime (F#4 -> A4 -> C#5)
   */
  public playApproachingChime() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const notes = [369.99, 440.00, 554.37]; // F#4, A4, C#5
      const startTime = ctx.currentTime + 0.05;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime + idx * 0.14);

        gain.gain.setValueAtTime(0, startTime + idx * 0.14);
        gain.gain.linearRampToValueAtTime(0.22, startTime + idx * 0.14 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + idx * 0.14 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime + idx * 0.14);
        osc.stop(startTime + idx * 0.14 + 0.36);
      });
    } catch {
      // Audio playback best-effort
    }
  }

  /**
   * Arriving at Stop chime (two-tone chime)
   */
  public playArrivedChime() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const notes = [587.33, 880.00]; // D5 -> A5
      const startTime = ctx.currentTime + 0.05;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime + idx * 0.18);

        gain.gain.setValueAtTime(0, startTime + idx * 0.18);
        gain.gain.linearRampToValueAtTime(0.25, startTime + idx * 0.18 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + idx * 0.18 + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime + idx * 0.18);
        osc.stop(startTime + idx * 0.18 + 0.46);
      });
    } catch {
      // Best-effort
    }
  }
}

export const soundService = new SoundService();
