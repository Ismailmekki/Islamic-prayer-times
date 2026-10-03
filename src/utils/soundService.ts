/**
 * Unified Sound and Audio Service for Adhan, Quran, and Masbaha
 * Includes active background audio unlocking and resilient playback
 * to ensure Adhan rings even when phone is locked or in background.
 */

// 1-second silent WAV audio data URI to maintain active mobile audio session
const SILENT_WAV_DATA_URI =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

class SoundService {
  private masterAudio: HTMLAudioElement | null = null;
  private adhanAudio: HTMLAudioElement | null = null;
  private duaAudio: HTMLAudioElement | null = null;
  private silentAudio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private playPromise: Promise<void> | null = null;
  private isUnlocked = false;

  // Initialize Web Audio Context lazily upon user interaction
  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioCtx();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    return this.audioContext;
  }

  /**
   * Lazily retrieve or construct a single Master Audio element in DOM.
   * Reusing this exact object is CRUCIAL because once unlocked by user gesture,
   * mobile browsers (Safari/Chrome) allow it to play even from background timers!
   */
  public getMasterAudio(): HTMLAudioElement {
    if (!this.masterAudio && typeof window !== 'undefined') {
      let el = document.getElementById('salati-master-audio-player') as HTMLAudioElement | null;
      if (!el) {
        el = document.createElement('audio');
        el.id = 'salati-master-audio-player';
        el.preload = 'auto';
        el.setAttribute('playsinline', 'true');
        el.setAttribute('webkit-playsinline', 'true');
        el.style.display = 'none';
        document.body.appendChild(el);
      }
      this.masterAudio = el;
      this.adhanAudio = el;
    }
    return this.masterAudio || new Audio();
  }

  /**
   * Unlock the mobile browser's audio session so background timers and
   * Adhan playback succeed reliably when phone is locked.
   */
  public async unlockAudioSession(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      // 1. Resume AudioContext
      const ctx = this.getAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }

      // 2. Play a brief zero-gain buffer to satisfy browser user-gesture requirements
      try {
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      } catch {}

      // 3. Prime the master audio element with silent data URI
      const master = this.getMasterAudio();
      master.src = SILENT_WAV_DATA_URI;
      master.volume = 0.01;
      await master.play().catch(() => {});

      // 4. Setup media session with background notification integration
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'صلاتي - مراقبة أوقات الأذان',
          artist: 'صلاتي',
          album: 'الأذان والصلوات المباركة',
          artwork: [
            { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          ],
        });
        navigator.mediaSession.playbackState = 'playing';
        navigator.mediaSession.setActionHandler('play', () => this.resumeAdhan());
        navigator.mediaSession.setActionHandler('pause', () => this.pauseAdhan());
        navigator.mediaSession.setActionHandler('stop', () => this.stopAdhan());
      }

      this.isUnlocked = true;
      return true;
    } catch (e) {
      console.warn('Audio session unlock warning:', e);
      this.isUnlocked = false;
      return false;
    }
  }

  public isAudioSessionUnlocked(): boolean {
    return this.isUnlocked;
  }

  /**
   * Play instant audible confirmation Takbeer ("الله أكبر")
   * Gives users 100% immediate confidence that audio works on their phone.
   */
  public playTakbeerConfirmation(): void {
    try {
      this.unlockAudioSession().catch(() => {});
      const audio = this.getMasterAudio();
      audio.src = '/audio/adhan/makkah.mp3';
      audio.currentTime = 0;
      audio.volume = 1.0;
      const playProm = audio.play();
      if (playProm) {
        playProm
          .then(() => {
            // Stop after 5 seconds of glorious takbeer
            setTimeout(() => {
              if (audio.src.includes('makkah.mp3')) {
                audio.pause();
                audio.currentTime = 0;
              }
            }, 6000);
          })
          .catch(() => {
            this.playSyntheticAdhanMelody();
          });
      }
    } catch {
      this.playSyntheticAdhanMelody();
    }
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
   * Plays Adhan audio track with crystal clear sound and background persistence.
   * Uses the pre-unlocked Master Audio element so it NEVER gets blocked by Autoplay policy!
   */
  public playAdhan(
    url: string,
    onTimeUpdate?: (currentTime: number, duration: number) => void,
    onEnded?: () => void,
    onError?: (err: unknown) => void
  ): HTMLAudioElement {
    this.stopAdhan();

    // Trigger haptic vibration on mobile
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([600, 300, 600, 300, 1200]);
      } catch {}
    }

    const audio = this.getMasterAudio();
    audio.src = url;
    audio.currentTime = 0;
    audio.volume = 1.0;

    audio.ontimeupdate = () => {
      if (onTimeUpdate) {
        onTimeUpdate(audio.currentTime, audio.duration || 0);
      }
    };

    audio.onended = () => {
      if (onEnded) onEnded();
    };

    audio.onerror = (e) => {
      console.warn('Adhan audio failed to load from:', url, e);
      // Fallback: If specific audio fails, fallback to local makkah adhan or synthetic melody
      if (!url.includes('/audio/adhan/makkah.mp3')) {
        audio.src = '/audio/adhan/makkah.mp3';
        this.playPromise = audio.play();
        this.playPromise.catch(() => {
          this.playSyntheticAdhanMelody();
        });
        return;
      }
      this.playSyntheticAdhanMelody();
      if (onError) onError(e);
    };

    this.adhanAudio = audio;
    this.playPromise = audio.play();

    this.playPromise
      .then(() => {
        this.isUnlocked = true;
      })
      .catch((err) => {
        // If aborted by pause (StrictMode), ignore; otherwise fallback to synthetic takbeerat
        if (err && (err as { name?: string }).name === 'AbortError') {
          return;
        }
        console.warn('Adhan auto-play prevented by browser, launching synthetic melody:', err);
        this.playSyntheticAdhanMelody();
        if (onError) onError(err);
      });

    return audio;
  }

  public pauseAdhan(): void {
    if (this.adhanAudio) {
      const audio = this.adhanAudio;
      if (this.playPromise) {
        this.playPromise.then(() => audio.pause()).catch(() => {});
      } else {
        audio.pause();
      }
    }
  }

  public resumeAdhan(): void {
    if (this.adhanAudio) {
      this.playPromise = this.adhanAudio.play();
      this.playPromise.catch(() => {});
    }
  }

  public stopAdhan(): void {
    if (this.adhanAudio) {
      const audio = this.adhanAudio;
      if (this.playPromise) {
        this.playPromise
          .then(() => {
            audio.pause();
            audio.currentTime = 0;
          })
          .catch(() => {});
      } else {
        audio.pause();
        audio.currentTime = 0;
      }
      this.adhanAudio = null;
    }
  }

  public setAdhanVolume(vol: number): void {
    if (this.adhanAudio) {
      this.adhanAudio.volume = Math.max(0, Math.min(1, vol));
    }
  }

  /**
   * Resilient fallback in case CDN audio fails or autoplay is restricted:
   * Synthesizes the initial Takbeerat ("Allahu Akbar") melody notes with soft harmonics
   */
  public playSyntheticAdhanMelody(): void {
    try {
      const ctx = this.getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const notes = [
        { freq: 293.66, dur: 1.2 }, // D4 - Al-
        { freq: 329.63, dur: 0.8 }, // E4 - laa-
        { freq: 392.0, dur: 2.0 }, // G4 - hu
        { freq: 349.23, dur: 0.8 }, // F4 - Ak-
        { freq: 293.66, dur: 2.2 }, // D4 - bar
        { freq: 329.63, dur: 0.8 }, // E4 - Al-
        { freq: 392.0, dur: 2.2 }, // G4 - laa-hu
        { freq: 349.23, dur: 0.8 }, // F4 - Ak-
        { freq: 293.66, dur: 2.2 }, // D4 - bar
      ];

      let t = ctx.currentTime + 0.1;
      notes.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.freq, t);

        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.5, t + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, t + n.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + n.dur);
        t += n.dur * 0.9;
      });
    } catch {
      // AudioContext may be restricted
    }
  }

  public playDuaAfterAdhan(onEnded?: () => void): void {
    this.stopDuaAfterAdhan();
    const audio = new Audio('/dua_after_adhan.mp3');
    audio.preload = 'auto';
    audio.volume = 1.0;
    audio.onended = () => {
      if (onEnded) onEnded();
    };
    audio.onerror = () => {
      const fallback = new Audio('/public/dua_after_adhan.mp3');
      fallback.onended = () => {
        if (onEnded) onEnded();
      };
      fallback.play().catch(() => {});
      this.duaAudio = fallback;
    };
    audio.play().catch(() => {});
    this.duaAudio = audio;
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
      try {
        navigator.vibrate([100, 50, 150]);
      } catch {}
    }
  }

  public playQiblaAlignedTone(): void {
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // ignore
    }
  }
}

export const soundService = new SoundService();
