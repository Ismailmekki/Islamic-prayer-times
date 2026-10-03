/**
 * Background Adhan & Notification Service
 * Ensures Adhan and prayer notifications trigger reliably even when
 * the phone is locked, in background, or offline.
 */

import { PrayerTimeItem, AdhanVoice } from '../types/prayer';
import { ADHAN_VOICES } from '../data/adhanSounds';
import { soundService } from '../utils/soundService';

export interface PrayerReminderRule {
  enabled: boolean;
  preAlertMinutes: number; // 0 for at prayer time only, or 5, 10, 15, 20, 30 min before
  soundType: 'adhan' | 'takbeer' | 'beep' | 'silent';
}

export interface PrayerRemindersPerPrayer {
  fajr: PrayerReminderRule;
  sunrise: PrayerReminderRule;
  duha: PrayerReminderRule;
  dhuhr: PrayerReminderRule;
  jumuah: PrayerReminderRule;
  asr: PrayerReminderRule;
  maghrib: PrayerReminderRule;
  isha: PrayerReminderRule;
  qiyam: PrayerReminderRule;
}

export const DEFAULT_PRAYER_REMINDERS: PrayerRemindersPerPrayer = {
  fajr: { enabled: true, preAlertMinutes: 10, soundType: 'adhan' },
  sunrise: { enabled: false, preAlertMinutes: 5, soundType: 'beep' },
  duha: { enabled: true, preAlertMinutes: 0, soundType: 'beep' },
  dhuhr: { enabled: true, preAlertMinutes: 5, soundType: 'adhan' },
  jumuah: { enabled: true, preAlertMinutes: 20, soundType: 'adhan' },
  asr: { enabled: true, preAlertMinutes: 5, soundType: 'adhan' },
  maghrib: { enabled: true, preAlertMinutes: 5, soundType: 'adhan' },
  isha: { enabled: true, preAlertMinutes: 5, soundType: 'adhan' },
  qiyam: { enabled: false, preAlertMinutes: 15, soundType: 'takbeer' },
};

export interface BackgroundAdhanConfig {
  enabled: boolean;
  notifyWithFullAudio: boolean;
  keepActiveInBackground: boolean; // Keeps silent audio session alive for background wake
  autoBypassActive: boolean; // Automatically bypasses browser notification block with direct in-app audio
  preAlertMinutes: number;
  fajrEnabled: boolean;
  duhaEnabled: boolean;
  dhuhrEnabled: boolean;
  jumuahEnabled: boolean;
  asrEnabled: boolean;
  maghribEnabled: boolean;
  ishaEnabled: boolean;
  prayerReminders: PrayerRemindersPerPrayer;
}

export interface NotificationStateInfo {
  permission: NotificationPermission | 'unsupported';
  isIOS: boolean;
  isStandalone: boolean;
  isSupported: boolean;
  needsPWAInstallOnIOS: boolean;
  isAudioSessionActive: boolean;
  autoBypassActive: boolean;
}

const STORAGE_KEY = 'salati_bg_adhan_config';

const DEFAULT_CONFIG: BackgroundAdhanConfig = {
  enabled: true,
  notifyWithFullAudio: true,
  keepActiveInBackground: true,
  autoBypassActive: true,
  preAlertMinutes: 0,
  fajrEnabled: true,
  duhaEnabled: true,
  dhuhrEnabled: true,
  jumuahEnabled: true,
  asrEnabled: true,
  maghribEnabled: true,
  ishaEnabled: true,
  prayerReminders: DEFAULT_PRAYER_REMINDERS,
};

class BackgroundAdhanService {
  private config: BackgroundAdhanConfig;
  private checkIntervalId: number | null = null;
  private workerTimer: Worker | null = null;
  private exactTimerIds: number[] = [];
  private triggeredAlertKeys: Set<string> = new Set();
  private onAdhanTriggerCallback: ((prayerName: string, voice: AdhanVoice) => void) | null = null;
  private wakeLock: unknown = null;
  private lastPrayerProvider: (() => { prayerList: PrayerTimeItem[]; cityName: string; selectedVoice: AdhanVoice }) | null = null;

  constructor() {
    this.config = this.loadConfig();
    this.triggeredAlertKeys = this.loadTriggeredAlertKeys();
    this.initVisibilityListeners();
  }

