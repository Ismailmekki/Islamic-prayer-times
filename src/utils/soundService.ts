/**
 * Unified Sound and Audio Service for Adhan, Quran, and Masbaha
 * Includes active background audio unlocking, persistent full Adhan playback,
 * and resilient fallbacks so the Call to Prayer NEVER cuts off prematurely.
 */

// 1-second silent WAV audio data URI to maintain active mobile audio session
const SILENT_WAV_DATA_URI =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

export interface AdhanPlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  audioUrl: string;
  prayerName: string;
  reciterTitle?: string;
}

const ADHAN_MIRRORS: Record<string, string[]> = {
  '/audio/adhan/makkah.mp3': [
    'https://archive.org/download/full-madinah.mp3/full-makkah.mp3.mp3',
    '/audio/adhan/alafasy.mp3',
  ],
  '/audio/adhan/madinah.mp3': [
    'https://archive.org/download/full-madinah.mp3/full-madinah.mp3.mp3',
    '/audio/adhan/makkah.mp3',
  ],
  '/audio/adhan/alafasy.mp3': [
    'https://archive.org/download/full-madinah.mp3/full-makkah.mp3.mp3',
    '/audio/adhan/makkah.mp3',
  ],
  '/audio/adhan/dhuhr.mp3': ['/audio/adhan/makkah.mp3'],
  '/audio/adhan/asr.mp3': ['/audio/adhan/makkah.mp3'],
  '/audio/adhan/fajr.mp3': ['/audio/adhan/makkah.mp3'],
  '/audio/adhan/nafees.mp3': ['/audio/adhan/alafasy.mp3'],
  '/audio/adhan/abdulbasit.mp3': ['/audio/adhan/makkah.mp3'],
  '/audio/adhan/alaqsa.mp3': ['/audio/adhan/makkah.mp3'],
};

class SoundService {
  private masterAudio: HTMLAudioElement | null = null;
  private adhanAudio: HTMLAudioElement | null = null;
  private duaAudio: HTMLAudioElement | null = null;
  private silentLoopAudio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private playPromise: Promise<void> | null = null;
  private isUnlocked = false;

  private stateSubscribers: Set<(state: AdhanPlaybackState) => void> = new Set();
  private currentState: AdhanPlaybackState = {
    isPlaying: false,
    isPaused: false,
    currentTime: 0,
    duration: 0,
    audioUrl: '',
    prayerName: '',
    reciterTitle: '',
  };

  // Web Audio synth cancel token
  private synthCancelFn: (() => void) | null = null;

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
   * Subscribes to global Adhan playback state updates so any UI
   * (modal, persistent bottom mini-player bar) stays in sync.
   */
  public subscribeState(listener: (state: AdhanPlaybackState) => void): () => void {
    this.stateSubscribers.add(listener);
    listener(this.currentState);
    return () => {
      this.stateSubscribers.delete(listener);
    };
  }

  public getState(): AdhanPlaybackState {
    return this.currentState;
  }

  private updateState(partial: Partial<AdhanPlaybackState>): void {
    this.currentState = { ...this.currentState, ...partial };
    this.stateSubscribers.forEach((fn) => {
      try {
        fn(this.currentState);
      } catch (err) {
        console.error('Error in state subscriber:', err);
      }
    });
  }

