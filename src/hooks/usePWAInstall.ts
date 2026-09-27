import { useEffect, useState, useCallback } from 'react';
import { downloadIOSWebClipProfile, downloadOfflineLauncher } from '../utils/iosProfileGenerator';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// Global cache for beforeinstallprompt in case it fires before React hook mounts
declare global {
  interface Window {
    __pwaDeferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    window.__pwaDeferredPrompt = e as BeforeInstallPromptEvent;
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => (typeof window !== 'undefined' ? window.__pwaDeferredPrompt || null : null)
  );
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [isChrome, setIsChrome] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [appUrl, setAppUrl] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect iframe
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }

    setAppUrl(window.location.href);

    // Detect standalone mode (already installed on homescreen)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');
    setIsInstalled(isStandalone);

    // Detect mobile platforms & browsers
    const userAgent = (window.navigator.userAgent || '').toLowerCase();
    const isIOSDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroidDevice = /android/.test(userAgent);

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // In-app webviews (WhatsApp, Facebook, Instagram, Twitter, Telegram, TikTok, WeChat)
    const inApp =
      /fban|fbav|instagram|crios|fxios|line|micromessenger|telegram|whatsapp|bytedance|tiktok/i.test(
        userAgent
      );
    setIsInAppBrowser(inApp);

    // Safari vs Chrome
    const safari = /safari/.test(userAgent) && !/chrome|chromium|edg|opr/.test(userAgent);
    const chrome = /chrome|crios|chromium/.test(userAgent) && !/edg|opr/.test(userAgent);
    setIsSafari(safari);
    setIsChrome(chrome);

    // Check if global prompt already caught
    if (window.__pwaDeferredPrompt) {
      setDeferredPrompt(window.__pwaDeferredPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__pwaDeferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      window.__pwaDeferredPrompt = null;
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    const promptToUse = deferredPrompt || window.__pwaDeferredPrompt;
    if (!promptToUse) return false;

    try {
      await promptToUse.prompt();
      const { outcome } = await promptToUse.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        window.__pwaDeferredPrompt = null;
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.error('Error triggering PWA install:', err);
    }
    return false;
  }, [deferredPrompt]);

  const copyAppUrl = useCallback(async () => {
    try {
      const url = window.location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
      return true;
    } catch {
      return false;
    }
  }, []);

  const openInStandaloneWindow = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
    }
  }, []);

  const downloadIOSProfile = useCallback(async () => {
    return await downloadIOSWebClipProfile('صلاتي', window.location.href);
  }, []);

  const downloadLauncher = useCallback(() => {
    downloadOfflineLauncher('صلاتي', window.location.href);
  }, []);

  return {
    isInstallable: !!(deferredPrompt || (typeof window !== 'undefined' && window.__pwaDeferredPrompt)),
    isInstalled,
    isIOS,
    isAndroid,
    isInAppBrowser,
    isInIframe,
    isSafari,
    isChrome,
    isCopied,
    appUrl,
    copyAppUrl,
    install,
    openInStandaloneWindow,
    downloadIOSProfile,
    downloadLauncher,
  };
}
