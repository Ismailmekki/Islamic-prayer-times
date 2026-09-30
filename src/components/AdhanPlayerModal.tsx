import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Sparkles,
  Moon,
  Bell,
  BellOff,
  BellRing,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Send,
  Check,
  Smartphone,
  Settings,
} from 'lucide-react';
import { ADHAN_VOICES, DUA_AFTER_ADHAN, ADHAN_WORDS } from '../data/adhanSounds';
import { AdhanVoice } from '../types/prayer';
import { soundService } from '../utils/soundService';
import {
  backgroundAdhanService,
  NotificationStateInfo,
} from '../services/backgroundAdhanService';
import { PWAInstallModal } from './PWAInstallModal';

interface AdhanPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  prayerName?: string;
  selectedVoice: AdhanVoice;
  onSelectVoice: (voice: AdhanVoice) => void;
}

export const AdhanPlayerModal: React.FC<AdhanPlayerModalProps> = ({
  isOpen,
  onClose,
  prayerName = 'الصلاة',
  selectedVoice,
  onSelectVoice,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState(0);

  // Notification state for background Adhan
  const [notifState, setNotifState] = useState<NotificationStateInfo>(() =>
    backgroundAdhanService.getNotificationState()
  );
  const [showHowToUnblock, setShowHowToUnblock] = useState<boolean>(false);
  const [isRequestingNotif, setIsRequestingNotif] = useState<boolean>(false);
  const [testNotifSuccess, setTestNotifSuccess] = useState<boolean>(false);
  const [showIOSInstallGuide, setShowIOSInstallGuide] = useState<boolean>(false);

  // Sync notification state on open, focus, and visibilitychange
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
  }, [isOpen]);

  const handleRequestPermission = async () => {
    if (notifState.needsPWAInstallOnIOS) {
      setShowIOSInstallGuide(true);
      return;
    }

    setIsRequestingNotif(true);
    try {
      const res = await backgroundAdhanService.requestNotificationPermission();
      refreshNotificationState();

      if (res === 'granted') {
        await backgroundAdhanService.sendTestNotification(prayerName);
        setTestNotifSuccess(true);
        setTimeout(() => setTestNotifSuccess(false), 4500);
      } else if (res === 'denied') {
        setShowHowToUnblock(true);
      }
    } finally {
      setIsRequestingNotif(false);
    }
  };

  const handleSendTestNotification = async () => {
    const ok = await backgroundAdhanService.sendTestNotification(prayerName);
    if (ok) {
      setTestNotifSuccess(true);
      setTimeout(() => setTestNotifSuccess(false), 4500);
    } else {
      handleRequestPermission();
    }
  };

  useEffect(() => {
    if (isOpen) {
      startAdhanPlayback(selectedVoice);
    } else {
      soundService.stopAdhan();
      setIsPlaying(false);
    }
    return () => {
      soundService.stopAdhan();
    };
  }, [isOpen, selectedVoice]);

  // Rotate adhan phrases on interval during playback
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveWordIndex((prev) => (prev + 1) % ADHAN_WORDS.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const startAdhanPlayback = (voice: AdhanVoice) => {
    setIsPlaying(true);
    soundService.playAdhan(
      voice.audioUrl,
      (curr, dur) => {
        setCurrentTime(curr);
        if (dur && !isNaN(dur)) setDuration(dur);
      },
      () => {
        setIsPlaying(false);
      },
      () => {
        // If error, synthetic chime plays automatically
      }
    );
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      soundService.pauseAdhan();
      setIsPlaying(false);
    } else {
      soundService.resumeAdhan();
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    soundService.stopAdhan();
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    soundService.setAdhanVolume(val);
    if (val === 0) setIsMuted(true);
    else setIsMuted(false);
  };

  if (!isOpen) return null;

  const isFajr = prayerName.includes('الفجر');
  const availablePhrases = ADHAN_WORDS.filter((w) => !w.fajrOnly || isFajr);
  const currentPhrase = availablePhrases[activeWordIndex % availablePhrases.length] || availablePhrases[0];
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-gradient-to-b from-stone-900 via-stone-900 to-emerald-950/80 border border-emerald-500/40 rounded-3xl p-5 sm:p-8 shadow-2xl shadow-emerald-950/50 flex flex-col items-center text-center">
        {/* Close Button */}
        <button
          onClick={() => {
            handleStop();
            onClose();
          }}
          className="absolute top-5 left-5 p-2 rounded-full bg-stone-800/80 text-stone-400 hover:text-white hover:bg-stone-700 transition-colors z-20 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Ambient Top Glow */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-emerald-500/15 to-transparent pointer-events-none" />

        {/* Header Label */}
        <div className="flex items-center gap-2 text-emerald-400 text-xs sm:text-sm font-semibold mb-2 flex-wrap justify-center">
          <Moon className="w-4 h-4" />
          <span>حَانَ الآن موعد رفع الأذان · {prayerName}</span>
          <span className="text-[10px] bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 font-mono">
            HQ 128kbps نقي
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1 font-quran">
          {selectedVoice.titleArabic}
        </h2>
        <p className="text-xs sm:text-sm text-stone-400 mb-3">
          {selectedVoice.reciterArabic} · {selectedVoice.locationArabic}
        </p>

        {/* Quick Voice Switcher Pills in Modal */}
        <div className="w-full mb-4 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {ADHAN_VOICES.map((voice) => {
            const isCurr = selectedVoice.id === voice.id;
            return (
              <button
                key={voice.id}
                onClick={() => {
                  onSelectVoice(voice);
                  startAdhanPlayback(voice);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border shrink-0 flex items-center gap-1.5 ${
                  isCurr
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md font-bold'
                    : 'bg-stone-950/70 text-stone-300 hover:text-white border-stone-800 hover:bg-stone-800'
                }`}
              >
                {isCurr && <Volume2 className="w-3 h-3 text-amber-300 animate-pulse" />}
                <span>{voice.titleArabic.replace('أذان ', '')}</span>
              </button>
            );
          })}
        </div>

        {/* Central Calligraphy Display Card */}
        <div className="w-full py-7 px-6 my-2 rounded-2xl bg-stone-950/70 border border-emerald-500/20 shadow-inner flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden">
          <span className="text-2xl sm:text-4xl font-bold text-emerald-300 font-quran leading-relaxed animate-pulse">
            {currentPhrase.text}
          </span>
          <span className="text-xs text-stone-500 mt-3 font-sans">
            {prayerName.includes('الظهر')
              ? '«رُفع الآن أذان صلاة الظهر المبارك - حَيَّ عَلَى الصَّلَاةِ، حَيَّ عَلَى الْفَلَاحِ»'
              : prayerName.includes('العصر')
              ? '«رُفع الآن أذان صلاة العصر المبارك - حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَى»'
              : '«أشهد أن لا إله إلا الله، وأشهد أن محمداً رسول الله»'}
          </span>

          {/* Sound waves visualization simulation */}
          {isPlaying && (
            <div className="flex items-center justify-center gap-1.5 mt-4">
              {[40, 75, 55, 90, 60, 100, 70, 85, 45, 95, 65, 80, 50].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-gradient-to-t from-emerald-600 to-teal-400 rounded-full animate-bounce"
                  style={{
                    height: `${(h * 0.28).toFixed(0)}px`,
                    animationDuration: `${0.4 + (i % 5) * 0.15}s`,
                    animationDelay: `${i * 0.05}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full mt-4 space-y-1">
          <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-stone-400 tabular-nums">
            <span>
              {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}
            </span>
            <span>{selectedVoice.durationText}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 my-6 flex-wrap">
          <button
            onClick={handleTogglePlay}
            className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/40 transition-transform active:scale-95 cursor-pointer"
            title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current mr-0.5" />}
          </button>

          <button
            onClick={handleStop}
            className="w-11 h-11 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition-colors cursor-pointer"
            title="إيقاف كامل"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>

          <div className="flex items-center gap-2 bg-stone-950/80 px-3.5 py-2 rounded-xl border border-stone-800">
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-stone-500 cursor-pointer" onClick={() => handleVolumeChange({ target: { value: '0.8' } } as unknown as React.ChangeEvent<HTMLInputElement>)} />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400 cursor-pointer" onClick={() => handleVolumeChange({ target: { value: '0' } } as unknown as React.ChangeEvent<HTMLInputElement>)} />
            )}
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-24 accent-emerald-500 h-1.5 cursor-pointer"
              title="مستوى الصوت"
            />
            <span className="text-[10px] font-mono text-emerald-300 min-w-[28px]">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>

        {/* Background Adhan & Notification Permission Status */}
        <div className="w-full text-right mb-6 p-4 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-2.5">
              {notifState.permission === 'granted' ? (
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              ) : notifState.permission === 'denied' ? (
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                  <BellOff className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4 animate-bounce" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    {notifState.permission === 'granted'
                      ? 'إذن التنبيهات مفعّل (الأذان بالخلفية نشط)'
                      : notifState.permission === 'denied'
                      ? 'إذن الإشعارات محظور في المتصفح'
                      : notifState.needsPWAInstallOnIOS
                      ? 'يلزم تثبيت التطبيق على الآيفون'
                      : 'تفعيل التنبيهات مطلوب لرفع الأذان بالخلفية'}
                  </span>
                  {notifState.permission === 'granted' && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                      جاهز
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed">
                  {notifState.permission === 'granted'
                    ? 'سيتم رفع الأذان وإرسال الإشعار تلقائياً في موعد الصلاة حتى لو كان التطبيق مغلقاً أو الشاشة مقفلة.'
                    : notifState.permission === 'denied'
                    ? 'لن يُسمع الأذان خارج التطبيق لأن المتصفح يحظر التنبيهات. اضغط على زر فك الحظر لتفعيله من إعدادات المتصفح.'
                    : notifState.needsPWAInstallOnIOS
                    ? 'تفرض آبل إضافة الموقع إلى الشاشة الرئيسية (PWA) لتشغيل الإشعارات والأذان عند قفل الهاتف.'
                    : 'اسمح بالإشعارات لضمان سماع الأذان في وقته بدقة عندما يكون هاتفك مقفلاً أو في جيبك.'}
                </p>
              </div>
            </div>

            {/* Action Buttons depending on status */}
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              {notifState.permission === 'granted' ? (
                <button
                  type="button"
                  onClick={handleSendTestNotification}
                  className="px-3 py-1.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
                  title="إرسال إشعار تجريبي فوري لشاشة الهاتف"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{testNotifSuccess ? 'تم الإرسال لدرج الإشعارات!' : 'تجربة تنبيه الأذان'}</span>
                </button>
              ) : notifState.permission === 'denied' ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowHowToUnblock(!showHowToUnblock)}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-md shadow-rose-900/30 whitespace-nowrap"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>تفعيل التنبيهات (إعدادات المتصفح)</span>
                  </button>
                  <button
                    type="button"
                    onClick={refreshNotificationState}
                    className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-colors"
                    title="إعادة فحص الإذن بعد التعديل"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : notifState.needsPWAInstallOnIOS ? (
                <button
                  type="button"
                  onClick={() => setShowIOSInstallGuide(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-md whitespace-nowrap"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>خطوات التثبيت للآيفون</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  disabled={isRequestingNotif}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-md shadow-amber-800/30 whitespace-nowrap"
                >
                  <BellRing className="w-3.5 h-3.5" />
                  <span>{isRequestingNotif ? 'جاري الفحص...' : 'تفعيل التنبيهات الآن'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Detailed step-by-step browser settings guide for unblocking */}
          {showHowToUnblock && notifState.permission === 'denied' && (
            <div className="p-3.5 rounded-xl bg-stone-900 border border-rose-500/30 text-xs text-stone-300 space-y-2 animate-in fade-in">
              <div className="font-bold text-white flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-rose-300">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>خطوات فك حظر الإشعارات في إعدادات متصفحك:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowHowToUnblock(false)}
                  className="text-stone-400 hover:text-white text-xs"
                >
                  إخفاء ✕
                </button>
              </div>

              <div className="space-y-1.5 pr-1 text-[11px] leading-relaxed">
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-[10px]">
                    1
                  </span>
                  <span>
                    انقر على أيقونة <strong>القفل (🔒)</strong> أو <strong>خيارات الموقع (Site settings)</strong> في شريط عنوان المتصفح بالأعلى.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-[10px]">
                    2
                  </span>
                  <span>
                    ابحث عن إذن <strong>«الإشعارات» (Notifications)</strong> أو <strong>«أذونات الموقع»</strong>.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-[10px]">
                    3
                  </span>
                  <span>
                    قم بتغيير الحالة من <strong>«حظر»</strong> إلى <strong>«سماح» (Allow)</strong>.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-[10px]">
                    4
                  </span>
                  <span>
                    ارجع هنا واضغط على زر <strong className="text-emerald-400">«إعادة الفحص الآن»</strong> لتفعيل الأذان بالخلفية فوراً.
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  type="button"
                  onClick={refreshNotificationState}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>إعادة الفحص الآن</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reciters Selector Dropdown / Pills */}
        <div className="w-full text-right mb-6">
          <label className="block text-xs font-semibold text-stone-300 mb-2">
            اختر صوت المؤذن:
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {ADHAN_VOICES.map((voice) => {
              const isSelected = selectedVoice.id === voice.id;
              return (
                <button
                  key={voice.id}
                  onClick={() => onSelectVoice(voice)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors border ${
                    isSelected
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                      : 'bg-stone-800/80 text-stone-300 border-stone-700 hover:bg-stone-700'
                  }`}
                >
                  {voice.titleArabic}
                </button>
              );
            })}
          </div>
        </div>

        {/* Authentic Dua After Adhan */}
        <div className="w-full text-right p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/20 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>دعاء ما بعد الأذان (مستجاب):</span>
          </div>
          <p className="text-sm font-quran text-stone-200 leading-relaxed">
            «{DUA_AFTER_ADHAN.arabic}»
          </p>
          <div className="text-[11px] text-stone-400 flex items-center justify-between pt-1 border-t border-emerald-900/40">
            <span>{DUA_AFTER_ADHAN.reference}</span>
            <span className="text-emerald-400 font-medium">{DUA_AFTER_ADHAN.reward}</span>
          </div>
        </div>

        {/* iOS PWA Install Guidance Modal */}
        <PWAInstallModal isOpen={showIOSInstallGuide} onClose={() => setShowIOSInstallGuide(false)} />
      </div>
    </div>
  );
};
