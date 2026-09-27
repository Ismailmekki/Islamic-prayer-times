/**
 * Unified Sound and Audio Service for Adhan, Quran, and Masbaha
 */

class SoundService {
  private adhanAudio: HTMLAudioElement | null = null;
  private quranAudio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;

  // Initialize Web Audio Context lazily upon user interaction
  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioCtx();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  /**
   * Plays a gentle subtle click tone for Tasbeeh / Masbaha
   */
  public playTasbeehClick(): void {
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(620, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(840, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch {
      // AudioContext may be restricted before gesture
    }
  }

  /**
   * Plays celebration chime when goal completed (e.g. 33 or 100 beads)
   */
  public playGoalCelebration(): void {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.2, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.3);
      });

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 60, 80]);
      }
    } catch {
      // ignore
    }
  }

  /**
   * Plays Adhan audio track
   */
  public playAdhan(
    url: string,
    onTimeUpdate?: (currentTime: number, duration: number) => void,
    onEnded?: () => void,
    onError?: (err: unknown) => void
  ): HTMLAudioElement {
    this.stopAdhan();

    const audio = new Audio(url);
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';

    audio.ontimeupdate = () => {
      if (onTimeUpdate) {
        onTimeUpdate(audio.currentTime, audio.duration || 0);
      }
    };

    audio.onended = () => {
      if (onEnded) onEnded();
    };

    audio.onerror = (e) => {
      // Fallback: If external MP3 fails to load, play synthesized calm Adhan melody
      this.playSyntheticAdhanMelody();
      if (onError) onError(e);
    };

    audio.play().catch((err) => {
      // Auto-play might be blocked without gesture
      if (onError) onError(err);
    });

    this.adhanAudio = audio;
    return audio;
  }

  public pauseAdhan(): void {
    if (this.adhanAudio) {
      this.adhanAudio.pause();
    }
  }

  public resumeAdhan(): void {
    if (this.adhanAudio) {
      this.adhanAudio.play().catch(() => {});
    }
  }

  public stopAdhan(): void {
    if (this.adhanAudio) {
      this.adhanAudio.pause();
      this.adhanAudio.currentTime = 0;
      this.adhanAudio = null;
    }
  }

  public setAdhanVolume(vol: number): void {
    if (this.adhanAudio) {
      this.adhanAudio.volume = Math.max(0, Math.min(1, vol));
    }
  }

  /**
   * Resilient fallback in case CDN audio fails:
   * Synthesizes the initial Takbeerat ("Allahu Akbar") melody notes with soft harmonics
   */
  public playSyntheticAdhanMelody(): void {
    try {
      const ctx = this.getAudioContext();
      const notes = [
        { freq: 293.66, dur: 1.2 }, // D4 - Al-
        { freq: 329.63, dur: 0.8 }, // E4 - laa-
        { freq: 392.00, dur: 2.0 }, // G4 - hu
        { freq: 349.23, dur: 0.8 }, // F4 - Ak-
        { freq: 293.66, dur: 2.2 }, // D4 - bar
      ];

      let t = ctx.currentTime + 0.1;
      notes.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.freq, t);

        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.25, t + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, t + n.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + n.dur);

        t += n.dur;
      });
    } catch {
      // AudioContext unavailable
    }
  }

  /**
   * Quran audio player
   */
  public playQuranAyah(
    audioUrl: string,
    onEnded?: () => void,
    onError?: () => void
  ): HTMLAudioElement {
    this.stopQuran();
    const audio = new Audio(audioUrl);
    audio.crossOrigin = 'anonymous';
    audio.onended = () => {
      if (onEnded) onEnded();
    };
    audio.onerror = () => {
      if (onError) onError();
    };
    audio.play().catch(() => {
      if (onError) onError();
    });
    this.quranAudio = audio;
    return audio;
  }

  public stopQuran(): void {
    if (this.quranAudio) {
      this.quranAudio.pause();
      this.quranAudio.currentTime = 0;
      this.quranAudio = null;
    }
  }

  private duaAudio: HTMLAudioElement | null = null;

  public playDuaAfterAdhan(onEnded?: () => void, onError?: () => void): HTMLAudioElement {
    this.stopDuaAfterAdhan();
    const audio = new Audio('/dua_after_adhan.mp3');
    audio.onended = () => {
      this.duaAudio = null;
      if (onEnded) onEnded();
    };
    audio.onerror = () => {
      this.duaAudio = null;
      if (onError) onError();
    };
    audio.play().catch(() => {
      this.duaAudio = null;
      if (onError) onError();
    });
    this.duaAudio = audio;
    return audio;
  }

  public stopDuaAfterAdhan(): void {
    if (this.duaAudio) {
      this.duaAudio.pause();
      this.duaAudio.currentTime = 0;
      this.duaAudio = null;
    }
  }

  public triggerQiblaAlignedHaptic(): void {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([30, 40, 50]);
    }
  }
}

export const soundService = new SoundService();
