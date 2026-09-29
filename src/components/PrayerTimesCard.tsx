import React, { useState, useEffect } from 'react';
import {
  Clock,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Sparkles,
  Calendar,
  Volume2,
  VolumeX,
  ChevronLeft,
  Settings,
  Bell,
  CheckCircle2,
  Compass,
} from 'lucide-react';
import {
  CalculationMethodId,
  PrayerName,
  PrayerTimeItem,
  UserLocation,
  AdhanVoice,
} from '../types/prayer';
import {
  CalculatedTimes,
  CALCULATION_METHODS,
  calculateDailyPrayerTimes,
  formatTimeArabic,
  formatTime24h,
  getCountdownToNextPrayer,
  getHijriDate,
  getPrayerList,
} from '../utils/prayerTimes';
import { BackgroundAdhanCard } from './BackgroundAdhanCard';

interface PrayerTimesCardProps {
  location: UserLocation;
  calculationMethod: CalculationMethodId;
  selectedVoice: AdhanVoice;
  onOpenSettings: () => void;
  onPlayAdhanForPrayer: (prayerName: string) => void;
}

export const PrayerTimesCard: React.FC<PrayerTimesCardProps> = ({
  location,
  calculationMethod,
  selectedVoice,
  onOpenSettings,
  onPlayAdhanForPrayer,
}) => {
  const [now, setNow] = useState<Date>(new Date());
  const [showMonthlyModal, setShowMonthlyModal] = useState(false);
  const [mutedPrayers, setMutedPrayers] = useState<Record<PrayerName, boolean>>({
    fajr: false,
    sunrise: true,
    duha: false,
    dhuhr: false,
    jumuah: false,
    asr: false,
    maghrib: false,
    isha: false,
    qiyam: true,
  });

  // Keep live time tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const times: CalculatedTimes = calculateDailyPrayerTimes(
    now,
    location.latitude,
    location.longitude,
    calculationMethod,
    'standard',
    undefined,
    location.timezone
  );

  const prayerList = getPrayerList(times, now);
  const countdown = getCountdownToNextPrayer(prayerList, times, now);
  const hijriFallback = getHijriDate(now);

  // Accurate Hijri calendar formatting using 'islamic-umalqura'
  let hijriUmmAlQuraFormatted = '';
  let hijriDayNumber = '';
  let hijriMonthName = '';
  let hijriYearNumber = '';
  let hijriWeekday = '';

  try {
    const hijriFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    });
    hijriUmmAlQuraFormatted = hijriFormatter.format(now);

    const parts = hijriFormatter.formatToParts(now);
    hijriDayNumber = parts.find((p) => p.type === 'day')?.value || '';
    hijriMonthName = parts.find((p) => p.type === 'month')?.value || '';
    hijriYearNumber = parts.find((p) => p.type === 'year')?.value || '';
    hijriWeekday = parts.find((p) => p.type === 'weekday')?.value || '';
  } catch {
    hijriUmmAlQuraFormatted = `${hijriFallback.dayNameArabic}، ${hijriFallback.day} ${hijriFallback.monthNameArabic} ${hijriFallback.year} هـ`;
    hijriDayNumber = hijriFallback.day.toString();
    hijriMonthName = hijriFallback.monthNameArabic;
    hijriYearNumber = hijriFallback.year.toString();
    hijriWeekday = hijriFallback.dayNameArabic;
  }

  // Accurate Gregorian date formatting alongside Hijri
  let gregorianFormatted = '';
  try {
    const gregorianFormatter = new Intl.DateTimeFormat('ar-SA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    });
    gregorianFormatted = gregorianFormatter.format(now);
  } catch {
    gregorianFormatted = `${hijriFallback.dayNameArabic}، ${hijriFallback.gregorianDateFormatted} م`;
  }

  const toggleMute = (id: PrayerName) => {
    setMutedPrayers((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getPrayerIcon = (id: PrayerName) => {
    switch (id) {
      case 'fajr':
        return <Sunrise className="w-5 h-5 text-indigo-300" />;
      case 'sunrise':
        return <Sun className="w-5 h-5 text-amber-300" />;
      case 'duha':
        return <Sparkles className="w-5 h-5 text-amber-300" />;
      case 'jumuah':
        return <Compass className="w-5 h-5 text-emerald-400" />;
      case 'dhuhr':
        return <Sun className="w-5 h-5 text-amber-400" />;
      case 'asr':
        return <Sun className="w-5 h-5 text-orange-400" />;
      case 'maghrib':
        return <Sunset className="w-5 h-5 text-rose-400" />;
      case 'isha':
      default:
        return <Moon className="w-5 h-5 text-emerald-300" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Hijri Calendar Display with islamic-umalqura alongside Gregorian date */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-stone-900 via-stone-900 to-emerald-950/70 border border-emerald-500/30 p-5 sm:p-6 shadow-lg shadow-black/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Main Hijri & Gregorian Text lockup */}
          <div className="flex items-center gap-4">
            {/* Visual Hijri Calendar Emblem */}
            <div className="flex flex-col items-center justify-center w-16 h-18 sm:w-20 sm:h-22 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-center shadow-inner shrink-0 p-1">
              <span className="text-[10px] sm:text-xs font-bold text-emerald-400 font-sans">
                {hijriMonthName}
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-quran tabular-nums leading-tight">
                {hijriDayNumber}
              </span>
              <span className="text-[10px] text-amber-300 font-medium font-sans">
                {hijriYearNumber} هـ
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-500/30 flex items-center gap-1.5 shadow-xs">
                  <Moon className="w-3 h-3 text-amber-400" />
                  <span>التقويم الهجري (تقويم أم القرى المبارك)</span>
                </span>
                <span className="text-xs text-emerald-200/80">
                  · {location.cityName}
                </span>
              </div>

              {/* Big Hijri Date Headline */}
              <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-l from-amber-200 via-emerald-100 to-white bg-clip-text text-transparent font-quran tracking-wide drop-shadow-xs">
                {hijriUmmAlQuraFormatted} هـ
              </h3>

              {/* Gregorian Date alongside it */}
              <div className="flex items-center gap-2 text-xs sm:text-sm text-stone-300">
                <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>الموافق ميلادياً:</span>
                <strong className="text-amber-300 font-semibold">{gregorianFormatted} م</strong>
              </div>
            </div>
          </div>

          {/* Quick Action buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={() => setShowMonthlyModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[#09221f] hover:bg-[#0d2f2b] text-emerald-200 text-xs font-semibold border border-emerald-500/30 hover:border-emerald-400/60 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>جدول الشهر الكامل</span>
            </button>
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-[#09221f] hover:bg-[#0d2f2b] text-stone-300 hover:text-white border border-emerald-500/30 hover:border-emerald-400/60 transition-all shadow-xs cursor-pointer"
              title="إعدادات الحساب والموقع"
            >
              <Settings className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Hero: Next Prayer Countdown Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c2a26] via-[#081a17] to-[#040e0d] border border-emerald-400/40 p-6 sm:p-8 shadow-2xl shadow-emerald-950/80">
        {/* Subtle decorative background pattern */}
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left / Primary: Next prayer detail */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>الصلاة القادمة</span>
            </div>
            <div className="flex items-baseline gap-3">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-quran drop-shadow-sm">
                صلاة {countdown.targetPrayer.nameArabic}
              </h2>
              <span className="text-xl sm:text-3xl font-extrabold text-emerald-300 tabular-nums drop-shadow-sm">
                {countdown.targetPrayer.time}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-100/80">
              الوقت المتبقي لرفع الأذان في {location.cityName}:
            </p>
          </div>

          {/* Right: Big Countdown Ticker */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#030d0b]/90 border border-emerald-400/30 shadow-inner ring-1 ring-emerald-500/20">
              <span className="text-2xl sm:text-4xl font-extrabold text-white tabular-nums drop-shadow-sm">
                {countdown.hours.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs text-stone-300 font-medium">ساعة</span>
            </div>
            <span className="text-2xl font-bold text-emerald-400">:</span>
            <div className="flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#030d0b]/90 border border-emerald-400/30 shadow-inner ring-1 ring-emerald-500/20">
              <span className="text-2xl sm:text-4xl font-extrabold text-emerald-300 tabular-nums drop-shadow-sm">
                {countdown.minutes.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs text-stone-300 font-medium">دقيقة</span>
            </div>
            <span className="text-2xl font-bold text-amber-400">:</span>
            <div className="flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#030d0b]/90 border border-emerald-400/30 shadow-inner ring-1 ring-emerald-500/20">
              <span className="text-2xl sm:text-4xl font-extrabold text-amber-300 tabular-nums drop-shadow-sm">
                {countdown.seconds.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs text-stone-300 font-medium">ثانية</span>
            </div>
          </div>
        </div>

        {/* Progress Bar of prayer interval */}
        <div className="mt-6 pt-4 border-t border-emerald-900/40">
          <div className="flex items-center justify-between text-xs text-stone-300 mb-1.5">
            <span>انقضاء وقت الانتظار</span>
            <span className="tabular-nums font-bold text-amber-300">{countdown.percentageElapsed}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#030e0c] overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-amber-400 via-emerald-400 to-teal-500 rounded-full transition-all duration-1000 shadow-sm shadow-emerald-400/50"
              style={{ width: `${countdown.percentageElapsed}%` }}
            />
          </div>
        </div>
      </div>

      {/* Feature Card: Background Full Adhan Playback */}
      <BackgroundAdhanCard
        location={location}
        nextPrayer={countdown.targetPrayer}
        selectedVoice={selectedVoice}
        onTestTrigger={() => onPlayAdhanForPrayer(countdown.targetPrayer.nameArabic)}
      />

      {/* Prayer Grid (The 5 daily prayers + Sunrise) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>مواقيت اليوم</span>
          </h3>
          <span className="text-xs text-stone-400">
            الوقت الحالي: <strong className="text-emerald-400 tabular-nums">{formatTimeArabic(now, true)}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
          {prayerList.map((item) => {
            const isMuted = mutedPrayers[item.id];
            return (
              <div
                key={item.id}
                className={`relative flex flex-col justify-between p-4 rounded-2xl border transition-all ${
                  item.isNext
                    ? 'bg-gradient-to-b from-[#0f3d35] via-[#092520] to-[#041210] border-emerald-400/90 shadow-2xl shadow-emerald-950/80 scale-[1.03] ring-1 ring-emerald-400/40'
                    : item.isCurrent
                    ? 'bg-gradient-to-b from-[#1a2d18] via-[#0d1e12] to-[#050f08] border-amber-400/60 shadow-xl'
                    : 'bg-[#071a18]/85 border-emerald-500/20 hover:border-emerald-400/40 hover:bg-[#0b2622]/90 shadow-sm'
                }`}
              >
                {/* Status Indicator */}
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-xl border ${item.isNext ? 'bg-[#030e0c] border-emerald-400/50 text-emerald-300' : 'bg-[#030e0c] border-emerald-500/25 text-emerald-400'}`}>
                    {getPrayerIcon(item.id)}
                  </div>
                  {item.isPrayer && (
                    <button
                      onClick={() => toggleMute(item.id)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isMuted
                          ? 'text-stone-500 hover:text-stone-300'
                          : 'text-amber-300 hover:text-amber-200 bg-amber-950/50 border border-amber-500/30'
                      }`}
                      title={isMuted ? 'تفعيل تنبيه الأذان' : 'كتم تنبيه الأذان'}
                    >
                      {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                {/* Name & Time */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-base text-white">{item.nameArabic}</span>
                    {item.isNext && (
                      <span className="text-[10px] text-amber-200 font-bold bg-amber-950/90 px-2 py-0.5 rounded-md border border-amber-500/40 shadow-xs">
                        القادمة
                      </span>
                    )}
                    {item.isCurrent && !item.isNext && (
                      <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950/90 px-2 py-0.5 rounded-md border border-emerald-500/40 shadow-xs">
                        الآن
                      </span>
                    )}
                  </div>
                  <div className={`text-lg sm:text-xl font-black tabular-nums tracking-tight ${item.isNext ? 'text-emerald-300 drop-shadow-xs' : 'text-stone-100'}`}>
                    {item.time}
                  </div>
                </div>

                {/* Quick Adhan Preview button */}
                {item.isPrayer && (
                  <button
                    onClick={() => onPlayAdhanForPrayer(item.nameArabic)}
                    className={`mt-3 w-full py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                      item.isNext
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-md shadow-emerald-950'
                        : 'bg-[#09221f] hover:bg-emerald-900/60 text-stone-200 hover:text-white border border-emerald-500/25'
                    }`}
                  >
                    <Volume2 className="w-3 h-3 text-amber-300" />
                    <span>سماع الأذان</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Friday Prayer Geographic Schedule Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#0c2a26] via-[#081b18] to-[#04100e] border border-emerald-500/40 shadow-xl shadow-emerald-950/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/30 via-emerald-800/40 to-amber-500/20 text-amber-300 border border-emerald-400/40 shadow-md shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm sm:text-base font-bold text-white">
                صلاة الجمعة المباركة في {location.cityName} ({location.countryName})
              </h4>
              {now.getDay() === 5 && (
                <span className="text-[10px] bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold px-2 py-0.5 rounded-md animate-pulse shadow-sm">
                  اليوم صلاة الجمعة
                </span>
              )}
            </div>
            <div className="text-xs text-stone-300 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>
                الأذان الثاني والخطبة:{' '}
                <strong className="text-emerald-300 font-mono text-sm">{formatTimeArabic(times.jumuah)}</strong>
              </span>
              <span>
                الأذان الأول للتذكير والتبكير:{' '}
                <strong className="text-amber-200 font-mono">{formatTimeArabic(times.jumuahFirstAdhan)}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-emerald-200 bg-[#061e1b] px-3.5 py-2 rounded-xl border border-emerald-500/30 self-start md:self-auto shrink-0 flex items-center gap-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span>من سنن الجمعة: الغسل، التبكير، قراءة سورة الكهف، والإكثار من الصلاة على النبي ﷺ</span>
        </div>
      </div>

      {/* Extra Islamic times: Qiyam al-layl & Suhoor */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-[#071917]/90 border border-indigo-500/25 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-950/70 text-indigo-300 border border-indigo-700/40 shadow-inner">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">قيام الليل والثلث الأخير</div>
              <div className="text-xs text-indigo-200/70">أفضل أوقات استجابة الدعاء والمناجاة</div>
            </div>
          </div>
          <div className="text-lg font-black text-indigo-300 tabular-nums">
            {formatTimeArabic(times.qiyam)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#071917]/90 border border-amber-500/25 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-950/70 text-amber-300 border border-amber-700/40 shadow-inner">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">شروق الشمس (صلاة الضحى)</div>
              <div className="text-xs text-amber-200/70">يبدأ وقت صلاة الأوابين بعد الشروق بـ 15 دقيقة</div>
            </div>
          </div>
          <div className="text-lg font-black text-amber-300 tabular-nums">
            {formatTimeArabic(times.sunrise)}
          </div>
        </div>
      </div>

      {/* Monthly Prayer Calendar Modal */}
      {showMonthlyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-stone-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  جدول مواقيت الصلاة الشهري - {location.cityName}
                </h3>
                <p className="text-xs text-stone-400">
                  حسب تقويم {CALCULATION_METHODS[calculationMethod].nameArabic}
                </p>
              </div>
              <button
                onClick={() => setShowMonthlyModal(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-800 text-stone-300 hover:text-white"
              >
                إغلاق
              </button>
            </div>

            <div className="overflow-x-auto p-4 flex-1">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-800 text-stone-400 font-semibold bg-stone-950/50">
                    <th className="py-2.5 px-3">اليوم</th>
                    <th className="py-2.5 px-3">الميلادي</th>
                    <th className="py-2.5 px-3">الفجر</th>
                    <th className="py-2.5 px-3">الشروق</th>
                    <th className="py-2.5 px-3">الظهر</th>
                    <th className="py-2.5 px-3">العصر</th>
                    <th className="py-2.5 px-3">المغرب</th>
                    <th className="py-2.5 px-3">العشاء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 font-mono tabular-nums text-stone-200">
                  {Array.from({ length: 30 }).map((_, i) => {
                    const rowDate = new Date();
                    rowDate.setDate(rowDate.getDate() + (i - 2));
                    const rowTimes = calculateDailyPrayerTimes(
                      rowDate,
                      location.latitude,
                      location.longitude,
                      calculationMethod
                    );
                    const rowHijri = getHijriDate(rowDate);
                    const isToday = rowDate.toDateString() === now.toDateString();

                    return (
                      <tr
                        key={i}
                        className={`hover:bg-stone-800/50 ${
                          isToday ? 'bg-emerald-950/50 text-emerald-300 font-bold' : ''
                        }`}
                      >
                        <td className="py-2 px-3 font-sans font-medium">
                          {rowHijri.dayNameArabic} {rowHijri.day}
                        </td>
                        <td className="py-2 px-3 text-stone-400">
                          {rowDate.getDate()}/{rowDate.getMonth() + 1}
                        </td>
                        <td className="py-2 px-3">{formatTime24h(rowTimes.fajr)}</td>
                        <td className="py-2 px-3 text-amber-400/90">{formatTime24h(rowTimes.sunrise)}</td>
                        <td className="py-2 px-3">{formatTime24h(rowTimes.dhuhr)}</td>
                        <td className="py-2 px-3">{formatTime24h(rowTimes.asr)}</td>
                        <td className="py-2 px-3 text-rose-300">{formatTime24h(rowTimes.maghrib)}</td>
                        <td className="py-2 px-3">{formatTime24h(rowTimes.isha)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
