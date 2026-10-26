import React, { useState, useEffect } from 'react';
import {
  Clock,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Square,
  CheckCircle2,
  MapPin,
  Settings,
  Check,
  ShieldCheck,
} from 'lucide-react';
import {
  CalculationMethodId,
  PrayerName,
  PrayerTimeItem,
  UserLocation,
  AdhanVoice,
  TimeFormatMode,
} from '../types/prayer';
import {
  CalculatedTimes,
  calculateDailyPrayerTimes,
  formatPrayerTime,
  getSavedTimeFormat,
  saveTimeFormat,
  getCountdownToNextPrayer,
  getHijriDate,
  getPrayerList,
} from '../utils/prayerTimes';
import { backgroundAdhanService } from '../services/backgroundAdhanService';
import { soundService } from '../utils/soundService';
import { ADHAN_VOICES } from '../data/adhanSounds';

interface PrayerTimesCardProps {
  location: UserLocation;
  calculationMethod: CalculationMethodId;
  selectedVoice: AdhanVoice;
  onSelectVoice?: (voice: AdhanVoice) => void;
  onOpenSettings: () => void;
  onPlayAdhanForPrayer: (prayerName: string, voice?: AdhanVoice) => void;
  timeFormatMode?: TimeFormatMode;
  onToggleTimeFormat?: (mode: TimeFormatMode) => void;
}