  /**
   * Lazily retrieve or construct a single Master Audio element in DOM.
   * Reusing this exact object is CRUCIAL because once unlocked by user gesture,
   * mobile browsers allow it to play even from background timers!
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

      // 4. Start continuous background silent loop to keep mobile OS audio session open
      this.startSilentKeepAlive();

      // 5. Setup media session with background notification integration
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'صلاتي - نداء الصلاة والأذان المبارك',
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

  /**
   * Continuous silent audio loop:
   * Keeps mobile OS (iOS & Android) audio session ALIVE in the background
   * so timers fire and Adhan plays at full volume even when screen is locked!
   */
  public startSilentKeepAlive(): void {
    if (typeof window === 'undefined') return;
    try {
      if (!this.silentLoopAudio) {
        let el = document.getElementById('salati-silent-loop-player') as HTMLAudioElement | null;
        if (!el) {
          el = document.createElement('audio');
          el.id = 'salati-silent-loop-player';
          el.preload = 'auto';
          el.loop = true;
          el.setAttribute('playsinline', 'true');
          el.setAttribute('webkit-playsinline', 'true');
          el.style.display = 'none';
          document.body.appendChild(el);
        }
        this.silentLoopAudio = el;
      }
      this.silentLoopAudio.src = SILENT_WAV_DATA_URI;
      this.silentLoopAudio.volume = 0.001;
      this.silentLoopAudio.play().catch(() => {});
    } catch {}
  }

  public stopSilentKeepAlive(): void {
    if (this.silentLoopAudio) {
      try {
        this.silentLoopAudio.pause();
      } catch {}
    }
  }

  public isAudioSessionUnlocked(): boolean {
    return this.isUnlocked;
  }