  private loadTriggeredAlertKeys(): Set<string> {
    if (typeof window === 'undefined') return new Set();
    try {
      const today = new Date().toDateString();
      const raw = localStorage.getItem(`salati_adhan_alerts_${today}`);
      if (raw) return new Set(JSON.parse(raw));
    } catch {}
    return new Set();
  }

  private markAlertTriggered(key: string): void {
    this.triggeredAlertKeys.add(key);
    if (typeof window === 'undefined') return;
    try {
      const today = new Date().toDateString();
      localStorage.setItem(
        `salati_adhan_alerts_${today}`,
        JSON.stringify(Array.from(this.triggeredAlertKeys))
      );
    } catch {}
  }

  public loadConfig(): BackgroundAdhanConfig {
    if (typeof window === 'undefined') return DEFAULT_CONFIG;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          prayerReminders: {
            ...DEFAULT_PRAYER_REMINDERS,
            ...(parsed.prayerReminders || {}),
          },
        };
      }
    } catch {
      // fallback
    }
    return DEFAULT_CONFIG;
  }

  public saveConfig(config: BackgroundAdhanConfig): void {
    this.config = config;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }
  }

  public getConfig(): BackgroundAdhanConfig {
    return { ...this.config };
  }

  public updateConfig(partial: Partial<BackgroundAdhanConfig>): BackgroundAdhanConfig {
    const updated: BackgroundAdhanConfig = {
      ...this.config,
      ...partial,
      prayerReminders: partial.prayerReminders
        ? { ...this.config.prayerReminders, ...partial.prayerReminders }
        : this.config.prayerReminders,
    };
    this.saveConfig(updated);

    if (updated.keepActiveInBackground && updated.enabled) {
      soundService.unlockAudioSession().catch(() => {});
      this.requestWakeLock().catch(() => {});
    }

    if (this.lastPrayerProvider) {
      this.scheduleExactAlarms(this.lastPrayerProvider);
    }

    return updated;
  }

  public updatePrayerReminder(
    prayerKey: keyof PrayerRemindersPerPrayer,
    rule: Partial<PrayerReminderRule>
  ): BackgroundAdhanConfig {
    const currentReminders = this.config.prayerReminders || DEFAULT_PRAYER_REMINDERS;
    const updatedRule: PrayerReminderRule = {
      ...currentReminders[prayerKey],
      ...rule,
    };
    return this.updateConfig({
      prayerReminders: {
        ...currentReminders,
        [prayerKey]: updatedRule,
      },
    });
  }

  public setOnAdhanTrigger(cb: (prayerName: string, voice: AdhanVoice) => void): void {
    this.onAdhanTriggerCallback = cb;
  }

  private initVisibilityListeners(): void {
    if (typeof window === 'undefined') return;

    const handleWakeup = () => {
      if (this.lastPrayerProvider && this.config.enabled) {
        this.runPrayerCheck(this.lastPrayerProvider());
        this.scheduleExactAlarms(this.lastPrayerProvider);
      }
    };

    window.addEventListener('focus', handleWakeup);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleWakeup();
      }
    });
  }

  public getNotificationState(): NotificationStateInfo {
    if (typeof window === 'undefined') {
      return {
        permission: 'unsupported',
        isIOS: false,
        isStandalone: false,
        isSupported: false,
        needsPWAInstallOnIOS: false,
        isAudioSessionActive: false,
        autoBypassActive: true,
      };
    }

    const ua = (navigator.userAgent || '').toLowerCase();
    const isIOS =
      /iphone|ipad|ipod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    const hasNotificationAPI = 'Notification' in window;
    const needsPWAInstallOnIOS = isIOS && !isStandalone;

    let permission: NotificationPermission | 'unsupported' = 'unsupported';
    if (hasNotificationAPI) {
      permission = Notification.permission;
    }

    return {
      permission,
      isIOS,
      isStandalone,
      isSupported: hasNotificationAPI,
      needsPWAInstallOnIOS,
      isAudioSessionActive: soundService.isAudioSessionUnlocked(),
      autoBypassActive: this.config.autoBypassActive,
    };
  }

  public getNotificationPermission(): NotificationPermission | 'unsupported' {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    soundService.unlockAudioSession().catch(() => {});

    if (Notification.permission === 'granted') {
      this.requestWakeLock();
      return 'granted';
    }

    try {
      let permission: NotificationPermission;
      if (typeof Notification.requestPermission === 'function') {
        try {
          const promiseResult = Notification.requestPermission();
          if (promiseResult && typeof promiseResult.then === 'function') {
            permission = await promiseResult;
          } else {
            permission = await new Promise<NotificationPermission>((resolve) => {
              Notification.requestPermission(resolve);
            });
          }
        } catch {
          permission = await new Promise<NotificationPermission>((resolve) => {
            Notification.requestPermission(resolve);
          });
        }
      } else {
        permission = 'denied';
      }

      if (permission === 'granted') {
        this.requestWakeLock();
      }

      return permission;
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return Notification.permission || 'denied';
    }
  }

  public async requestWakeLock(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      return false;
    }
    try {
      type WakeLockSentinelObj = {
        addEventListener: (event: string, cb: () => void) => void;
      };
      type NavigatorWithWakeLock = {
        wakeLock: {
          request: (type: string) => Promise<WakeLockSentinelObj>;
        };
      };
      const nav = navigator as unknown as NavigatorWithWakeLock;
      const sentinel = await nav.wakeLock.request('screen');
      this.wakeLock = sentinel;
      sentinel.addEventListener('release', () => {
        this.wakeLock = null;
      });
      return true;
    } catch {
      return false;
    }
  }

  public releaseWakeLock(): void {
    try {
      if (
        this.wakeLock &&
        typeof (this.wakeLock as { release?: () => Promise<void> }).release === 'function'
      ) {
        (this.wakeLock as { release: () => Promise<void> }).release();
        this.wakeLock = null;
      }
    } catch {
      // ignore
    }
  }

  /**
   * Dispatches system notification via Service Worker registration on mobile
   * with guaranteed fast timeout so it NEVER hangs if service worker is inactive.
   */
  public async dispatchSystemNotification(
    title: string,
    body: string,
    tag: string,
    data: Record<string, unknown> = {}
  ): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    if (Notification.permission !== 'granted') return false;

    const options: NotificationOptions & {
      vibrate?: number[];
      actions?: Array<{ action: string; title: string }>;
      renotify?: boolean;
    } = {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag,
      requireInteraction: true,
      silent: false,
      renotify: true,
      vibrate: [600, 300, 600, 300, 1200],
      actions: [
        { action: 'listen_adhan', title: '🔊 استماع للأذان' },
        { action: 'open_app', title: '🕌 فتح صلاتي' },
      ],
      data: {
        url: '/',
        ...data,
      },
    };

    // 1. Mobile ServiceWorker registration with 1.2s timeout fallback
    let reg: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      try {
        reg = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 1200)),
        ]);
        if (!reg) {
          reg = (await navigator.serviceWorker.getRegistration()) || undefined;
        }
      } catch (swErr) {
        console.warn('SW lookup error:', swErr);
      }
    }

    if (reg && typeof reg.showNotification === 'function') {
      try {
        await reg.showNotification(title, options);
        return true;
      } catch (err) {
        console.warn('SW showNotification error, falling back to window Notification:', err);
      }
    }

    // 2. Direct Window Notification fallback
    if (typeof Notification === 'function') {
      try {
        const notification = new Notification(title, options);
        notification.onclick = () => {
          try {
            window.focus();
          } catch {}
          notification.close();
        };
        return true;
      } catch (err) {
        console.warn('Direct Notification constructor failed:', err);
      }
    }

    return false;
  }

  public async sendPrayerNotification(prayerName: string, cityName: string): Promise<boolean> {
    const title = `🕌 حَانَ الآن وقت أذان صلاة ${prayerName}`;
    const body = `الله أكبر، الله أكبر.. رُفع الآن أذان ${prayerName} حسب التوقيت المحلي لمدينة ${cityName}. اضغط لفتح التطبيق وسماع الأذان.`;
    const tag = `adhan-${prayerName}-${new Date().toDateString()}`;
    return this.dispatchSystemNotification(title, body, tag, { prayerName, type: 'adhan' });
  }

  public async sendPrePrayerNotification(
    prayerName: string,
    cityName: string,
    minutesBefore: number
  ): Promise<boolean> {
    const title = `⏰ اقترب موعد أذان ${prayerName} (${minutesBefore} دقائق)`;
    const body = `تذكير صلاتي: بقي ${minutesBefore} دقائق على موعد أذان ${prayerName} بمدينة ${cityName}. استعد للوضوء والصلاة.`;
    const tag = `pre-adhan-${prayerName}-${minutesBefore}-${new Date().toDateString()}`;
    return this.dispatchSystemNotification(title, body, tag, {
      prayerName,
      minutesBefore,
      type: 'pre-adhan',
    });
  }

  public async sendTestNotification(cityName: string): Promise<boolean> {
    const title = '🕌 تجربة تنبيه أذان صلاتي';
    const body = `تم تفعيل إشعارات الأذان بنجاح لمدينة ${cityName}! ستصلك تنبيهات الصلوات في وقتها المحدد تلقائياً حتى عندما يكون الهاتف مقفلاً.`;
    const tag = `test-adhan-${Date.now()}`;
    return this.dispatchSystemNotification(title, body, tag, { type: 'test' });
  }

  public scheduleLockScreenTest(
    cityName: string,
    voice: AdhanVoice,
    onCountdown?: (secondsLeft: number) => void
  ): Promise<void> {
    return new Promise((resolve) => {
      soundService.unlockAudioSession().catch(() => {});

      let count = 5;
      if (onCountdown) onCountdown(count);

      const interval = window.setInterval(() => {
        count--;
        if (onCountdown) onCountdown(count);

        if (count <= 0) {
          clearInterval(interval);
          this.executeAdhanAlert('تجربة الأذان وشاشة القفل', cityName, voice);
          resolve();
        }
      }, 1000);
    });
  }

  public startPrayerMonitor(
    getUpcomingPrayers: () => {
      prayerList: PrayerTimeItem[];
      cityName: string;
      selectedVoice: AdhanVoice;
    }
  ): void {
    this.lastPrayerProvider = getUpcomingPrayers;

    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
    }

    // 1. Run immediate check
    this.runPrayerCheck(getUpcomingPrayers());

    // 2. Schedule exact alarms for all 5 daily prayers within next 24h
    this.scheduleExactAlarms(getUpcomingPrayers);

    // 3. Precision interval check every 5 seconds
    this.checkIntervalId = window.setInterval(() => {
      if (!this.config.enabled) return;
      this.runPrayerCheck(getUpcomingPrayers());
    }, 5000);

    // 4. Background Web Worker ticker
    this.startWorkerTicker(getUpcomingPrayers);
  }

  private startWorkerTicker(
    getUpcomingPrayers: () => {
      prayerList: PrayerTimeItem[];
      cityName: string;
      selectedVoice: AdhanVoice;
    }
  ): void {
    if (this.workerTimer) {
      this.workerTimer.terminate();
      this.workerTimer = null;
    }

    try {
      const blob = new Blob(
        [
          `
          let interval = setInterval(() => {
            postMessage('tick');
          }, 5000);
        `,
        ],
        { type: 'application/javascript' }
      );
      this.workerTimer = new Worker(URL.createObjectURL(blob));
      this.workerTimer.onmessage = () => {
        if (!this.config.enabled) return;
        this.runPrayerCheck(getUpcomingPrayers());
      };
    } catch {
      // Web Worker fallback ignored
    }
  }

  /**
   * Pre-schedule exact setTimeouts for all upcoming prayers.
   * If a prayer has passed today (e.g. at night), it calculates the exact
   * millisecond timestamp for tomorrow so Fajr is NEVER missed!
   */
  private scheduleExactAlarms(
    getUpcomingPrayers: () => {
      prayerList: PrayerTimeItem[];
      cityName: string;
      selectedVoice: AdhanVoice;
    }
  ): void {
    this.exactTimerIds.forEach((id) => clearTimeout(id));
    this.exactTimerIds = [];

    const { prayerList, cityName, selectedVoice } = getUpcomingPrayers();
    const nowMs = Date.now();

    prayerList.forEach((prayer) => {
      if (!prayer.isPrayer) return;

      let targetTimeMs = prayer.timestamp;
      // If prayer already passed today, target is tomorrow at same time
      if (targetTimeMs <= nowMs) {
        targetTimeMs += 24 * 60 * 60 * 1000;
      }

      const deltaMs = targetTimeMs - nowMs;
      if (deltaMs > 0 && deltaMs <= 24 * 60 * 60 * 1000) {
        const timerId = window.setTimeout(() => {
          this.executeAdhanAlert(prayer.nameArabic, cityName, selectedVoice);
        }, deltaMs);
        this.exactTimerIds.push(timerId);
      }
    });
  }

  /**
   * Core check logic with clean daily reset and generous catch-up window
   */
  private runPrayerCheck(data: {
    prayerList: PrayerTimeItem[];
    cityName: string;
    selectedVoice: AdhanVoice;
  }): void {
    const { prayerList, cityName, selectedVoice } = data;
    const now = new Date();
    const nowMs = now.getTime();
    const todayDateStr = now.toDateString();

    // Clean up old keys from previous days
    for (const key of this.triggeredAlertKeys) {
      if (!key.startsWith(todayDateStr)) {
        this.triggeredAlertKeys.delete(key);
      }
    }

    const reminders = this.config.prayerReminders || DEFAULT_PRAYER_REMINDERS;

    prayerList.forEach((prayer) => {
      const pId = prayer.id as keyof PrayerRemindersPerPrayer;
      const rule = reminders[pId];

      // 1. Check Pre-Adhan reminder
      if (rule && rule.enabled && rule.preAlertMinutes > 0) {
        const preAlertTargetMs = prayer.timestamp - rule.preAlertMinutes * 60 * 1000;
        const preDiffMs = nowMs - preAlertTargetMs;
        const preKey = `${todayDateStr}-${prayer.id}-pre-${rule.preAlertMinutes}`;

        if (preDiffMs >= 0 && preDiffMs < 5 * 60 * 1000 && !this.triggeredAlertKeys.has(preKey)) {
          this.markAlertTriggered(preKey);
          this.sendPrePrayerNotification(prayer.nameArabic, cityName, rule.preAlertMinutes);
          if (rule.soundType !== 'silent') {
            soundService.playTasbeehClick();
          }
        }
      }

      // 2. Check Exact Adhan Time (Only for actual prayers)
      if (!prayer.isPrayer) return;

      const isPrayerEnabled =
        (prayer.id === 'fajr' && this.config.fajrEnabled) ||
        (prayer.id === 'duha' && this.config.duhaEnabled) ||
        (prayer.id === 'dhuhr' && this.config.dhuhrEnabled) ||
        (prayer.id === 'jumuah' && this.config.jumuahEnabled) ||
        (prayer.id === 'asr' && this.config.asrEnabled) ||
        (prayer.id === 'maghrib' && this.config.maghribEnabled) ||
        (prayer.id === 'isha' && this.config.ishaEnabled) ||
        (rule && rule.enabled);

      if (!isPrayerEnabled) return;

      const prayerTimeMs = prayer.timestamp;
      const diffMs = nowMs - prayerTimeMs;
      const adhanKey = `${todayDateStr}-${prayer.id}-exact`;

      // 45-minute catch-up window: Even if phone was asleep and screen locked,
      // it triggers the Adhan and notification as soon as it wakes up within 45 min!
      if (diffMs >= 0 && diffMs < 45 * 60 * 1000 && !this.triggeredAlertKeys.has(adhanKey)) {
        this.markAlertTriggered(adhanKey);
        this.executeAdhanAlert(prayer.nameArabic, cityName, selectedVoice);
      }
    });
  }

  public stopPrayerMonitor(): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
    if (this.workerTimer) {
      this.workerTimer.terminate();
      this.workerTimer = null;
    }
    this.exactTimerIds.forEach((id) => clearTimeout(id));
    this.exactTimerIds = [];
    this.releaseWakeLock();
  }

  /**
   * Trigger the Adhan playback + notification
   */
  public executeAdhanAlert(prayerName: string, cityName: string, voice: AdhanVoice): void {
    // 1. Send system lock-screen notification
    this.sendPrayerNotification(prayerName, cityName);

    // 2. Resolve dedicated adhan voice for Fajr, Dhuhr, Asr
    let effectiveVoice = voice;
    if (prayerName.includes('الظهر')) {
      const dhuhrV = ADHAN_VOICES.find((v) => v.id === 'dhuhr_adhan');
      if (dhuhrV) effectiveVoice = dhuhrV;
    } else if (prayerName.includes('العصر')) {
      const asrV = ADHAN_VOICES.find((v) => v.id === 'asr_adhan');
      if (asrV) effectiveVoice = asrV;
    } else if (prayerName.includes('الفجر')) {
      const fajrV = ADHAN_VOICES.find((v) => v.id === 'fajr_alafasy');
      if (fajrV) effectiveVoice = fajrV;
    }

    // 3. Play full Adhan audio with background audio pipeline
    if (this.config.notifyWithFullAudio) {
      soundService.playAdhan(effectiveVoice.audioUrl);
    }

    // 4. Trigger UI callback
    if (this.onAdhanTriggerCallback) {
      this.onAdhanTriggerCallback(prayerName, effectiveVoice);
    }
  }
}

export const backgroundAdhanService = new BackgroundAdhanService();