export const PrayerTimesCard: React.FC<PrayerTimesCardProps> = ({
  location,
  calculationMethod,
  selectedVoice,
  onSelectVoice,
  onOpenSettings,
  onPlayAdhanForPrayer,
  timeFormatMode,
  onToggleTimeFormat,
}) => {
  const [now, setNow] = useState<Date>(new Date());
  const [localTimeFormat, setLocalTimeFormat] = useState<TimeFormatMode>(() => getSavedTimeFormat());
  const activeTimeFormat = timeFormatMode || localTimeFormat;

  const [isAdhanEnabled, setIsAdhanEnabled] = useState<boolean>(() => {
    return backgroundAdhanService.getConfig().enabled;
  });

  const [isPlayingAdhan, setIsPlayingAdhan] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hasTestedSound, setHasTestedSound] = useState<boolean>(() => {
    try {
      return localStorage.getItem('salati_audio_confirmed') === 'true';
    } catch {
      return false;
    }
  });

  // Keep live clock tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Subscribe to real-time audio playback status
  useEffect(() => {
    const unsub = soundService.subscribeState((st) => {
      setIsPlayingAdhan(st.isPlaying);
    });
    return unsub;
  }, []);

  const handleToggleTimeFormat = (mode: TimeFormatMode) => {
    setLocalTimeFormat(mode);
    saveTimeFormat(mode);
    if (onToggleTimeFormat) {
      onToggleTimeFormat(mode);
    }
  };

  // Toggle master Adhan switch (One-touch simple experience)
  const handleToggleAdhan = async () => {
    const nextState = !isAdhanEnabled;
    setIsAdhanEnabled(nextState);

    // Update background service config
    backgroundAdhanService.updateConfig({
      enabled: nextState,
      notifyWithFullAudio: true,
      keepActiveInBackground: true,
    });

    if (nextState) {
      // Prime audio session immediately on click
      await soundService.unlockAudioSession().catch(() => {});
      // Request browser notification permission gently
      await backgroundAdhanService.requestNotificationPermission().catch(() => {});

      setToastMessage(`✓ تم تفعيل الأذان التلقائي لمدينة ${location.cityName}`);
    } else {
      soundService.stopAdhan();
      setToastMessage('تم إيقاف الأذان التلقائي');
    }

    setTimeout(() => setToastMessage(null), 3500);
  };

  // Immediate Test & Confirmation of Adhan with 1 touch
  const handleTestOrToggleAdhanSound = async () => {
    if (isPlayingAdhan) {
      soundService.stopAdhan();
      setToastMessage('تم إيقاف صوت الأذان.');
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    try {
      await soundService.unlockAudioSession();
      soundService.playAdhan(selectedVoice.audioUrl, {
        prayerName: countdown.targetPrayer.nameArabic || 'الصلاة',
        reciterTitle: selectedVoice.titleArabic,
      });
      setHasTestedSound(true);
      try {
        localStorage.setItem('salati_audio_confirmed', 'true');
      } catch {}
      setToastMessage(`🔊 الله أكبر.. تم تشغيل صوت الأذان بنجاح (${selectedVoice.titleArabic})`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  };

  const handleDirectPlayPrayer = (prayerItem: PrayerTimeItem) => {
    soundService.unlockAudioSession().catch(() => {});
    soundService.playAdhan(selectedVoice.audioUrl, {
      prayerName: prayerItem.nameArabic,
      reciterTitle: selectedVoice.titleArabic,
    });
    setHasTestedSound(true);
    try {
      localStorage.setItem('salati_audio_confirmed', 'true');
    } catch {}
    setToastMessage(`🔊 جاري رفع أذان ${prayerItem.nameArabic}...`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Calculate prayer times
  const times: CalculatedTimes = calculateDailyPrayerTimes(
    now,
    location.latitude,
    location.longitude,
    calculationMethod,
    'standard',
    undefined,
    location.timezone
  );

  const prayerList = getPrayerList(times, now, activeTimeFormat);
  const countdown = getCountdownToNextPrayer(prayerList, times, now);
  const hijriFallback = getHijriDate(now);

  // Format Hijri date clearly
  let hijriDateString = '';
  try {
    const hijriFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    });
    hijriDateString = hijriFormatter.format(now);
  } catch {
    hijriDateString = `${hijriFallback.dayNameArabic}، ${hijriFallback.day} ${hijriFallback.monthNameArabic} ${hijriFallback.year} هـ`;
  }

  // Format countdown in clear, easy Arabic for elderly
  const getSimpleCountdownText = () => {
    const h = countdown.hours;
    const m = countdown.minutes;
    if (h === 0 && m === 0) return 'حان الآن موعد الأذان المبارك';
    if (h === 0) return `متبقي ${m} دقيقة على أذان ${countdown.targetPrayer.nameArabic}`;
    if (m === 0) return `متبقي ${h} ساعة على أذان ${countdown.targetPrayer.nameArabic}`;
    return `متبقي ${h} ساعة و ${m} دقيقة`;
  };

  const getPrayerIcon = (id: PrayerName) => {
    switch (id) {
      case 'fajr':
        return <Sunrise className="w-7 h-7 text-indigo-300" />;
      case 'sunrise':
        return <Sun className="w-7 h-7 text-amber-300" />;
      case 'dhuhr':
        return <Sun className="w-7 h-7 text-amber-400" />;
      case 'asr':
        return <Sun className="w-7 h-7 text-orange-400" />;
      case 'maghrib':
        return <Sunset className="w-7 h-7 text-rose-400" />;
      case 'isha':
      default:
        return <Moon className="w-7 h-7 text-emerald-300" />;
    }
  };

  // Filter 4 primary quick voice options for senior convenience
  const quickVoices = ADHAN_VOICES.slice(0, 4);

  return (
    <div dir="rtl" className="space-y-6 text-right font-sans">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white font-black text-center text-base shadow-2xl animate-in fade-in duration-200 border-2 border-emerald-400">
          {toastMessage}
        </div>
      )}

      {/* Top Location & Date Bar (Large & Easy to Read) */}
      <div className="rounded-3xl bg-gradient-to-r from-stone-900 via-stone-900 to-[#071917] border border-emerald-500/30 p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* City Information */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
            <MapPin className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl sm:text-3xl font-black text-white font-quran">
                {location.cityName}
              </span>
              <span className="text-sm text-stone-300 font-semibold bg-stone-800/80 px-2.5 py-0.5 rounded-full border border-stone-700">
                {location.countryName}
              </span>
            </div>
            <p className="text-sm text-amber-300 font-bold mt-1">
              {hijriDateString}
            </p>
          </div>
        </div>

        {/* Change City Button (Very Prominent and Senior-Friendly) */}
        <button
          onClick={onOpenSettings}
          className="self-start sm:self-auto px-5 py-3 rounded-2xl bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-200 border border-emerald-500/50 text-sm sm:text-base font-black flex items-center gap-2.5 cursor-pointer transition-all shadow-md active:scale-95"
        >
          <Settings className="w-5 h-5 text-emerald-400" />
          <span>تغيير المدينة الجغرافية 🏙</span>
        </button>
      </div>

      {/* Hero: Next Prayer Card (Large Arabic Typography, High Contrast) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#072820] via-[#051c17] to-stone-950 border-2 border-emerald-500/50 p-6 sm:p-8 shadow-2xl shadow-emerald-950/90 text-center sm:text-right">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-xs sm:text-sm font-black">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>الصلاة القادمة بإذن الله</span>
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white font-quran">
              صلاة {countdown.targetPrayer.nameArabic}
            </h2>

            <div className="text-2xl sm:text-4xl font-extrabold text-amber-300 font-mono tracking-wide py-1">
              {getSimpleCountdownText()}
            </div>

            <p className="text-sm sm:text-base text-stone-200">
              موعد رفع الأذان بتوقيت {location.cityName}:{' '}
              <strong className="text-white text-xl sm:text-2xl font-black font-mono mr-1">
                {countdown.targetPrayer.time}
              </strong>
            </p>
          </div>

          {/* Simple Direct Controls for Elderly */}
          <div className="flex flex-col gap-3 w-full lg:w-auto shrink-0">
            {/* Master Adhan Switch */}
            <button
              onClick={handleToggleAdhan}
              className={`w-full px-6 py-4 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-3 transition-transform active:scale-95 cursor-pointer shadow-xl ${
                isAdhanEnabled
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-emerald-950/80 ring-2 ring-emerald-400/50'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700 border border-stone-700'
              }`}
            >
              <Volume2 className="w-6 h-6 text-amber-300 shrink-0" />
              <span>
                {isAdhanEnabled
                  ? 'الأذان مفعّل تلقائياً لكل الصلوات 🟢'
                  : 'الأذان متوقف - اضغط للتشغيل ⚪'}
              </span>
            </button>

            {/* Reassurance Status Banner */}
            <div className="bg-stone-900/90 border border-emerald-500/30 rounded-2xl p-3 flex items-center gap-2.5 text-xs sm:text-sm text-stone-300">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                {hasTestedSound
                  ? 'مكبر الصوت مؤكد ويعمل تلقائياً عند وقت الصلاة'
                  : 'الأذان جاهز ومضبوط بدقة على توقيت مدينتك'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* One-Touch Adhan Test & Voice Selector Card (Senior Friendly) */}
      <div className="rounded-3xl bg-stone-900/95 border-2 border-amber-500/40 p-5 sm:p-7 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white font-quran flex items-center gap-2">
              <Volume2 className="w-6 h-6 text-amber-400" />
              <span>اختبار وتأكيد صوت الأذان</span>
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 mt-1">
              اضغط على الزر الأخضر الكبير لسماع نداء الأذان الآن والتأكد من مستوى صوت هاتفك
            </p>
          </div>

          {/* Large Senior-Friendly Adhan Test Button */}
          <button
            onClick={handleTestOrToggleAdhanSound}
            className={`w-full sm:w-auto px-6 py-4 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-3 transition-transform active:scale-95 cursor-pointer shadow-xl ${
              isPlayingAdhan
                ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse ring-4 ring-rose-500/40'
                : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:brightness-110 text-white ring-4 ring-emerald-500/30'
            }`}
          >
            {isPlayingAdhan ? (
              <>
                <Square className="w-6 h-6 fill-white text-white shrink-0" />
                <span>⏹ إيقاف صوت الأذان الآن (يرفع حالياً)</span>
              </>
            ) : (
              <>
                <Play className="w-6 h-6 fill-amber-300 text-amber-300 shrink-0" />
                <span>🔊 استماع وتجربة صوت الأذان للتأكد</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Voice Choice Pills */}
        <div className="space-y-2">
          <span className="text-xs sm:text-sm font-bold text-stone-400 block">
            صوت المؤذن المختار للأذان:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {quickVoices.map((voice) => {
              const isSelected = selectedVoice.id === voice.id;
              return (
                <button
                  key={voice.id}
                  onClick={() => {
                    if (onSelectVoice) onSelectVoice(voice);
                    if (isPlayingAdhan) {
                      soundService.playAdhan(voice.audioUrl, {
                        prayerName: 'الأذان',
                        reciterTitle: voice.titleArabic,
                      });
                    }
                  }}
                  className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-950/90 border-emerald-400 text-white shadow-md ring-1 ring-emerald-400'
                      : 'bg-stone-950 border-stone-800 text-stone-300 hover:bg-stone-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black truncate">{voice.titleArabic}</span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </div>
                  <span className="text-[10px] text-stone-400 mt-1">{voice.locationArabic}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Five Daily Prayer Times Grid (Large, High Contrast, Easy for Elders) */}
      <div className="rounded-3xl bg-stone-900/90 border border-stone-800 p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-4">
          <div className="flex items-center gap-2.5 font-bold text-white text-lg sm:text-xl font-quran">
            <Clock className="w-6 h-6 text-emerald-400" />
            <span>مواقيت الصلاة لمدينة {location.cityName}</span>
          </div>

          {/* Simple 12h / 24h System Switch */}
          <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs sm:text-sm self-start sm:self-auto">
            <button
              onClick={() => handleToggleTimeFormat('12h')}
              className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
                activeTimeFormat === '12h'
                  ? 'bg-emerald-600 text-white'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              صباحاً / مساءً
            </button>
            <button
              onClick={() => handleToggleTimeFormat('24h')}
              className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
                activeTimeFormat === '24h'
                  ? 'bg-emerald-600 text-white'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              نظام 24 ساعة
            </button>
          </div>
        </div>

        {/* The Prayer Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {prayerList.map((prayer) => {
            const isNext = prayer.id === countdown.targetPrayer.id;
            const canPlayAdhan = prayer.isPrayer && prayer.id !== 'sunrise' && prayer.id !== 'duha';

            return (
              <div
                key={prayer.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-center justify-between ${
                  isNext
                    ? 'bg-gradient-to-r from-emerald-950/95 via-[#072820] to-stone-950 border-2 border-emerald-400 shadow-xl shadow-emerald-950/60 ring-2 ring-emerald-400/40'
                    : 'bg-stone-950/80 border-stone-800/90 hover:bg-stone-900/80'
                }`}
              >
                {/* Right: Icon + Prayer Name */}
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                      isNext
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        : 'bg-stone-900 border-stone-800 text-stone-400'
                    }`}
                  >
                    {getPrayerIcon(prayer.id)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl sm:text-2xl font-black text-white font-quran">
                        {prayer.nameArabic}
                      </span>
                      {isNext && (
                        <span className="text-[11px] bg-emerald-500 text-stone-950 px-2.5 py-0.5 rounded-full font-black">
                          القادمة
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-stone-400 block mt-0.5">
                      {prayer.id === 'sunrise'
                        ? 'شروق الشمس'
                        : prayer.id === 'duha'
                        ? 'صلاة الضحى المباركة'
                        : 'أذان الصلاة المفروضة'}
                    </span>
                  </div>
                </div>

                {/* Left: Time in large font + Quick Play Speaker */}
                <div className="flex items-center gap-3">
                  <div className="text-left font-mono">
                    <span
                      className={`text-2xl sm:text-3xl font-black tracking-tight ${
                        isNext ? 'text-amber-300' : 'text-stone-100'
                      }`}
                    >
                      {prayer.time}
                    </span>
                  </div>

                  {canPlayAdhan && (
                    <button
                      onClick={() => handleDirectPlayPrayer(prayer)}
                      title={`استماع لأذان صلاة ${prayer.nameArabic}`}
                      className="p-2.5 rounded-xl bg-stone-900 hover:bg-emerald-900/60 text-stone-400 hover:text-emerald-300 border border-stone-800 hover:border-emerald-500/40 cursor-pointer transition-colors"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Gentle guidance footer for elderly */}
        <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800/80 text-xs sm:text-sm text-stone-400 leading-relaxed">
          <p>
            💡 <strong className="text-stone-200">ملاحظة هامة:</strong> يعمل الأذان تلقائياً في موعد كل صلاة دون الحاجة لأي خطوات إضافية. يمكنك في أي وقت الضغط على زر «استماع وتجربة صوت الأذان للتأكد» للتأكد من جاهزية الصوت.
          </p>
        </div>
      </div>
    </div>
  );
};
