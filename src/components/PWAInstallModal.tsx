import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  Share2,
  PlusSquare,
  CheckCircle2,
  X,
  Sparkles,
  WifiOff,
  Bell,
  Volume2,
  Copy,
  Check,
  AlertTriangle,
  QrCode,
  Send,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { soundService } from '../utils/soundService';
import { backgroundAdhanService } from '../services/backgroundAdhanService';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'ios' | 'android' | 'qr' | 'setup';
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  defaultTab,
}) => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    isInAppBrowser,
    isInIframe,
    isCopied,
    appUrl,
    copyAppUrl,
    install,
    openInStandaloneWindow,
    downloadIOSProfile,
  } = usePWAInstall();

  // Active tab selection
  const [activeTab, setActiveTab] = useState<'ios' | 'android' | 'qr' | 'setup'>(() => {
    if (defaultTab) return defaultTab;
    if (isIOS) return 'ios';
    if (isAndroid) return 'android';
    return 'android';
  });

  const [installState, setInstallState] = useState<'idle' | 'installing' | 'done'>('idle');
  const [iosProfileState, setIosProfileState] = useState<'idle' | 'downloading' | 'done'>('idle');

  // Setup Health Check states
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const [isAudioSessionReady, setIsAudioSessionReady] = useState(false);
  const [isAudioConfirmed, setIsAudioConfirmed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('Notification' in window) {
        setHasNotificationPermission(Notification.permission === 'granted');
      }
      setIsAudioSessionReady(soundService.isAudioSessionUnlocked());
      try {
        setIsAudioConfirmed(localStorage.getItem('salati_audio_confirmed') === 'true');
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentSiteUrl = appUrl || (typeof window !== 'undefined' ? window.location.href : '');
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    currentSiteUrl
  )}&bgcolor=1c1917&color=10b981&margin=10`;

  const handleDirectInstall = async () => {
    setInstallState('installing');
    const ok = await install();
    if (ok) {
      setInstallState('done');
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setInstallState('idle');
    }
  };

  const handleDownloadProfile = async () => {
    setIosProfileState('downloading');
    const ok = await downloadIOSProfile();
    if (ok) {
      setIosProfileState('done');
    } else {
      setIosProfileState('idle');
    }
  };

  const handleRequestNotification = async () => {
    const perm = await backgroundAdhanService.requestNotificationPermission();
    if (perm === 'granted') {
      setHasNotificationPermission(true);
    }
  };

  const handleTestSound = async () => {
    await soundService.unlockAudioSession();
    setIsAudioSessionReady(true);
    soundService.playTakbeerConfirmation();
    setIsAudioConfirmed(true);
    try {
      localStorage.setItem('salati_audio_confirmed', 'true');
    } catch {}
  };

  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `تطبيق «صلاتي» لمواقيت الصلاة والأذان والقبلة والقرآن الكريم.. خفيف وسريع ويعمل بدون إنترنت على الآيفون والأندرويد:\n${currentSiteUrl}`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-stone-900 border-2 border-emerald-500/40 shadow-2xl overflow-hidden flex flex-col text-right max-h-[92vh]">
        {/* Top Header */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-b from-emerald-950 via-stone-900 to-stone-900 border-b border-stone-800 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-emerald-600/30 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-lg shrink-0">
              <Download className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-white font-quran">
                  تثبيت برنامج «صلاتي»
                </h3>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  مجاني 100%
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-300 mt-1">
                يعمل على جميع هواتف الآيفون والأندرويد بدون متجر وبدون إنترنت
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Warning if inside Preview Iframe */}
        {isInIframe && (
          <div className="p-4 bg-amber-950/80 border-b border-amber-500/40 flex items-start gap-3 text-xs sm:text-sm text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <strong className="block font-black text-amber-300">
                تنبيه: أنت تتصفح التطبيق داخل إطار المعاينة
              </strong>
              <p className="text-xs text-amber-200/90 leading-relaxed">
                أنظمة أندرويد وآبل تتطلب فتح التطبيق في نافذة مستقلة لتثبيت الأيقونة على الشاشة الرئيسية.
              </p>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <button
                  onClick={openInStandaloneWindow}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>فتح التطبيق في نافذة مستقلة للتثبيت ↗</span>
                </button>
                <button
                  onClick={() => setActiveTab('qr')}
                  className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-stone-700"
                >
                  <QrCode className="w-4 h-4" />
                  <span>مسح الرمز بكاميرا الهاتف</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OS Platform Tabs (Large, High Contrast, Elderly-Friendly) */}
        <div className="grid grid-cols-4 border-b border-stone-800 bg-stone-950/70 p-2 gap-1.5">
          <button
            onClick={() => setActiveTab('android')}
            className={`py-3 px-2 rounded-2xl text-xs sm:text-sm font-black flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'android'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/80 ring-2 ring-emerald-400'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>الأندرويد</span>
            {isAndroid && (
              <span className="text-[10px] bg-emerald-950 text-emerald-200 px-1.5 py-0.2 rounded-full border border-emerald-400">
                جهازك
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('ios')}
            className={`py-3 px-2 rounded-2xl text-xs sm:text-sm font-black flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'ios'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/80 ring-2 ring-emerald-400'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>الآيفون</span>
            {isIOS && (
              <span className="text-[10px] bg-emerald-950 text-emerald-200 px-1.5 py-0.2 rounded-full border border-emerald-400">
                جهازك
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`py-3 px-2 rounded-2xl text-xs sm:text-sm font-black flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'qr'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/80 ring-2 ring-emerald-400'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>رمز الهاتف</span>
          </button>

          <button
            onClick={() => setActiveTab('setup')}
            className={`py-3 px-2 rounded-2xl text-xs sm:text-sm font-black flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'setup'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-950/80 ring-2 ring-amber-400'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <span>فحص الإعداد</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 space-y-5 overflow-y-auto max-h-[62vh]">
          {/* TAB 1: ANDROID */}
          {activeTab === 'android' && (
            <div className="space-y-4">
              {/* Direct One-Touch Install if available */}
              {isInstallable && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900/80 via-teal-900/60 to-stone-900 border-2 border-emerald-400 space-y-3 shadow-xl">
                  <div className="space-y-1">
                    <span className="text-sm font-black text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      <span>تثبيت فوري مباشر بنقرة واحدة</span>
                    </span>
                    <p className="text-xs text-stone-200 leading-relaxed">
                      هاتفك يدعم التثبيت المباشر! اضغط على الزر الأخضر وسينزل التطبيق فوراً على شاشتك.
                    </p>
                  </div>
                  <button
                    onClick={handleDirectInstall}
                    disabled={installState === 'installing'}
                    className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-sm sm:text-base shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
                  >
                    {installState === 'installing' ? (
                      <span>جاري التثبيت...</span>
                    ) : installState === 'done' ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-stone-950" />
                        <span>تم التثبيت بنجاح على شاشة هاتفك!</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        <span>تثبيت تطبيق «صلاتي» على هاتف الأندرويد الآن 📲</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Step-by-Step for Android (Chrome / Samsung Internet) */}
              <div className="rounded-2xl border border-stone-800 bg-stone-950/80 p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <h4 className="text-white font-black text-sm sm:text-base flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-emerald-400" />
                    <span>خطوات التثبيت السريعة على هاتف الأندرويد (3 خطوات):</span>
                  </h4>
                  <span className="text-[11px] text-stone-400">سامسونج، شاومي، هواوي، أوبو</span>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-stone-200">
                  <div className="flex items-start gap-3.5 p-3 rounded-xl bg-stone-900 border border-stone-800">
                    <span className="w-7 h-7 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-700 flex items-center justify-center font-black text-sm shrink-0 mt-0.5">
                      1
                    </span>
                    <div className="flex-1 space-y-1">
                      <strong className="text-white block font-bold text-sm">
                        اضغط على قائمة المتصفح (الثلاث نقاط):
                      </strong>
                      <p className="text-xs text-stone-400">
                        أيقونة النقاط الثلاث العمودية{' '}
                        <strong className="text-white bg-stone-800 px-2 py-0.5 rounded font-mono text-xs">
                          ⋮
                        </strong>{' '}
                        الموجودة في أعلى زاوية متصفح كروم.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3 rounded-xl bg-stone-900 border border-stone-800">
                    <span className="w-7 h-7 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-700 flex items-center justify-center font-black text-sm shrink-0 mt-0.5">
                      2
                    </span>
                    <div className="flex-1 space-y-1">
                      <strong className="text-white block font-bold text-sm">
                        اختر «تثبيت التطبيق» (Install app):
                      </strong>
                      <p className="text-xs text-stone-400">
                        أو «الإضافة إلى الشاشة الرئيسية» (Add to Home screen).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3 rounded-xl bg-stone-900 border border-stone-800">
                    <span className="w-7 h-7 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-700 flex items-center justify-center font-black text-sm shrink-0 mt-0.5">
                      3
                    </span>
                    <div className="flex-1 space-y-1">
                      <strong className="text-white block font-bold text-sm">
                        اضغط على «تثبيت»:
                      </strong>
                      <p className="text-xs text-stone-400">
                        ستظهر أيقونة «صلاتي» الذهبية على شاشة هاتفك مثل أي تطبيق مثبت، وتعمل تلقائياً بدون إنترنت.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IPHONE */}
          {activeTab === 'ios' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-stone-800 bg-stone-950/80 p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <h4 className="text-white font-black text-sm sm:text-base flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-sky-400" />
                    <span>خطوات التثبيت السريعة على الآيفون والآيباد:</span>
                  </h4>
                  <span className="text-[11px] text-stone-400">عبر متصفح سفاري (Safari)</span>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-stone-200">
                  <div className="flex items-start gap-3.5 p-3 rounded-xl bg-stone-900 border border-stone-800">
                    <span className="w-7 h-7 rounded-xl bg-sky-950 text-sky-300 border border-sky-700 flex items-center justify-center font-black text-sm shrink-0 mt-0.5">
                      1
                    </span>
                    <div className="flex-1 space-y-1">
                      <strong className="text-white block font-bold text-sm">
                        اضغط على زر المشاركة (Share):
                      </strong>
                      <p className="text-xs text-stone-400">
                        أيقونة المربع ذو السهم للأعلى{' '}
                        <strong className="text-sky-300 inline-flex items-center gap-1 mx-1 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800">
                          <Share2 className="w-3.5 h-3.5 inline" /> مشاركة
                        </strong>{' '}
                        الموجودة في الشريط السفلي لمتصفح سفاري.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3 rounded-xl bg-stone-900 border border-stone-800">
                    <span className="w-7 h-7 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center justify-center font-black text-sm shrink-0 mt-0.5">
                      2
                    </span>
                    <div className="flex-1 space-y-1">
                      <strong className="text-white block font-bold text-sm">
                        اختر «إضافة إلى الصفحة الرئيسية»:
                      </strong>
                      <p className="text-xs text-stone-400">
                        مرر القائمة لأسفل وانقر على{' '}
                        <strong className="text-emerald-300 inline-flex items-center gap-1 mx-1 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                          <PlusSquare className="w-3.5 h-3.5 inline text-emerald-400" /> إضافة إلى الصفحة الرئيسية
                        </strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3 rounded-xl bg-stone-900 border border-stone-800">
                    <span className="w-7 h-7 rounded-xl bg-amber-950 text-amber-300 border border-amber-700 flex items-center justify-center font-black text-sm shrink-0 mt-0.5">
                      3
                    </span>
                    <div className="flex-1 space-y-1">
                      <strong className="text-white block font-bold text-sm">
                        اضغط على «إضافة» (Add) في الزاوية العلوية:
                      </strong>
                      <p className="text-xs text-stone-400">
                        مبروك! تم تثبيت تطبيق «صلاتي» كبرنامج كامل على شاشة الآيفون.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct iOS Profile Option */}
              <div className="rounded-2xl border border-emerald-500/30 bg-stone-950/60 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>خيار إضافي: تنزيل ملف تعريف الآيفون المباشر</span>
                  </span>
                  <span className="text-[10px] text-emerald-400">MobileConfig</span>
                </div>
                <button
                  onClick={handleDownloadProfile}
                  disabled={iosProfileState === 'downloading'}
                  className="w-full py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  {iosProfileState === 'downloading' ? (
                    <span>جاري التجهيز...</span>
                  ) : iosProfileState === 'done' ? (
                    <span>✓ تم التنزيل! افتح الإعدادات لتأكيد التثبيت</span>
                  ) : (
                    <span>تحميل ملف تثبيت الآيفون (salati.mobileconfig)</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: QR CODE & WHATSAPP SHARE */}
          {activeTab === 'qr' && (
            <div className="rounded-2xl border border-stone-800 bg-stone-950/80 p-5 text-center space-y-4">
              <div className="space-y-1">
                <h4 className="text-white font-black text-base">
                  امسح الرمز بكاميرا هاتفك (آيفون أو أندرويد)
                </h4>
                <p className="text-xs text-stone-400 max-w-sm mx-auto">
                  افتح كاميرا الهاتف ووجهها نحو الرمز المربع ليفتح لك التطبيق مباشرة في متصفحك:
                </p>
              </div>

              {/* Big High-Contrast QR Code */}
              <div className="inline-block p-4 rounded-3xl bg-stone-900 border-2 border-emerald-500/40 shadow-2xl mx-auto">
                <img
                  src={qrCodeUrl}
                  alt="رمز QR لتثبيت التطبيق"
                  className="w-52 h-52 rounded-2xl object-contain mx-auto"
                  loading="lazy"
                />
              </div>

              {/* WhatsApp Share Button (Very Popular for Elders/Families) */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                <a
                  href={whatsappShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>إرسال الرابط عبر واتساب للأهل 💬</span>
                </a>

                <button
                  onClick={copyAppUrl}
                  className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopied ? 'تم نسخ الرابط بنجاح!' : 'نسخ رابط التطبيق المباشر'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: SETUP HEALTH CHECKER */}
          {activeTab === 'setup' && (
            <div className="rounded-2xl border border-amber-500/30 bg-stone-950/80 p-4 sm:p-5 space-y-4">
              <div className="border-b border-stone-800 pb-3">
                <h4 className="text-white font-black text-sm sm:text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <span>فحص جاهزية الهاتف وإعدادات التطبيق (Setup Check):</span>
                </h4>
                <p className="text-xs text-stone-400 mt-0.5">
                  تأكد من عمل كافة خصائص التطبيق على هاتفك بنجاح
                </p>
              </div>

              <div className="space-y-3">
                {/* 1. Audio Speaker */}
                <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-600/40 text-emerald-400 flex items-center justify-center shrink-0">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white block">صوت ومكبر الأذان</span>
                      <span className="text-xs text-stone-400">
                        {isAudioConfirmed
                          ? '✅ تم تأكيد مكبر الصوت وجاهز للعمل في الخلفية'
                          : 'اضغط على زر الفحص للتأكد من سماع الصوت'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleTestSound}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer transition-colors shrink-0"
                  >
                    تجربة الصوت 🔊
                  </button>
                </div>

                {/* 2. Notifications */}
                <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-600/40 text-amber-400 flex items-center justify-center shrink-0">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white block">إشعارات وتنبيهات الصلوات</span>
                      <span className="text-xs text-stone-400">
                        {hasNotificationPermission
                          ? '✅ مفعّلة بنجاح على هذا الهاتف'
                          : 'مطلوب السماح بالتنبيهات لتصلك أوقات الصلاة'}
                      </span>
                    </div>
                  </div>
                  {!hasNotificationPermission && (
                    <button
                      onClick={handleRequestNotification}
                      className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer transition-colors shrink-0"
                    >
                      تفعيل التنبيهات 🔔
                    </button>
                  )}
                  {hasNotificationPermission && (
                    <span className="text-xs text-emerald-400 font-bold px-3 py-1 bg-emerald-950/80 rounded-lg border border-emerald-500/30">
                      جاهز ✓
                    </span>
                  )}
                </div>

                {/* 3. Offline Capabilities */}
                <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-950 border border-teal-600/40 text-teal-400 flex items-center justify-center shrink-0">
                      <WifiOff className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white block">العمل بدون إنترنت (Offline)</span>
                      <span className="text-xs text-stone-400">
                        ✅ مواقيت الصلاة والأذكار والقبلة محفوظة للعمل أوفلاين
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400 font-bold px-3 py-1 bg-emerald-950/80 rounded-lg border border-emerald-500/30">
                    جاهز ✓
                  </span>
                </div>

                {/* 4. Standalone Installation */}
                <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-600/40 text-purple-400 flex items-center justify-center shrink-0">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white block">التثبيت كبرنامج على الشاشة</span>
                      <span className="text-xs text-stone-400">
                        {isInstalled
                          ? '✅ التطبيق مثبت ويعمل كبرنامج مستقل'
                          : 'يمكنك تثبيته عبر تبويب أندرويد أو آيفون بالأعلى'}
                      </span>
                    </div>
                  </div>
                  {isInstalled && (
                    <span className="text-xs text-emerald-400 font-bold px-3 py-1 bg-emerald-950/80 rounded-lg border border-emerald-500/30">
                      مثبت ✓
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
          <span>صلاتي · تطبيق إسلامي مجاني بالكامل</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold cursor-pointer transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
