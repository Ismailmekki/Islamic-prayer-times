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
  CheckCircle2,
  MapPin,
  Calendar,
  Settings,
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

interface PrayerTimesCardProps {
  location: UserLocation;
  calculationMethod: CalculationMethodId;
  selectedVoice: AdhanVoice;
  onOpenSettings: () => void;
  onPlayAdhanForPrayer: (prayerName: string) => void;
  timeFormatMode?: TimeFormatMode;
  onToggleTimeFormat?: (mode: TimeFormatMode) => void;
}

export const PrayerTimesCard: React.FC<PrayerTimesCardProps> = ({
  location,
  calculationMethod,
  selectedVoice,
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

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Keep live clock tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
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

  const handleListenAdhanNow = () => {
    soundService.unlockAudioSession().catch(() => {});
    onPlayAdhanForPrayer(countdown.targetPrayer.nameArabic);
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
    if (h === 0 && m === 0) return 'حان الآن موعد الأذان';
    if (h === 0) return `متبقي ${m} دقيقة على الأذان`;
    if (m === 0) return `متبقي ${h} ساعة على الأذان`;
    return `متبقي ${h} ساعة و ${m} دقيقة`;
  };

  const getPrayerIcon = (id: PrayerName) => {
    switch (id) {
      case 'fajr':
        return <Sunrise className="w-6 h-6 text-indigo-300" />;
      case 'sunrise':
        return <Sun className="w-6 h-6 text-amber-300" />;
      case 'dhuhr':
        return <Sun className="w-6 h-6 text-amber-400" />;
      case 'asr':
        return <Sun className="w-6 h-6 text-orange-400" />;
      case 'maghrib':
        return <Sunset className="w-6 h-6 text-rose-400" />;
      case 'isha':
      default:
        return <Moon className="w-6 h-6 text-emerald-300" />;
    }
  };

  return (
    <div dir="rtl" className="space-y-5 text-right font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-center text-sm shadow-xl animate-in fade-in duration-300">
          {toastMessage}
        </div>
      )}

      {/* Top Location & Date Bar */}
      <div className="rounded-3xl bg-gradient-to-r from-stone-900 via-stone-900 to-[#071917] border border-emerald-500/30 p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* City Information */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black text-white font-quran">
                {location.cityName}
              </span>
              <span className="text-xs text-stone-400 font-medium">({location.countryName})</span>
            </div>
            <p className="text-xs text-amber-300 font-medium mt-0.5">
              {hijriDateString} هـ
            </p>
          </div>
        </div>

        {/* Change City Button (Big and Senior-Friendly) */}
        <button
          onClick={onOpenSettings}
          className="self-start sm:self-auto px-4 py-2.5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
        >
          <Settings className="w-4 h-4 text-emerald-400" />
          <span>تغيير المدينة 🏙</span>
        </button>
      </div>

      {/* Next Prayer Hero Card (Clear, Large, Spiritual) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#07241e] via-[#051a16] to-stone-950 border-2 border-emerald-500/40 p-6 sm:p-8 shadow-2xl shadow-emerald-950/80 text-center sm:text-right">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>الصلاة القادمة</span>
            </div>

            <h2 className="text-4xl sm:text-5xl font-black text-white font-quran">
              صلاة {countdown.targetPrayer.nameArabic}
            </h2>

            <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono tracking-wide">
              {getSimpleCountdownText()}
            </div>

            <p className="text-xs sm:text-sm text-stone-300">
              موعد الأذان حسب التوقيت المحلي لمدينة {location.cityName}:{' '}
              <strong className="text-white text-base sm:text-lg">{countdown.targetPrayer.time}</strong>
            </p>
          </div>

          {/* Simple Direct Controls for Elderly */}
          <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto">
            {/* Master Adhan Switch */}
            <button
              onClick={handleToggleAdhan}
              className={`w-full sm:w-auto px-6 py-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-3 transition-transform active:scale-95 cursor-pointer shadow-xl ${
                isAdhanEnabled
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-emerald-950/80 ring-2 ring-emerald-400/40'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700 border border-stone-700'
              }`}
            >
              <Volume2 className="w-6 h-6 text-amber-300" />
              <span>
                {isAdhanEnabled
                  ? 'الأذان مفعّل تلقائياً لجميع الصلوات 🟢'
                  : 'الأذان متوقف - اضغط للتشغيل ⚪'}
              </span>
            </button>

            {/* Listen Adhan Now Button */}
            <button
              onClick={handleListenAdhanNow}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-stone-900/90 hover:bg-stone-800 text-emerald-300 border border-emerald-500/40 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md"
            >
              <Play className="w-4 h-4 fill-emerald-300 text-emerald-300" />
              <span>استماع لصوت الأذان الآن ({selectedVoice.titleArabic}) 🔊</span>
            </button>
          </div>
        </div>
      </div>

      {/* Five Daily Prayer Times Table (Large, High Contrast, Senior-Friendly) */}
      <div className="rounded-3xl bg-stone-900/90 border border-stone-800 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2 font-bold text-white text-base sm:text-lg font-quran">
            <Clock className="w-5 h-5 text-emerald-400" />
            <span>مواقيت الصلاة اليوم لمدينة {location.cityName}</span>
          </div>

          {/* Simple 12h / 24h Toggle */}
          <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs">
            <button
              onClick={() => handleToggleTimeFormat('12h')}
              className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                activeTimeFormat === '12h'
                  ? 'bg-emerald-600 text-white'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              صباحاً / مساءً
            </button>
            <button
              onClick={() => handleToggleTimeFormat('24h')}
              className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                activeTimeFormat === '24h'
                  ? 'bg-emerald-600 text-white'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              24 ساعة
            </button>
          </div>
        </div>

        {/* The Prayer Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {prayerList.map((prayer) => {
            const isNext = prayer.id === countdown.targetPrayer.id;

            return (
              <div
                key={prayer.id}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                  isNext
                    ? 'bg-gradient-to-r from-emerald-950/90 via-[#07241e] to-stone-950 border-2 border-emerald-400 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400/30'
                    : 'bg-stone-950/70 border-stone-800/80 hover:bg-stone-900/60'
                }`}
              >
                {/* Right: Icon + Prayer Name */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                      isNext
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        : 'bg-stone-900 border-stone-800 text-stone-400'
                    }`}
                  >
                    {getPrayerIcon(prayer.id)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg sm:text-xl font-black text-white font-quran">
                        {prayer.nameArabic}
                      </span>
                      {isNext && (
                        <span className="text-[10px] bg-emerald-500 text-stone-950 px-2 py-0.5 rounded-full font-black">
                          القادمة
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-stone-400">
                      {prayer.id === 'sunrise' ? 'شروق الشمس' : 'أذان الصلاة'}
                    </span>
                  </div>
                </div>

                {/* Left: Time in large font */}
                <div className="text-left font-mono">
                  <span
                    className={`text-xl sm:text-2xl font-black tracking-tight ${
                      isNext ? 'text-amber-300' : 'text-stone-200'
                    }`}
                  >
                    {prayer.time}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