  /**
   * Play full audible Adhan confirmation.
   * Plays the complete Adhan without cutting off!
   */
  public playTakbeerConfirmation(audioUrl = '/audio/adhan/makkah.mp3'): void {
    this.playAdhan(audioUrl, { prayerName: 'الأذان المبارك', reciterTitle: 'أذان الحرم المكي الشريف' });
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
   * Plays the ENTIRE COMPLETE ADHAN without any artificial cutoff.
   * Supports mirrors and full synthesis fallback if needed.
   */
  public playAdhan(
    url: string,
    options?: {
      prayerName?: string;
      reciterTitle?: string;
      onTimeUpdate?: (currentTime: number, duration: number) => void;
      onEnded?: () => void;
      onError?: (err: unknown) => void;
    }
  ): HTMLAudioElement {
    this.stopAdhan();
    this.stopSilentKeepAlive();

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

    const prayerTitle = options?.prayerName || 'الصلاة';
    const reciterText = options?.reciterTitle || 'صوت ندي خاشع';

    this.updateState({
      isPlaying: true,
      isPaused: false,
      currentTime: 0,
      duration: 0,
      audioUrl: url,
      prayerName: prayerTitle,
      reciterTitle: reciterText,
    });

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `أذان ${prayerTitle}`,
        artist: reciterText,
        album: 'نداء الصلاة - صلاتي',
        artwork: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      });
      navigator.mediaSession.playbackState = 'playing';
    }

    audio.ontimeupdate = () => {
      const cur = audio.currentTime;
      const dur = audio.duration || 0;
      this.updateState({
        currentTime: cur,
        duration: dur,
        isPlaying: !audio.paused,
      });
      if (options?.onTimeUpdate) {
        options.onTimeUpdate(cur, dur);
      }
    };

    audio.onended = () => {
      this.updateState({
        isPlaying: false,
        isPaused: false,
        currentTime: 0,
      });
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'none';
      }
      this.startSilentKeepAlive();
      if (options?.onEnded) options.onEnded();
    };

    let attemptedMirrors = 0;
    audio.onerror = (e) => {
      console.warn('Adhan audio failed to load from:', audio.src, e);
      const mirrors = ADHAN_MIRRORS[url] || [];
      if (attemptedMirrors < mirrors.length) {
        const nextUrl = mirrors[attemptedMirrors];
        attemptedMirrors++;
        console.log('Failing over to mirror Adhan URL:', nextUrl);
        audio.src = nextUrl;
        this.playPromise = audio.play();
        this.playPromise.catch(() => {
          this.playSyntheticAdhanMelody();
        });
        return;
      }
      // If all files fail, synthesize the COMPLETE Adhan
      this.playSyntheticAdhanMelody();
      if (options?.onError) options.onError(e);
    };

    this.adhanAudio = audio;
    this.playPromise = audio.play();

    this.playPromise
      .then(() => {
        this.isUnlocked = true;
        this.updateState({ isPlaying: true, isPaused: false });
      })
      .catch((err) => {
        if (err && (err as { name?: string }).name === 'AbortError') {
          return;
        }
        console.warn('Adhan auto-play prevented by browser, launching full synthetic melody:', err);
        this.playSyntheticAdhanMelody();
        if (typeof window !== 'undefined') {
          const handleFirstTouch = () => {
            audio.play().catch(() => {});
            window.removeEventListener('pointerdown', handleFirstTouch);
            window.removeEventListener('touchstart', handleFirstTouch);
          };
          window.addEventListener('pointerdown', handleFirstTouch, { once: true });
          window.addEventListener('touchstart', handleFirstTouch, { once: true });
        }
        if (options?.onError) options.onError(err);
      });

    return audio;
  }

  public pauseAdhan(): void {
    if (this.synthCancelFn) {
      this.synthCancelFn();
      this.synthCancelFn = null;
    }
    if (this.adhanAudio) {
      const audio = this.adhanAudio;
      if (this.playPromise) {
        this.playPromise
          .then(() => {
            audio.pause();
            this.updateState({ isPaused: true, isPlaying: false });
            if ('mediaSession' in navigator) {
              navigator.mediaSession.playbackState = 'paused';
            }
          })
          .catch(() => {});
      } else {
        audio.pause();
        this.updateState({ isPaused: true, isPlaying: false });
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'paused';
        }
      }
    }
  }

  public resumeAdhan(): void {
    if (this.adhanAudio) {
      this.playPromise = this.adhanAudio.play();
      this.playPromise
        .then(() => {
          this.updateState({ isPaused: false, isPlaying: true });
          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
          }
        })
        .catch(() => {});
    }
  }

  public stopAdhan(): void {
    if (this.synthCancelFn) {
      this.synthCancelFn();
      this.synthCancelFn = null;
    }
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
    this.updateState({
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
      duration: 0,
    });
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'none';
    }
    this.startSilentKeepAlive();
  }

  public seekAdhan(seconds: number): void {
    if (this.adhanAudio) {
      this.adhanAudio.currentTime = Math.max(0, Math.min(seconds, this.adhanAudio.duration || 0));
    }
  }

  public setAdhanVolume(vol: number): void {
    if (this.adhanAudio) {
      this.adhanAudio.volume = Math.max(0, Math.min(1, vol));
    }
  }

  /**
   * Resilient synthesizer of the ENTIRE COMPLETE ADHAN:
   * When MP3 files cannot be loaded, this synthesizes the COMPLETE Call to Prayer
   * in traditional Maqam Bayati with soft acoustic harmonics:
   * 1. الله أكبر، الله أكبر (مرتان)
   * 2. أشهد أن لا إله إلا الله (مرتان)
   * 3. أشهد أن محمداً رسول الله (مرتان)
   * 4. حي على الصلاة (مرتان)
   * 5. حي على الفلاح (مرتان)
   * 6. الله أكبر، الله أكبر
   * 7. لا إله إلا الله
   */
  public playSyntheticAdhanMelody(): void {
    try {
      const ctx = this.getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      // Complete Adhan Melody in Maqam Bayati
      // Notes: D4 (293.66), Eb4 (311.13), E4 (329.63), F4 (349.23), G4 (392.0), A4 (440.0), Bb4 (466.16), C5 (523.25), D5 (587.33)
      const completeAdhanPhrases: Array<{ phrase: string; notes: Array<{ freq: number; dur: number }> }> = [
        // 1. Allahu Akbar Allahu Akbar
        {
          phrase: 'اللهُ أَكْبَرُ، اللهُ أَكْبَرُ',
          notes: [
            { freq: 293.66, dur: 1.2 }, { freq: 349.23, dur: 1.0 }, { freq: 392.0, dur: 2.2 },
            { freq: 349.23, dur: 0.8 }, { freq: 293.66, dur: 2.4 },
            { freq: 293.66, dur: 1.0 }, { freq: 349.23, dur: 1.2 }, { freq: 392.0, dur: 2.4 },
            { freq: 349.23, dur: 0.8 }, { freq: 293.66, dur: 2.5 },
          ],
        },
        // 2. Allahu Akbar Allahu Akbar (repeat)
        {
          phrase: 'اللهُ أَكْبَرُ، اللهُ أَكْبَرُ',
          notes: [
            { freq: 349.23, dur: 1.2 }, { freq: 392.0, dur: 1.2 }, { freq: 440.0, dur: 2.4 },
            { freq: 392.0, dur: 0.9 }, { freq: 349.23, dur: 2.2 },
            { freq: 293.66, dur: 1.1 }, { freq: 349.23, dur: 1.3 }, { freq: 392.0, dur: 2.5 },
            { freq: 349.23, dur: 0.9 }, { freq: 293.66, dur: 2.6 },
          ],
        },
        // 3. Ashhadu an la ilaha illa Allah (1)
        {
          phrase: 'أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللهُ',
          notes: [
            { freq: 293.66, dur: 1.1 }, { freq: 349.23, dur: 1.2 }, { freq: 392.0, dur: 2.0 },
            { freq: 440.0, dur: 1.8 }, { freq: 392.0, dur: 1.5 }, { freq: 349.23, dur: 1.4 },
            { freq: 311.13, dur: 1.2 }, { freq: 293.66, dur: 3.0 },
          ],
        },
        // 4. Ashhadu an la ilaha illa Allah (2)
        {
          phrase: 'أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللهُ',
          notes: [
            { freq: 293.66, dur: 1.1 }, { freq: 349.23, dur: 1.2 }, { freq: 392.0, dur: 2.0 },
            { freq: 440.0, dur: 1.8 }, { freq: 392.0, dur: 1.5 }, { freq: 349.23, dur: 1.4 },
            { freq: 311.13, dur: 1.2 }, { freq: 293.66, dur: 3.2 },
          ],
        },
        // 5. Ashhadu anna Muhammadan Rasulullah (1)
        {
          phrase: 'أَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللهِ',
          notes: [
            { freq: 349.23, dur: 1.2 }, { freq: 392.0, dur: 1.4 }, { freq: 440.0, dur: 2.2 },
            { freq: 523.25, dur: 1.8 }, { freq: 440.0, dur: 1.6 }, { freq: 392.0, dur: 1.5 },
            { freq: 349.23, dur: 1.3 }, { freq: 293.66, dur: 3.0 },
          ],
        },
        // 6. Ashhadu anna Muhammadan Rasulullah (2)
        {
          phrase: 'أَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللهِ',
          notes: [
            { freq: 349.23, dur: 1.2 }, { freq: 392.0, dur: 1.4 }, { freq: 440.0, dur: 2.2 },
            { freq: 523.25, dur: 1.8 }, { freq: 440.0, dur: 1.6 }, { freq: 392.0, dur: 1.5 },
            { freq: 349.23, dur: 1.3 }, { freq: 293.66, dur: 3.2 },
          ],
        },
        // 7. Hayya 'ala as-Salah (1)
        {
          phrase: 'حَيَّ عَلَى الصَّلَاةِ',
          notes: [
            { freq: 392.0, dur: 1.4 }, { freq: 440.0, dur: 1.5 }, { freq: 523.25, dur: 2.6 },
            { freq: 440.0, dur: 1.5 }, { freq: 392.0, dur: 1.8 }, { freq: 349.23, dur: 2.5 },
          ],
        },
        // 8. Hayya 'ala as-Salah (2)
        {
          phrase: 'حَيَّ عَلَى الصَّلَاةِ',
          notes: [
            { freq: 392.0, dur: 1.4 }, { freq: 440.0, dur: 1.5 }, { freq: 523.25, dur: 2.8 },
            { freq: 440.0, dur: 1.5 }, { freq: 392.0, dur: 1.8 }, { freq: 349.23, dur: 2.8 },
          ],
        },
        // 9. Hayya 'ala al-Falah (1)
        {
          phrase: 'حَيَّ عَلَى الْفَلَاحِ',
          notes: [
            { freq: 349.23, dur: 1.3 }, { freq: 392.0, dur: 1.6 }, { freq: 440.0, dur: 2.5 },
            { freq: 392.0, dur: 1.4 }, { freq: 349.23, dur: 1.6 }, { freq: 293.66, dur: 2.8 },
          ],
        },
        // 10. Hayya 'ala al-Falah (2)
        {
          phrase: 'حَيَّ عَلَى الْفَلَاحِ',
          notes: [
            { freq: 349.23, dur: 1.3 }, { freq: 392.0, dur: 1.6 }, { freq: 440.0, dur: 2.6 },
            { freq: 392.0, dur: 1.4 }, { freq: 349.23, dur: 1.6 }, { freq: 293.66, dur: 3.0 },
          ],
        },
        // 11. Allahu Akbar Allahu Akbar
        {
          phrase: 'اللهُ أَكْبَرُ، اللهُ أَكْبَرُ',
          notes: [
            { freq: 293.66, dur: 1.2 }, { freq: 349.23, dur: 1.0 }, { freq: 392.0, dur: 2.2 },
            { freq: 349.23, dur: 0.8 }, { freq: 293.66, dur: 2.4 },
            { freq: 293.66, dur: 1.0 }, { freq: 349.23, dur: 1.2 }, { freq: 392.0, dur: 2.4 },
            { freq: 349.23, dur: 0.8 }, { freq: 293.66, dur: 2.8 },
          ],
        },
        // 12. La ilaha illa Allah
        {
          phrase: 'لَا إِلَهَ إِلَّا اللهُ',
          notes: [
            { freq: 293.66, dur: 1.4 }, { freq: 349.23, dur: 1.6 }, { freq: 392.0, dur: 2.0 },
            { freq: 349.23, dur: 1.5 }, { freq: 311.13, dur: 1.4 }, { freq: 293.66, dur: 4.5 },
          ],
        },
      ];

      // Flatten all notes and schedule with smooth harmonic overtones
      let totalDuration = 0;
      completeAdhanPhrases.forEach((p) => {
        p.notes.forEach((n) => {
          totalDuration += n.dur * 0.95;
        });
      });

      this.updateState({
        isPlaying: true,
        isPaused: false,
        duration: Math.round(totalDuration),
        currentTime: 0,
      });

      const activeOscs: OscillatorNode[] = [];
      let t = ctx.currentTime + 0.1;

      completeAdhanPhrases.forEach((phrase) => {
        phrase.notes.forEach((n) => {
          // Fundamental oscillator
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(n.freq, t);

          // Subtle warm octave overtone
          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(n.freq * 2, t);

          gain.gain.setValueAtTime(0.001, t);
          gain.gain.linearRampToValueAtTime(0.35, t + 0.18);
          gain.gain.exponentialRampToValueAtTime(0.001, t + n.dur);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(t);
          osc1.stop(t + n.dur);
          osc2.start(t);
          osc2.stop(t + n.dur);

          activeOscs.push(osc1, osc2);
          t += n.dur * 0.95;
        });
      });

      this.synthCancelFn = () => {
        activeOscs.forEach((o) => {
          try {
            o.stop();
          } catch {}
        });
        activeOscs.length = 0;
      };

      // When synth completes
      const timer = setTimeout(() => {
        this.updateState({ isPlaying: false, isPaused: false, currentTime: 0 });
        this.synthCancelFn = null;
      }, totalDuration * 1000);

      const oldCancel = this.synthCancelFn;
      this.synthCancelFn = () => {
        clearTimeout(timer);
        oldCancel();
      };
    } catch {
      // AudioContext restricted
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
