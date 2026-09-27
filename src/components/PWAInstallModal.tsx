import React, { useState } from 'react';
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
  Zap,
  Copy,
  Check,
  AlertTriangle,
  Monitor,
  ExternalLink,
  QrCode,
  FileCode2,
  PackageCheck,
  Info,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { getPWABuilderUrl } from '../utils/iosProfileGenerator';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
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
    downloadLauncher,
  } = usePWAInstall();

  // Tab selection: 'ios' | 'android' | 'qr' | 'desktop'
  const [activeTab, setActiveTab] = useState<'ios' | 'android' | 'qr' | 'desktop'>(() => {
    if (isIOS) return 'ios';
    if (isAndroid) return 'android';
    return 'android';
  });

  const [installState, setInstallState] = useState<'idle' | 'installing' | 'done'>('idle');
  const [iosProfileState, setIosProfileState] = useState<'idle' | 'downloading' | 'done'>('idle');

  if (!isOpen) return null;

  const currentSiteUrl = appUrl || (typeof window !== 'undefined' ? window.location.href : '');
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    currentSiteUrl
  )}&bgcolor=1c1917&color=34d399&margin=10`;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl overflow-hidden flex flex-col text-right max-h-[92vh]">
        {/* Top Header */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-b from-emerald-950/90 to-stone-900 border-b border-stone-800/80 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-700/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md shrink-0">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                <span>تثبيت تطبيق «صلاتي»</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                  PWA مجاني وسريع
                </span>
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                تنزيل فوري بحجم صغير جداً (&lt; 1 ميغابايت) يعمل بدون متجر وبدون إنترنت
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning: If inside preview/iframe */}
        {isInIframe && (
          <div className="p-3.5 bg-amber-950/80 border-b border-amber-600/40 flex items-start gap-3 text-xs text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <strong className="block font-bold text-amber-300">
                تنبيه: أنت تتصفح التطبيق داخل إطار المعاينة (Preview)
              </strong>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                متصفحات الهواتف تمنع تثبيت تطبيقات PWA داخل إطارات المواقع لأسباب أمنية. لتثبيت التطبيق بنجاح على هاتفك، افتحه برابطه المباشر في المتصفح أو امسح رمز الـ QR أدناه.
              </p>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <button
                  onClick={openInStandaloneWindow}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>فتح التطبيق في نافذة مستقلة للتثبيت</span>
                </button>
                <button
                  onClick={() => setActiveTab('qr')}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>مسح QR بكاميرا الهاتف</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Warning: In-App Browser (WhatsApp/Instagram/Telegram) */}
        {!isInIframe && isInAppBrowser && (
          <div className="p-3.5 bg-amber-950/70 border-b border-amber-600/40 flex items-start gap-3 text-xs text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <strong className="block font-bold text-amber-300">
                أنت تتصفح من داخل تطبيق تواصل (واتساب / إنستغرام)
              </strong>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                متصفحات المحادثات الداخلية تمنع تثبيت التطبيقات. انسخ الرابط وافتحه في متصفحك الرسمي (Safari للآيفون أو Chrome للأندرويد).
              </p>
              <button
                onClick={copyAppUrl}
                className="mt-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'تم نسخ الرابط بنجاح!' : 'نسخ رابط التطبيق لفتحه بالمتصفح'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Benefits bar */}
        <div className="grid grid-cols-3 gap-1 sm:gap-2 px-4 py-2.5 bg-stone-950/60 border-b border-stone-800/60 text-center">
          <div className="flex flex-col items-center gap-1 p-1">
            <WifiOff className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] sm:text-[11px] text-stone-300 font-medium">يعمل بدون إنترنت (أوفلاين)</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-1">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] sm:text-[11px] text-stone-300 font-medium">حجم خفيف جداً (&lt; 1 ميغابايت)</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-1">
            <Bell className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] sm:text-[11px] text-stone-300 font-medium">رفع الأذان وتنبيهات الصلوات</span>
          </div>
        </div>

        {/* OS Platform Switcher Tabs */}
        <div className="flex items-center border-b border-stone-800 bg-stone-950/40 p-1.5 gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex-1 min-w-[120px] py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'ios'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>آيفون (iOS / IPA)</span>
            {isIOS && (
              <span className="text-[9px] bg-emerald-900 text-emerald-200 px-1 py-0.5 rounded-md">
                جهازك
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 min-w-[120px] py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'android'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>أندرويد (APK / PWA)</span>
            {isAndroid && (
              <span className="text-[9px] bg-emerald-900 text-emerald-200 px-1 py-0.5 rounded-md">
                جهازك
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'qr'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
            title="مسح رمز الاستجابة السريعة بالهاتف"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>رمز الهاتف (QR)</span>
          </button>

          <button
            onClick={() => setActiveTab('desktop')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'desktop'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">الكمبيوتر</span>
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[58vh]">
          {isInstalled ? (
            <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-2.5">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h4 className="text-white font-bold text-sm sm:text-base">التطبيق مثبت بالفعل على جهازك!</h4>
              <p className="text-xs text-stone-300 max-w-sm mx-auto">
                يمكنك فتحه في أي وقت مباشرة من شاشة جهازك الرئيسية، وسيعمل بكامل وظائفه حتى بدون الاتصال بالإنترنت.
              </p>
            </div>
          ) : (
            <>
              {/* Direct One-Click Install Banner when browser supports prompt */}
              {isInstallable && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900/60 via-teal-900/40 to-stone-900 border border-emerald-500/50 space-y-3">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>متصفحك يدعم التثبيت المباشر الفوري بنقرة واحدة!</span>
                    </div>
                    <p className="text-[11px] text-stone-300">
                      اضغط على الزر أدناه لتثبيت التطبيق كحزمة أصلية على شاشة هاتفك مباشرة بدون أي خطوات إضافية.
                    </p>
                  </div>
                  <button
                    onClick={handleDirectInstall}
                    disabled={installState === 'installing'}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                  >
                    {installState === 'installing' ? (
                      <span>جاري التثبيت...</span>
                    ) : installState === 'done' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تم التثبيت بنجاح!</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>تثبيت التطبيق على جهازي الآن (تثبيت فوري)</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* iOS Tab (iPhone / iPad / IPA alternative) */}
              {activeTab === 'ios' && (
                <div className="space-y-4">
                  {/* Apple WebClip Profile Installer (Direct download equivalent to IPA) */}
                  <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-emerald-950/50 to-stone-900/80 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                      <div className="flex items-center gap-2 text-white font-bold text-xs">
                        <FileCode2 className="w-4 h-4 text-amber-400" />
                        <span>خيار التثبيت المباشر للآيفون (ملف تعريف iOS Profile):</span>
                      </div>
                      <span className="text-[10px] text-emerald-300 font-mono">بديل IPA الرسمي</span>
                    </div>
                    <p className="text-[11px] text-stone-300 leading-relaxed">
                      نظراً لأن نظام iOS لا يسمح بتنزيل ملفات IPA غير الموقعة مباشرة عبر المتصفح بدون كمبيوتر أو كسر حماية، يمكنك تنزيل ملف تعريف الآيفون الرسمي <strong>(WebClip Profile)</strong> لتثبيت أيقونة التطبيق على شاشتك بضغطة زر:
                    </p>

                    <div className="space-y-2">
                      <button
                        onClick={handleDownloadProfile}
                        disabled={iosProfileState === 'downloading'}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-emerald-950/60"
                      >
                        {iosProfileState === 'downloading' ? (
                          <span>جاري إنشاء الملف...</span>
                        ) : iosProfileState === 'done' ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-300" />
                            <span>تم تنزيل الملف! افتح الإعدادات لتأكيد التثبيت</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span>تحميل ملف تثبيت الآيفون (salati.mobileconfig)</span>
                          </>
                        )}
                      </button>

                      {iosProfileState === 'done' && (
                        <div className="p-3 rounded-xl bg-stone-950/80 border border-emerald-500/30 text-[11px] text-stone-300 space-y-1">
                          <strong className="text-emerald-400 block font-bold">
                            الخطوة التالية على الآيفون:
                          </strong>
                          <p>
                            1. افتح تطبيق <strong>«الإعدادات» (Settings)</strong> في الآيفون.
                          </p>
                          <p>
                            2. اضغط على <strong>«تم تنزيل ملف التعريف» (Profile Downloaded)</strong> بأعلى القائمة.
                          </p>
                          <p>
                            3. اضغط على <strong>«تثبيت» (Install)</strong> وأدخل رمز قفل الهاتف. ستجد التطبيق مثبتاً على شاشتك فوراً!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Standard Safari Add to Home Screen Method */}
                  <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                      <div className="flex items-center gap-2 text-stone-100 font-bold text-xs">
                        <Smartphone className="w-4 h-4 text-sky-400" />
                        <span>طريقة التثبيت عبر متصفح Safari (الآيفون والآيباد):</span>
                      </div>
                      <span className="text-[10px] text-stone-400">بدون أي برامج إضافية</span>
                    </div>

                    <div className="space-y-3 text-xs text-stone-300">
                      <div className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-900/80 border border-stone-800/80">
                        <span className="w-6 h-6 rounded-lg bg-sky-950 text-sky-300 border border-sky-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          1
                        </span>
                        <div className="flex-1 space-y-0.5">
                          <span className="font-semibold text-white block">
                            اضغط على أيقونة المشاركة (Share):
                          </span>
                          <span className="text-[11px] text-stone-400">
                            أيقونة المربع ذو السهم للأعلى{' '}
                            <strong className="text-sky-300 inline-flex items-center gap-1 mx-1 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800/50">
                              <Share2 className="w-3 h-3 inline" /> مشاركة
                            </strong>{' '}
                            الموجودة في الشريط السفلي لمتصفح Safari.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-900/80 border border-stone-800/80">
                        <span className="w-6 h-6 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          2
                        </span>
                        <div className="flex-1 space-y-0.5">
                          <span className="font-semibold text-white block">
                            اختر «إضافة إلى الصفحة الرئيسية»:
                          </span>
                          <span className="text-[11px] text-stone-400">
                            مرر القائمة المنسدلة وانقر على{' '}
                            <strong className="text-emerald-300 inline-flex items-center gap-1 mx-1 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
                              <PlusSquare className="w-3 h-3 inline text-emerald-400" /> إضافة إلى الصفحة الرئيسية
                            </strong>.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-900/80 border border-stone-800/80">
                        <span className="w-6 h-6 rounded-lg bg-amber-950 text-amber-300 border border-amber-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          3
                        </span>
                        <div className="flex-1 space-y-0.5">
                          <span className="font-semibold text-white block">
                            اضغط على «إضافة» (Add):
                          </span>
                          <span className="text-[11px] text-stone-400">
                            في الزاوية العلوية لتأكيد التثبيت. ستظهر أيقونة «صلاتي» الذهبية على شاشة هاتفك فوراً وتعمل بدون إنترنت.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Android Tab (APK & WebAPK) */}
              {activeTab === 'android' && (
                <div className="space-y-4">
                  {/* WebAPK native explanation */}
                  <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                      <div className="flex items-center gap-2 text-stone-100 font-bold text-xs">
                        <Smartphone className="w-4 h-4 text-emerald-400" />
                        <span>تثبيت الأندرويد (متصفح Chrome أو Samsung Internet):</span>
                      </div>
                      <span className="text-[10px] text-stone-400">توليد حزمة WebAPK أوتوماتيكياً</span>
                    </div>

                    <div className="space-y-3 text-xs text-stone-300">
                      <div className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-900/80 border border-stone-800/80">
                        <span className="w-6 h-6 rounded-lg bg-stone-800 text-stone-200 border border-stone-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          1
                        </span>
                        <div className="flex-1 space-y-0.5">
                          <span className="font-semibold text-white block">
                            اضغط على قائمة المتصفح:
                          </span>
                          <span className="text-[11px] text-stone-400">
                            أيقونة الثلاث نقاط العمودية{' '}
                            <strong className="text-white bg-stone-800 px-1.5 py-0.5 rounded font-mono">
                              ⋮
                            </strong>{' '}
                            في أعلى زاوية المتصفح.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-900/80 border border-stone-800/80">
                        <span className="w-6 h-6 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          2
                        </span>
                        <div className="flex-1 space-y-0.5">
                          <span className="font-semibold text-white block">
                            اختر «تثبيت التطبيق» (Install App):
                          </span>
                          <span className="text-[11px] text-stone-400">
                            أو «الإضافة إلى الشاشة الرئيسية» (Add to Home screen).
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-900/80 border border-stone-800/80">
                        <span className="w-6 h-6 rounded-lg bg-amber-950 text-amber-300 border border-amber-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          3
                        </span>
                        <div className="flex-1 space-y-0.5">
                          <span className="font-semibold text-white block">
                            تأكيد التثبيت:
                          </span>
                          <span className="text-[11px] text-stone-400">
                            يقوم نظام أندرويد بإنشاء حزمة WebAPK أصلية وتثبيتها في قائمة التطبيقات الرئيسية مع صلاحية كاملة لتشغيل الأذان في الخلفية.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Standalone APK Builder Option */}
                  <div className="rounded-2xl border border-stone-800 bg-stone-900/80 p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white font-bold text-xs">
                        <PackageCheck className="w-4 h-4 text-amber-400" />
                        <span>تريد ملف APK منفصل لتثبيته أو إرساله للأصدقاء؟</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-stone-400 leading-relaxed">
                      يمكنك توليد ملف Android APK رسمي (حزمة تثبيت مستقلة) عبر منصة Microsoft PWABuilder المعتمدة بضغطة واحدة:
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={getPWABuilderUrl(currentSiteUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 hover:text-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-amber-500/20"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>توليد حزمة APK عبر PWABuilder ↗</span>
                      </a>
                      <button
                        onClick={downloadLauncher}
                        className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                        title="تنزيل ملف مشغل التطبيق بدون إنترنت"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>تحميل مشغل التطبيق (HTML Launcher)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* QR Code Tab for Instant Mobile Camera Scan */}
              {activeTab === 'qr' && (
                <div className="rounded-2xl border border-stone-800 bg-stone-950/80 p-5 text-center space-y-3.5">
                  <div className="space-y-1">
                    <h4 className="text-white font-bold text-sm">
                      امسح الرمز بكاميرا هاتفك (آيفون أو أندرويد)
                    </h4>
                    <p className="text-xs text-stone-400 max-w-sm mx-auto">
                      افتح تطبيق الكاميرا على هاتفك ووجهه إلى الرمز أدناه ليفتح لك التطبيق مباشرة في متصفحك ويثبته فوراً على شاشة هاتفك:
                    </p>
                  </div>

                  <div className="inline-block p-3.5 rounded-2xl bg-stone-900 border border-emerald-500/30 shadow-lg mx-auto">
                    <img
                      src={qrCodeUrl}
                      alt="رمز QR لتثبيت التطبيق"
                      className="w-48 h-48 rounded-xl object-contain mx-auto"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={copyAppUrl}
                      className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'تم نسخ الرابط!' : 'نسخ رابط التطبيق المباشر'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Desktop Tab */}
              {activeTab === 'desktop' && (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-stone-100 font-bold text-xs border-b border-stone-800 pb-2">
                      <Monitor className="w-4 h-4 text-purple-400" />
                      <span>تثبيت التطبيق على الكمبيوتر واللابتوب (Chrome / Edge / Windows / Mac):</span>
                    </div>
                    <p className="text-xs text-stone-300 leading-relaxed">
                      انقر على أيقونة التثبيت{' '}
                      <strong className="text-emerald-300 inline-flex items-center gap-1 bg-stone-800 px-1.5 py-0.5 rounded">
                        <Download className="w-3.5 h-3.5 inline" /> تثبيت التطبيق
                      </strong>{' '}
                      الموجودة في أقصى يمين شريط عنوان المتصفح (Address Bar) بالأعلى، ثم اضغط على «تثبيت». سيعمل التطبيق كنافذة برنامج مستقل على سطح المكتب بدون شريط المتصفح.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-950/90 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={copyAppUrl}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-stone-800/80 hover:bg-stone-800 text-stone-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'تم نسخ الرابط!' : 'نسخ رابط التطبيق'}</span>
            </button>

            {isInIframe && (
              <button
                onClick={openInStandaloneWindow}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                title="فتح الرابط في نافذة جديدة"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>فتح خارج المعاينة</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold cursor-pointer transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
