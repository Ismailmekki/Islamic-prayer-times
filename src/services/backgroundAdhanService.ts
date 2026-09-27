/**
 * Background Adhan & Notification Service
 * Allows users to hear the full Adhan automatically at prayer time,
 * and receive pre-reminders (e.g. 5, 10, 15 minutes before Adhan) per prayer.
 */

import { PrayerTimeItem, AdhanVoice } from '../types/prayer';
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
}

const STORAGE_KEY = 'salati_bg_adhan_config';

const DEFAULT_CONFIG: BackgroundAdhanConfig = {
  enabled: true,
  notifyWithFullAudio: true,
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
  private triggeredAlertKeys: Set<string> = new Set();
  private onAdhanTriggerCallback: ((prayerName: string, voice: AdhanVoice) => void) | null = null;
  private wakeLock: unknown = null;

  constructor() {
    this.config = this.loadConfig();
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

  /**
   * Comprehensive detection of Notification state and iOS platform limitations
   */
  public getNotificationState(): NotificationStateInfo {
    if (typeof window === 'undefined') {
      return {
        permission: 'unsupported',
        isIOS: false,
        isStandalone: false,
        isSupported: false,
        needsPWAInstallOnIOS: false,
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
    };
  }

  public getNotificationPermission(): NotificationPermission | 'unsupported' {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  /**
   * Request system notification permission with full browser compatibility
   */
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'granted') {
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

      // If just granted, attempt to register WakeLock and warm up audio context
      if (permission === 'granted') {
        this.requestWakeLock();
      }

      return permission;
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return Notification.permission || 'denied';
    }
  }

  /**
   * Request Screen WakeLock (API where available) to prevent aggressive OS suspension
   */
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

  /**
   * Releases WakeLock
   */
  public releaseWakeLock(): void {
    try {
      if (this.wakeLock && typeof (this.wakeLock as { release?: () => Promise<void> }).release === 'function') {
        (this.wakeLock as { release: () => Promise<void> }).release();
        this.wakeLock = null;
      }
    } catch {
      // ignore
    }
  }

  /**
   * Dispatches system notification safely via Service Worker registration on mobile,
   * falling back to window Notification constructor on desktop.
   */
  public async dispatchSystemNotification(
    title: string,
    body: string,
    tag: string,
    data: Record<string, unknown> = {}
  ): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    if (Notification.permission !== 'granted') return false;

    const options: NotificationOptions & { vibrate?: number[] } = {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag,
      requireInteraction: true,
      silent: false,
      // Haptic vibration pattern for notifications: vibration / pause / vibration
      vibrate: [250, 100, 250, 100, 450],
      data: {
        url: '/',
        ...data,
      },
    };

    // 1. Mandatory on mobile browsers (Android Chrome, PWA): use ServiceWorkerRegistration
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg && typeof reg.showNotification === 'function') {
          await reg.showNotification(title, options);
          return true;
        }
      } catch (swErr) {
        console.warn('ServiceWorker showNotification failed, attempting direct Notification fallback:', swErr);
      }
    }

    // 2. Direct Window Notification fallback (Desktop browsers)
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
      return false;
    }
  }

  /**
   * Send high-priority browser notification for Adhan
   */
  public async sendPrayerNotification(prayerName: string, cityName: string): Promise<boolean> {
    const title = `🕌 حَانَ الآن وقت أذان ${prayerName}`;
    const body = `الله أكبر، الله أكبر.. رُفع أذان ${prayerName} حسب التوقيت المحلي لمدينة ${cityName}. اضغط لفتح التطبيق وسماع الأذان.`;
    const tag = `adhan-${prayerName}-${new Date().toDateString()}`;
    return this.dispatchSystemNotification(title, body, tag, { prayerName, type: 'adhan' });
  }

  /**
   * Send pre-adhan reminder notification (e.g. 5 or 10 min before)
   */
  public async sendPrePrayerNotification(
    prayerName: string,
    cityName: string,
    minutesBefore: number
  ): Promise<boolean> {
    const title = `⏰ اقترب أذان صلاة ${prayerName} (${minutesBefore} دقائق)`;
    const body = `تذكير: بقي ${minutesBefore} دقائق على موعد أذان ${prayerName} في مدينة ${cityName}. استعد للوضوء والصلاة.`;
    const tag = `pre-adhan-${prayerName}-${minutesBefore}-${new Date().toDateString()}`;
    return this.dispatchSystemNotification(title, body, tag, { prayerName, minutesBefore, type: 'pre-adhan' });
  }

  /**
   * Send instant test notification so the user can verify device lock screen reception
   */
  public async sendTestNotification(cityName: string): Promise<boolean> {
    const title = '🕌 تجربة تنبيه أذان صلاتي';
    const body = `تم تفعيل إشعارات الأذان بنجاح لمدينة ${cityName}! ستصلك تنبيهات الصلوات في وقتها المحدد تلقائياً حتى خارج التطبيق.`;
    const tag = `test-adhan-${Date.now()}`;
    return this.dispatchSystemNotification(title, body, tag, { type: 'test' });
  }

  /**
   * Setup media session metadata so Android and iOS handle background audio smoothly
   */
  private setupMediaSession(prayerName: string): void {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: `أذان صلاة ${prayerName}`,
          artist: 'تطبيق صلاتي',
          album: 'مواقيت الصلاة والأذان',
          artwork: [
            { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          ],
        });

        navigator.mediaSession.setActionHandler('play', () => {
          soundService.resumeAdhan();
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          soundService.pauseAdhan();
        });
        navigator.mediaSession.setActionHandler('stop', () => {
          soundService.stopAdhan();
        });
      } catch (e) {
        // mediaSession optional
      }
    }
  }

  /**
   * Starts precision background polling ticker
   */
  public startPrayerMonitor(
    getUpcomingPrayers: () => { prayerList: PrayerTimeItem[]; cityName: string; selectedVoice: AdhanVoice }
  ): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
    }

    // Check every 10 seconds
    this.checkIntervalId = window.setInterval(() => {
      if (!this.config.enabled) return;

      const { prayerList, cityName, selectedVoice } = getUpcomingPrayers();
      const now = new Date();
      const nowMs = now.getTime();
      const todayDateStr = now.toDateString();

      const reminders = this.config.prayerReminders || DEFAULT_PRAYER_REMINDERS;

      prayerList.forEach((prayer) => {
        const pId = prayer.id as keyof PrayerRemindersPerPrayer;
        const rule = reminders[pId];

        // 1. Check Pre-Adhan reminder (e.g. 5, 10, 15 minutes before)
        if (rule && rule.enabled && rule.preAlertMinutes > 0) {
          const preAlertTargetMs = prayer.timestamp - rule.preAlertMinutes * 60 * 1000;
          const preDiffMs = nowMs - preAlertTargetMs;
          const preKey = `${todayDateStr}-${prayer.id}-pre-${rule.preAlertMinutes}`;

          if (preDiffMs >= 0 && preDiffMs < 45000 && !this.triggeredAlertKeys.has(preKey)) {
            this.triggeredAlertKeys.add(preKey);
            this.sendPrePrayerNotification(prayer.nameArabic, cityName, rule.preAlertMinutes);
            if (rule.soundType !== 'silent') {
              soundService.playTasbeehClick();
            }
          }
        }

        // 2. Check Exact Adhan Time (Only for actual prayers)
        if (!prayer.isPrayer) return;

        // Check if enabled for this prayer
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

        // If time is within [0, 45 seconds] of prayer time and has not triggered today yet
        if (diffMs >= 0 && diffMs < 45000 && !this.triggeredAlertKeys.has(adhanKey)) {
          this.triggeredAlertKeys.add(adhanKey);
          this.executeAdhanAlert(prayer.nameArabic, cityName, selectedVoice);
        }
      });
    }, 10000);
  }

  public stopPrayerMonitor(): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
  }

  /**
   * Trigger the Adhan playback + notification
   */
  public executeAdhanAlert(prayerName: string, cityName: string, voice: AdhanVoice): void {
    // 1. Send system notification (works via service worker on mobile)
    this.sendPrayerNotification(prayerName, cityName);

    // 2. Configure system media lock-screen session
    this.setupMediaSession(prayerName);

    // 3. Play full Adhan audio if audio enabled
    if (this.config.notifyWithFullAudio) {
      soundService.playAdhan(voice.audioUrl);
    }

    // 4. Trigger UI callback
    if (this.onAdhanTriggerCallback) {
      this.onAdhanTriggerCallback(prayerName, voice);
    }
  }
}

export const backgroundAdhanService = new BackgroundAdhanService();
