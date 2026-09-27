import React, { useState, useEffect } from 'react';
import {
  Bell,
  Volume2,
  ShieldCheck,
  AlertCircle,
  Play,
  Sparkles,
  Check,
  Settings,
  Calendar,
  Smartphone,
  Send,
  HelpCircle,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  BackgroundAdhanConfig,
  NotificationStateInfo,
  backgroundAdhanService,
} from '../services/backgroundAdhanService';
import { AdhanVoice, PrayerTimeItem, UserLocation } from '../types/prayer';
import { getSavedFridayOffsetMinutes, saveFridayOffsetMinutes } from '../utils/prayerTimes';
import { PWAInstallModal } from './PWAInstallModal';

interface BackgroundAdhanCardProps {
  location: UserLocation;
  nextPrayer?: PrayerTimeItem;
  selectedVoice: AdhanVoice;
  onTestTrigger: () => void;
}

export const BackgroundAdhanCard: React.FC<BackgroundAdhanCardProps> = ({
  location,
  nextPrayer,
  selectedVoice,
  onTestTrigger,
}) => {
  const [config, setConfig] = useState<BackgroundAdhanConfig>(backgroundAdhanService.getConfig());
  const [fridayOffset, setFridayOffset] = useState<number>(() => getSavedFridayOffsetMinutes());
  const [notifState, setNotifState] = useState<NotificationStateInfo>(() =>
    backgroundAdhanService.getNotificationState()
  );

  const [isRequesting, setIsRequesting] = useState<boolean>(false);
  const [testTriggered, setTestTriggered] = useState<boolean>(false);
  const [testNotificationSent, setTestNotificationSent] = useState<boolean>(false);
  const [showHowToUnblock, setShowHowToUnblock] = useState<boolean>(false);
  const [showIOSInstallGuide, setShowIOSInstallGuide] = useState<boolean>(false);

  // Sync notification state on mount and visibility change
  const refreshNotificationState = () => {
    setNotifState(backgroundAdhanService.getNotificationState());
  };

  useEffect(() => {
    refreshNotificationState();
    window.addEventListener('focus', refreshNotificationState);
    document.addEventListener('visibilitychange', refreshNotificationState);
    return () => {
      window.removeEventListener('focus', refreshNotificationState);
      document.removeEventListener('visibilitychange', refreshNotificationState);
    };
  }, []);

  const handleToggleMaster = () => {
    const updated = backgroundAdhanService.updateConfig({ enabled: !config.enabled });
    setConfig(updated);
    if (updated.enabled && notifState.permission !== 'granted') {
      handleRequestPermission();
    }
  };

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      if (notifState.needsPWAInstallOnIOS) {
        setShowIOSInstallGuide(true);
        setIsRequesting(false);
        return;
      }

      const res = await backgroundAdhanService.requestNotificationPermission();
      refreshNotificationState();

      if (res === 'granted') {
        // Automatically send a welcome test notification so user sees it right away
        await backgroundAdhanService.sendTestNotification(location.cityName);
        setTestNotificationSent(true);
        setTimeout(() => setTestNotificationSent(false), 5000);
      } else if (res === 'denied') {
        setShowHowToUnblock(true);
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSendTestNotification = async () => {
    const ok = await backgroundAdhanService.sendTestNotification(location.cityName);
    if (ok) {
      setTestNotificationSent(true);
      setTimeout(() => setTestNotificationSent(false), 5000);
    } else {
      handleRequestPermission();
    }
  };

  const handleTogglePrayer = (key: keyof BackgroundAdhanConfig) => {
    const updated = backgroundAdhanService.updateConfig({
      [key]: !config[key],
    });
    setConfig(updated);
  };

  const handleUpdateFridayOffset = (offsetMinutes: number) => {
    setFridayOffset(offsetMinutes);
    saveFridayOffsetMinutes(offsetMinutes);
  };

  const handleRunAudioTest = () => {
    setTestTriggered(true);
    onTestTrigger();
    setTimeout(() => setTestTriggered(false), 3000);
  };

  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#0a2622] via-[#071917] to-[#040f0e] border border-emerald-500/35 p-5 sm:p-7 shadow-xl shadow-emerald-950/50 space-y-5 text-right">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>ميزة «صلاتي» الذكية للأذان</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white font-quran drop-shadow-xs">
            رفع الأذان تلقائياً وإشعارات الصلوات خارج التطبيق
          </h3>
          <p className="text-xs text-emerald-100/80 max-w-2xl leading-relaxed">
            مراقبة دقيقة لمواقيت الصلاة حسب إحداثيات موقعك الجغرافي ({location.cityName})، مع إرسال إشعارات
            النظام والتنبيهات المسبقة ورفع الأذان عند حلول الوقت.
          </p>
        </div>

        {/* Master Switch */}
        <div className="flex items-center gap-3 self-start sm:self-auto bg-[#040f0e] px-4 py-2.5 rounded-2xl border border-emerald-500/30 shrink-0 shadow-inner">
          <span className="text-xs font-bold text-stone-200">
            {config.enabled ? 'الأذان التلقائي: مفعّل' : 'الأذان التلقائي: معطّل'}
          </span>
          <button
            onClick={handleToggleMaster}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              config.enabled ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50' : 'bg-stone-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-0.5 ${
                config.enabled ? 'right-6' : 'right-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Status Alert: Notification Permission & Diagnostics */}
      <div className="space-y-3">
        {/* Case 1: Granted & Ready */}
        {notifState.permission === 'granted' && (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/30 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-emerald-300 flex items-center gap-2">
                  <span>إذن الإشعارات والأذان التلقائي مفعّل بنجاح</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    نشط جاهز
                  </span>
                </div>
                <div className="text-stone-300 text-[11px] mt-0.5">
                  سيتلقى جهازك إشعارات الأذان في الوقت المحدد بدقة لمدينة {location.cityName}.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                onClick={handleSendTestNotification}
                className="px-3.5 py-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 whitespace-nowrap"
                title="إرسال إشعار فوري إلى شريط الإشعارات بهاتفك للتأكد"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{testNotificationSent ? 'تم الإرسال لدرج الإشعارات!' : 'إرسال إشعار تجريبي الآن'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Case 2: iOS needs PWA installation first */}
        {notifState.needsPWAInstallOnIOS && notifState.permission !== 'granted' && (
          <div className="p-4 rounded-2xl bg-sky-950/50 border border-sky-600/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-900/60 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/40">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="text-xs space-y-0.5">
                <div className="font-bold text-sky-300">
                  مستخدمو آيفون (iOS Safari): يلزم تثبيت التطبيق لتفعيل الإشعارات بالخلفية
                </div>
                <p className="text-[11px] text-stone-300 leading-relaxed">
                  تفرض شركة آبل إضافة موقع الويب إلى الشاشة الرئيسية (PWA) ليتمكن النظام من إرسال الإشعارات ورفع الأذان خارج Safari.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSInstallGuide(true)}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs whitespace-nowrap cursor-pointer shadow-md transition-transform active:scale-95 shrink-0"
            >
              عرض خطوات التثبيت على الآيفون
            </button>
          </div>
        )}

        {/* Case 3: Denied / Blocked */}
        {notifState.permission === 'denied' && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-600/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <div className="text-xs text-rose-200">
                  <span className="font-bold">إذن الإشعارات محظور في متصفحك:</span> لا يمكن للتطبيق إرسال تنبيهات الأذان خارج الصفحة حالياً.
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHowToUnblock(!showHowToUnblock)}
                  className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold cursor-pointer border border-stone-700"
                >
                  <HelpCircle className="w-3.5 h-3.5 inline ml-1 text-amber-400" />
                  <span>طريقة فك الحظر</span>
                </button>
                <button
                  onClick={refreshNotificationState}
                  className="px-3 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>إعادة الفحص</span>
                </button>
              </div>
            </div>

            {/* Step by step unblock guide */}
            {showHowToUnblock && (
              <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 text-xs text-stone-300 space-y-1.5 animate-in fade-in">
                <div className="font-bold text-white mb-1">خطوات السماح بالإشعارات في المتصفح:</div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">1.</span>
                  <span>اضغط على أيقونة القفل (🔒) أو خيارات الموقع في شريط عنوان المتصفح بالأعلى.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">2.</span>
                  <span>اختر «أذونات الموقع» (Site Permissions) أو «الإشعارات» (Notifications).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">3.</span>
                  <span>غيّر الحالة من «حظر» إلى «سماح» (Allow).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">4.</span>
                  <span>اضغط على زر «إعادة الفحص» هنا لربط تنبيهات الأذان فوراً.</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Case 4: Default (Not prompted yet and not iOS PWA pending) */}
        {notifState.permission === 'default' && !notifState.needsPWAInstallOnIOS && (
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-600/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
              <div className="text-xs text-amber-200">
                <span className="font-bold text-amber-100">تفعيل إذن الإشعارات مطلوب:</span> لرفع صوت الأذان وإرسال تنبيهات الصلاة عندما يكون التطبيق في الخلفية أو الشاشة مقفلة.
              </div>
            </div>
            <button
              onClick={handleRequestPermission}
              disabled={isRequesting}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-700/30 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 shrink-0"
            >
              <Bell className="w-4 h-4" />
              <span>{isRequesting ? 'جاري الفحص...' : 'تفعيل الإذن الآن'}</span>
            </button>
          </div>
        )}

        {/* Quick Test Adhan Card */}
        <div className="p-3.5 rounded-2xl bg-stone-950/60 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[11px] text-stone-400">الأذان القادم تلقائياً:</div>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">
              صلاة {nextPrayer?.nameArabic || 'القادمة'} ({nextPrayer?.time || '--:--'})
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleRunAudioTest}
              className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-emerald-900/60 text-stone-200 hover:text-emerald-300 text-xs font-semibold border border-stone-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {testTriggered ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Play className="w-3.5 h-3.5" />}
              <span>{testTriggered ? 'جاري رفع الأذان...' : 'تجربة الأذان الصوتي'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Per-Prayer Notification Checkboxes */}
      <div className="pt-2 border-t border-stone-800/80">
        <div className="text-xs font-semibold text-stone-300 mb-2.5">
          الصلوات المفعلة لرفع الأذان والتنبيه تلقائياً:
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {[
            { id: 'fajrEnabled', label: 'الفجر' },
            { id: 'duhaEnabled', label: 'الضحى' },
            { id: 'dhuhrEnabled', label: 'الظهر' },
            { id: 'jumuahEnabled', label: 'الجمعة 🕌' },
            { id: 'asrEnabled', label: 'العصر' },
            { id: 'maghribEnabled', label: 'المغرب' },
            { id: 'ishaEnabled', label: 'العشاء' },
          ].map((item) => {
            const key = item.id as keyof BackgroundAdhanConfig;
            const isChecked = !!config[key];
            return (
              <button
                key={item.id}
                onClick={() => handleTogglePrayer(key)}
                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  isChecked
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 font-bold'
                    : 'bg-stone-900/40 border-stone-800 text-stone-400'
                }`}
              >
                <span>{item.label}</span>
                <span
                  className={`w-4 h-4 rounded-md flex items-center justify-center border text-[10px] ${
                    isChecked
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'border-stone-700 bg-stone-800'
                  }`}
                >
                  {isChecked && '✓'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Friday Prayer Geographic Time Differences Section */}
      <div className="pt-3 border-t border-stone-800/80 bg-stone-950/50 p-3.5 rounded-2xl border border-stone-800 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <Calendar className="w-4 h-4" />
            <span>مواقيت وفروقات صلاة الجمعة جغرافيّاً ({location.cityName} - {location.countryName})</span>
          </div>
          <span className="text-[11px] text-stone-400 font-mono">
            {fridayOffset === 0 ? 'مع وقت الظهر تماماً' : fridayOffset > 0 ? `+${fridayOffset} دقيقة` : `${fridayOffset} دقيقة`}
          </span>
        </div>

        <p className="text-[11px] text-stone-400 leading-relaxed">
          في يوم الجمعة، يحل أذان وصلاة الجمعة محل صلاة الظهر تلقائياً. يمكنك ضبط فرق توقيت صلاة وخطبة الجمعة في مساجد مدينتك:
        </p>

        {/* Friday Offset Selector Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-stone-400 ml-1">تعديل فرق التوقيت:</span>
          {[
            { offset: -30, label: '30- د (الأذان الأول)' },
            { offset: -20, label: '20- د' },
            { offset: 0, label: '0 د (وقت الزوال)' },
            { offset: 15, label: '15+ د' },
            { offset: 30, label: '30+ د' },
          ].map((btn) => (
            <button
              key={btn.offset}
              onClick={() => handleUpdateFridayOffset(btn.offset)}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer border ${
                fridayOffset === btn.offset
                  ? 'bg-emerald-600 text-white font-bold border-emerald-500 shadow-xs'
                  : 'bg-stone-900 text-stone-300 border-stone-800 hover:bg-stone-800 hover:text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Battery Optimization / Background Tip */}
      <div className="p-3 rounded-2xl bg-stone-950/30 border border-stone-800/80 flex items-start gap-2.5 text-[11px] text-stone-400">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-stone-300">نصيحة لهواتف الأندرويد والآيفون: </span>
          <span>
            لضمان دقة مواعيد رفع الأذان بالدقيقة والثانية عند قفل الهاتف، تأكد من منح التطبيق إذن العمل بالخلفية بدون قيود من إعدادات البطارية (Unrestricted / No Battery Restrictions).
          </span>
        </div>
      </div>

      {/* PWA Install Modal for iOS Guidance */}
      <PWAInstallModal isOpen={showIOSInstallGuide} onClose={() => setShowIOSInstallGuide(false)} />
    </div>
  );
};
