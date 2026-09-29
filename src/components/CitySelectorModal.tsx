import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Navigation,
  Search,
  Check,
  SlidersHorizontal,
  Globe2,
  ChevronDown,
  ChevronLeft,
  Compass,
  Sparkles,
  Bell,
  Volume2,
  Clock,
  ShieldAlert,
  CheckCircle2,
  VolumeX,
  Building2,
  Map,
  Loader2,
  Globe,
} from 'lucide-react';
import { CalculationMethodId, JuristicMethod, UserLocation } from '../types/prayer';
import {
  CALCULATION_METHODS,
  PrayerTimeAdjustments,
  getSavedPrayerAdjustments,
  savePrayerAdjustments,
} from '../utils/prayerTimes';
import { COUNTRIES_AND_STATES, CountryData, StateOrProvince } from '../data/countriesAndStates';
import {
  backgroundAdhanService,
  PrayerRemindersPerPrayer,
  PrayerReminderRule,
  DEFAULT_PRAYER_REMINDERS,
} from '../services/backgroundAdhanService';
import { soundService } from '../utils/soundService';
import { matchArabicText, normalizeArabic } from '../utils/arabicSearch';

interface CitySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: UserLocation;
  onSelectLocation: (loc: UserLocation) => void;
  currentMethod: CalculationMethodId;
  onSelectMethod: (method: CalculationMethodId) => void;
  currentJuristic: JuristicMethod;
  onSelectJuristic: (juristic: JuristicMethod) => void;
}

interface PrayerInfoDef {
  key: keyof PrayerRemindersPerPrayer;
  nameArabic: string;
  description: string;
  isFard: boolean;
}

const PRAYERS_LIST: PrayerInfoDef[] = [
  { key: 'fajr', nameArabic: 'صلاة الفجر', description: 'من طلوع الفجر الصادق حتى طلوع الشمس', isFard: true },
  { key: 'sunrise', nameArabic: 'شروق الشمس', description: 'وقت طلوع قرص الشمس ونهاية وقت الفجر', isFard: false },
  { key: 'duha', nameArabic: 'صلاة الضحى (صلاة الأوابين)', description: 'يبدأ بعد الشروق بـ 20 دقيقة حتى قبيل الظهر بركعتين إلى ثمان ركعات', isFard: false },
  { key: 'dhuhr', nameArabic: 'صلاة الظهر', description: 'من زوال الشمس عن كبد السماء', isFard: true },
  { key: 'jumuah', nameArabic: 'صلاة الجمعة (الأذان والخطبة)', description: 'صلاة الجمعة الأسبوعية مع التبكير وسماع الخطبة وقراءة سورة الكهف', isFard: true },
  { key: 'asr', nameArabic: 'صلاة العصر', description: 'الصلاة الوسطى حتى اصفرار الشمس', isFard: true },
  { key: 'maghrib', nameArabic: 'صلاة المغرب', description: 'من مغيب كامل قرص الشمس', isFard: true },
  { key: 'isha', nameArabic: 'صلاة العشاء', description: 'من مغيب الشفق الأحمر إلى نصف الليل', isFard: true },
  { key: 'qiyam', nameArabic: 'قيام الليل (الثلث الأخير)', description: 'وقت التنزل الإلهي وإجابة الدعاء قبل الفجر', isFard: false },
];

const PRE_ALERT_OPTIONS = [
  { minutes: 0, label: 'بدون تذكير (عند الأذان فقط)' },
  { minutes: 5, label: '5 دقائق قبل الأذان' },
  { minutes: 10, label: '10 دقائق قبل الأذان' },
  { minutes: 15, label: '15 دقيقة قبل الأذان' },
  { minutes: 20, label: '20 دقيقة قبل الأذان' },
  { minutes: 30, label: '30 دقيقة قبل الأذان' },
];

// Quick Access Popular Countries with prominent placement of France, Saudi Arabia, Qatar, Sudan, Libya, Algeria, etc.
const POPULAR_COUNTRIES = ['fr', 'sa', 'qa', 'sd', 'ly', 'dz', 'eg', 'ma', 'tn', 'ae', 'kw', 'jo', 'ps', 'iq', 'tr', 'ye', 'om', 'sy', 'lb', 'uk', 'us', 'ca'];

interface OnlineCityResult {
  displayName: string;
  cityName: string;
  countryName: string;
  latitude: number;
  longitude: number;
}

export const CitySelectorModal: React.FC<CitySelectorModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onSelectLocation,
  currentMethod,
  onSelectMethod,
  currentJuristic,
  onSelectJuristic,
}) => {
  const [activeTab, setActiveTab] = useState<'countries' | 'notifications' | 'settings' | 'search' | 'custom_gps'>('countries');

  // Detect matching country from current user location instead of hardcoded 'dz'
  const [selectedCountryId, setSelectedCountryId] = useState<string>(() => {
    const match = COUNTRIES_AND_STATES.find(
      (c) =>
        c.countryNameArabic === currentLocation.countryName ||
        currentLocation.cityName.includes(c.countryNameArabic)
    );
    return match ? match.id : 'dz';
  });

  const [countryFilter, setCountryFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineResults, setOnlineResults] = useState<OnlineCityResult[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  // Custom manual GPS input state
  const [customLat, setCustomLat] = useState<string>(currentLocation.latitude.toString());
  const [customLon, setCustomLon] = useState<string>(currentLocation.longitude.toString());
  const [customCity, setCustomCity] = useState<string>(currentLocation.cityName);

  // Prayer Reminders state from backgroundAdhanService
  const [reminders, setReminders] = useState<PrayerRemindersPerPrayer>(() => {
    return backgroundAdhanService.getConfig().prayerReminders || DEFAULT_PRAYER_REMINDERS;
  });

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    return backgroundAdhanService.getNotificationPermission();
  });

  const [testAlertSuccess, setTestAlertSuccess] = useState<string | null>(null);
  const [selectionSuccess, setSelectionSuccess] = useState<string | null>(null);

  // Manual ± minutes adjustment state
  const [adjustments, setAdjustments] = useState<PrayerTimeAdjustments>(() => getSavedPrayerAdjustments());

  const handleAdjustPrayer = (prayerKey: keyof PrayerTimeAdjustments, deltaMinutes: number) => {
    const updated: PrayerTimeAdjustments = {
      ...adjustments,
      [prayerKey]: Math.max(-30, Math.min(30, adjustments[prayerKey] + deltaMinutes)),
    };
    setAdjustments(updated);
    savePrayerAdjustments(updated);
    soundService.playTasbeehClick();
  };

  const handleResetAdjustments = () => {
    const reset: PrayerTimeAdjustments = {
      fajr: 0,
      sunrise: 0,
      dhuhr: 0,
      asr: 0,
      maghrib: 0,
      isha: 0,
    };
    setAdjustments(reset);
    savePrayerAdjustments(reset);
    soundService.playTasbeehClick();
  };

  // Sync selected country if location changes
  useEffect(() => {
    const match = COUNTRIES_AND_STATES.find(
      (c) =>
        c.countryNameArabic === currentLocation.countryName ||
        currentLocation.cityName.includes(c.countryNameArabic)
    );
    if (match) {
      setSelectedCountryId(match.id);
    }
  }, [currentLocation]);

  // Debounced online geocoding lookup for any city worldwide
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setOnlineResults([]);
      setIsSearchingOnline(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingOnline(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            q
          )}&accept-language=ar&addressdetails=1&limit=8`
        );
        if (res.ok) {
          const data = await res.json();
          const parsed: OnlineCityResult[] = data.map((item: any) => {
            const city =
              item.address?.city ||
              item.address?.town ||
              item.address?.state ||
              item.address?.municipality ||
              item.address?.county ||
              item.name ||
              q;
            const country = item.address?.country || 'عالمي';
            return {
              displayName: item.display_name,
              cityName: city,
              countryName: country,
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lon),
            };
          });
          setOnlineResults(parsed);
        }
      } catch {
        // offline fallback
      } finally {
        setIsSearchingOnline(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isOpen) return null;

  const currentCountry = COUNTRIES_AND_STATES.find((c) => c.id === selectedCountryId) || COUNTRIES_AND_STATES[0];

  // Filter countries using Arabic normalization
  const filteredCountries = COUNTRIES_AND_STATES.filter((c) => {
    const q = countryFilter.trim();
    if (!q) return true;
    return (
      matchArabicText(c.countryNameArabic, q) ||
      c.countryNameEnglish.toLowerCase().includes(q.toLowerCase()) ||
      c.code.toLowerCase().includes(q.toLowerCase())
    );
  });

  // Filter states of the selected country using Arabic normalization
  const filteredStates = currentCountry.states.filter((st) => {
    const q = stateFilter.trim();
    if (!q) return true;
    return (
      matchArabicText(st.nameArabic, q) ||
      st.nameEnglish.toLowerCase().includes(q.toLowerCase())
    );
  });

  // Flat list of all states for universal search tab
  const allStatesWithCountry = COUNTRIES_AND_STATES.flatMap((country) =>
    country.states.map((state) => ({
      ...state,
      countryNameArabic: country.countryNameArabic,
      countryFlag: country.flag,
      countryId: country.id,
      stateLabelArabic: country.stateLabelArabic,
      defaultMethod: country.defaultMethod,
      timezone: country.timezone,
    }))
  );

  // Search results using normalized Arabic matching
  const searchResults = allStatesWithCountry.filter((item) => {
    const q = searchQuery.trim();
    if (!q) return false;
    return (
      matchArabicText(item.nameArabic, q) ||
      matchArabicText(item.countryNameArabic, q) ||
      item.nameEnglish.toLowerCase().includes(q.toLowerCase())
    );
  });

  const handleSelectState = (state: StateOrProvince, country: CountryData) => {
    onSelectLocation({
      latitude: state.latitude,
      longitude: state.longitude,
      cityName: `${country.stateLabelArabic} ${state.nameArabic}`,
      countryName: country.countryNameArabic,
      timezone: country.timezone,
      isAutoGPS: false,
    });
    if (country.defaultMethod) {
      onSelectMethod(country.defaultMethod);
    }

    setSelectionSuccess(`تم اختيار ${country.stateLabelArabic} ${state.nameArabic} في ${country.countryNameArabic}`);
    soundService.playTasbeehClick();

    setTimeout(() => {
      setSelectionSuccess(null);
      onClose();
    }, 600);
  };

  const handleSelectOnlineCity = (res: OnlineCityResult) => {
    // Find closest country to apply recommended calculation method
    let bestCountry = COUNTRIES_AND_STATES[0];
    let minDist = 999999;
    for (const country of COUNTRIES_AND_STATES) {
      for (const st of country.states) {
        const d = Math.hypot(st.latitude - res.latitude, st.longitude - res.longitude);
        if (d < minDist) {
          minDist = d;
          bestCountry = country;
        }
      }
    }

    onSelectLocation({
      latitude: res.latitude,
      longitude: res.longitude,
      cityName: res.cityName,
      countryName: res.countryName,
      timezone: bestCountry.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      isAutoGPS: false,
    });

    if (bestCountry.defaultMethod) {
      onSelectMethod(bestCountry.defaultMethod);
    }

    setSelectionSuccess(`تم اختيار ${res.cityName} (${res.countryName}) وحساب مواقيت الصلاة`);
    soundService.playTasbeehClick();

    setTimeout(() => {
      setSelectionSuccess(null);
      onClose();
    }, 600);
  };

  const handleUseCurrentGPS = () => {
    if (!navigator.geolocation) {
      setLocateError('المتصفح لا يدعم تحديد الموقع الجغرافي GPS.');
      return;
    }

    setIsLocating(true);
    setLocateError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        let closestState = COUNTRIES_AND_STATES[0].states[0];
        let closestCountry = COUNTRIES_AND_STATES[0];
        let minDist = 999999;

        for (const country of COUNTRIES_AND_STATES) {
          for (const state of country.states) {
            const d = Math.hypot(state.latitude - lat, state.longitude - lon);
            if (d < minDist) {
              minDist = d;
              closestState = state;
              closestCountry = country;
            }
          }
        }

        onSelectLocation({
          latitude: lat,
          longitude: lon,
          cityName: minDist < 0.8 ? `${closestCountry.stateLabelArabic} ${closestState.nameArabic}` : 'موقعي الحالي (GPS دقيق)',
          countryName: closestCountry.countryNameArabic,
          timezone: closestCountry.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          isAutoGPS: true,
        });

        if (closestCountry.defaultMethod) {
          onSelectMethod(closestCountry.defaultMethod);
        }

        setIsLocating(false);
        onClose();
      },
      (err) => {
        setIsLocating(false);
        setLocateError('تعذر تحديد الموقع تلقائياً. يمكنك اختيار دولتك وولايتك من القائمة أدناه.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleApplyCustomGPS = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);
    if (isNaN(lat) || isNaN(lon)) return;

    onSelectLocation({
      latitude: lat,
      longitude: lon,
      cityName: customCity.trim() || `إحداثيات (${lat.toFixed(2)}, ${lon.toFixed(2)})`,
      countryName: currentLocation.countryName || 'موقع مخصص',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      isAutoGPS: false,
    });
    onClose();
  };

  // Pre-Alert Reminders Handlers
  const handleUpdateReminder = (
    key: keyof PrayerRemindersPerPrayer,
    patch: Partial<PrayerReminderRule>
  ) => {
    const updated = {
      ...reminders,
      [key]: {
        ...reminders[key],
        ...patch,
      },
    };
    setReminders(updated);
    backgroundAdhanService.updatePrayerReminder(key, patch);
  };

  const handleApplyGlobalMinutes = (minutes: number) => {
    const nextReminders: PrayerRemindersPerPrayer = { ...reminders };
    (Object.keys(nextReminders) as Array<keyof PrayerRemindersPerPrayer>).forEach((k) => {
      nextReminders[k] = {
        ...nextReminders[k],
        enabled: true,
        preAlertMinutes: minutes,
      };
    });
    setReminders(nextReminders);
    backgroundAdhanService.updateConfig({ prayerReminders: nextReminders });
  };

  const handleRequestNotificationPermission = async () => {
    const res = await backgroundAdhanService.requestNotificationPermission();
    setNotificationPermission(res);
  };

  const handleTestAlert = async (prayerName: string, minutes: number) => {
    soundService.playTasbeehClick();
    await backgroundAdhanService.sendPrePrayerNotification(prayerName, currentLocation.cityName, minutes || 10);
    setTestAlertSuccess(`تم إرسال إشعار تجريبي لصلاة ${prayerName}!`);
    setTimeout(() => setTestAlertSuccess(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">إعدادات الموقع والمواقيت والتنبيهات</h2>
              <p className="text-xs text-stone-400">
                اختيار الدولة والولاية · التنبيهات المسبقة لكل صلاة · طرق الحساب الفلكي
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-5 pt-3 pb-2 border-b border-stone-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('countries')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors border cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'countries'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50 shadow-xs font-bold'
                : 'bg-stone-850 text-stone-400 border-transparent hover:text-white'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>الدول والولايات</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors border cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50 shadow-xs font-bold'
                : 'bg-stone-850 text-stone-300 border-stone-800 hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>تنبيهات وتذكير الصلاة</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors border cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40 shadow-xs'
                : 'bg-stone-850 text-stone-400 border-transparent hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>طرق الحساب والمذهب</span>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors border cursor-pointer ${
              activeTab === 'search'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40 shadow-xs'
                : 'bg-stone-850 text-stone-400 border-transparent hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>بحث مباشر في كل المدن</span>
          </button>

          <button
            onClick={() => setActiveTab('custom_gps')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors border cursor-pointer ${
              activeTab === 'custom_gps'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40 shadow-xs'
                : 'bg-stone-850 text-stone-400 border-transparent hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>إحداثيات GPS</span>
          </button>
        </div>

        {/* Toast feedback upon state selection */}
        {selectionSuccess && (
          <div className="mx-4 sm:mx-5 mt-3 p-3 rounded-2xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-between shadow-lg animate-in slide-in-from-top">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{selectionSuccess}</span>
            </div>
            <span className="text-[11px] opacity-90">جارٍ التطبيق...</span>
          </div>
        )}

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* TAB 1: COUNTRIES & STATES FULL DYNAMIC SELECTOR */}
          {activeTab === 'countries' && (
            <div className="space-y-4">
              {/* Popular countries quick-chips bar */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-stone-400 font-semibold">الدول الشائعة للاختيار السريع:</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {POPULAR_COUNTRIES.map((cId) => {
                    const cObj = COUNTRIES_AND_STATES.find((c) => c.id === cId);
                    if (!cObj) return null;
                    const isSelected = selectedCountryId === cObj.id;

                    return (
                      <button
                        key={cObj.id}
                        onClick={() => {
                          setSelectedCountryId(cObj.id);
                          setStateFilter('');
                        }}
                        className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white font-bold border-emerald-500 shadow-md shadow-emerald-700/30'
                            : 'bg-stone-950 text-stone-300 border-stone-800 hover:bg-stone-850 hover:text-white'
                        }`}
                      >
                        <span className="text-sm">{cObj.flag}</span>
                        <span>{cObj.countryNameArabic}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Two Column Layout on Desktop, Fluid on Mobile */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Column 1: Country Picker List (md:col-span-5) */}
                <div className="md:col-span-5 border border-stone-800 rounded-2xl bg-stone-950/70 p-3 space-y-2 flex flex-col max-h-[380px]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>اختر الدولة:</span>
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {filteredCountries.length} دولة
                    </span>
                  </div>

                  {/* Country Search Bar */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="ابحث عن اسم الدولة..."
                      value={countryFilter}
                      onChange={(e) => setCountryFilter(e.target.value)}
                      className="w-full pl-3 pr-8 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-white placeholder-stone-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Country buttons list */}
                  <div className="flex-1 overflow-y-auto space-y-1 pr-1 no-scrollbar">
                    {filteredCountries.map((country) => {
                      const isSelected = selectedCountryId === country.id;
                      return (
                        <button
                          key={country.id}
                          onClick={() => {
                            setSelectedCountryId(country.id);
                            setStateFilter('');
                          }}
                          className={`w-full p-2.5 rounded-xl text-right flex items-center justify-between text-xs transition-colors cursor-pointer border ${
                            isSelected
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/70 font-bold shadow-xs'
                              : 'bg-stone-900/60 hover:bg-stone-850 text-stone-300 border-stone-800/80'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{country.flag}</span>
                            <span>{country.countryNameArabic}</span>
                          </div>
                          <span className="text-[10px] bg-stone-950/80 px-2 py-0.5 rounded-md text-stone-400">
                            {country.states.length} {country.stateLabelArabic}
                          </span>
                        </button>
                      );
                    })}

                    {filteredCountries.length === 0 && (
                      <div className="p-4 text-center text-xs text-stone-400">
                        لم يتم العثور على دولة بهذا الاسم.
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 2: States / Provinces of Selected Country (md:col-span-7) */}
                <div className="md:col-span-7 border border-stone-800 rounded-2xl bg-stone-950/70 p-3 space-y-2 flex flex-col max-h-[380px]">
                  {/* Selected Country Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 border-b border-stone-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{currentCountry.flag}</span>
                      <div>
                        <h3 className="font-bold text-sm text-white">
                          {currentCountry.countryNameArabic}
                        </h3>
                        <span className="text-[10px] text-stone-400">
                          اختر الـ ({currentCountry.stateLabelArabic}) لحساب أوقات الصلاة والقبلة
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30 self-start sm:self-auto">
                      {CALCULATION_METHODS[currentCountry.defaultMethod].nameArabic}
                    </span>
                  </div>

                  {/* State Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-2.5" />
                    <input
                      type="text"
                      placeholder={`ابحث في ولايات ومحافظات ${currentCountry.countryNameArabic}...`}
                      value={stateFilter}
                      onChange={(e) => setStateFilter(e.target.value)}
                      className="w-full pl-3 pr-8 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-white placeholder-stone-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* States Grid */}
                  <div className="flex-1 overflow-y-auto pr-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {filteredStates.map((st) => {
                        const isSelectedCity =
                          currentLocation.cityName.includes(st.nameArabic) &&
                          (currentLocation.countryName === currentCountry.countryNameArabic ||
                            currentLocation.cityName.includes(currentCountry.countryNameArabic));

                        return (
                          <button
                            key={st.nameArabic}
                            onClick={() => handleSelectState(st, currentCountry)}
                            className={`p-2.5 rounded-xl text-right flex items-center justify-between text-xs transition-all cursor-pointer border ${
                              isSelectedCity
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-500 font-bold shadow-md shadow-emerald-950/50'
                                : 'bg-stone-900/80 hover:bg-stone-850 hover:border-emerald-500/40 text-stone-200 border-stone-800'
                            }`}
                          >
                            <div>
                              <div className="font-semibold flex items-center gap-1.5">
                                <span>{st.nameArabic}</span>
                                {st.isCapital && (
                                  <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-600/40 px-1 py-0.1 rounded-xs">
                                    العاصمة
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-stone-400 font-sans">
                                {st.nameEnglish}
                              </div>
                            </div>

                            {isSelectedCity ? (
                              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <span className="text-[10px] text-stone-400 opacity-60">اختيار</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {filteredStates.length === 0 && (
                      <div className="p-8 text-center text-xs text-stone-400">
                        لم يتم العثور على ولاية أو محافظة تطابق بحثك.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Automatic Geolocation Option */}
              <div className="pt-2 border-t border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <button
                  onClick={handleUseCurrentGPS}
                  disabled={isLocating}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-2 border border-stone-700 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <Navigation className={`w-3.5 h-3.5 text-blue-400 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'جارٍ تحديد موقعك عبر GPS...' : 'تحديد موقعي التلقائي عبر GPS'}</span>
                </button>

                {locateError && (
                  <span className="text-xs text-rose-400">{locateError}</span>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: NOTIFICATIONS & PRE-ADHAN REMINDERS */}
          {activeTab === 'notifications' && (
            <div className="space-y-5">
              {/* Introduction Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-stone-900 to-stone-900 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <Bell className="w-4 h-4" />
                    <span>إعدادات التذكير والتنبيه المسبق للأذان</span>
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed max-w-xl">
                    يمكنك اختيار وقت تذكير مسبق (مثلاً 5 أو 10 أو 15 دقيقة) قبل رفع الأذان لكل صلاة على حدة، لتنبيهك بالاستعداد للوضوء والتوجه للمسجد قبل دخول الوقت.
                  </p>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleApplyGlobalMinutes(5)}
                    className="px-2.5 py-1 text-xs rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-medium cursor-pointer"
                    title="تطبيق 5 دقائق قبل كل صلاة"
                  >
                    5 د للكل
                  </button>
                  <button
                    onClick={() => handleApplyGlobalMinutes(10)}
                    className="px-2.5 py-1 text-xs rounded-lg bg-emerald-900 hover:bg-emerald-800 text-emerald-200 border border-emerald-500/50 font-bold cursor-pointer"
                    title="تطبيق 10 دقائق قبل كل صلاة"
                  >
                    10 د للكل
                  </button>
                  <button
                    onClick={() => handleApplyGlobalMinutes(15)}
                    className="px-2.5 py-1 text-xs rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-medium cursor-pointer"
                    title="تطبيق 15 دقيقة قبل كل صلاة"
                  >
                    15 د للكل
                  </button>
                  <button
                    onClick={() => handleApplyGlobalMinutes(0)}
                    className="px-2.5 py-1 text-xs rounded-lg bg-stone-950 hover:bg-stone-800 text-stone-400 border border-stone-800 cursor-pointer"
                    title="إلغاء التذكير المسبق (عند الأذان فقط)"
                  >
                    عند الأذان فقط
                  </button>
                </div>
              </div>

              {/* Notification Permission Banner */}
              {notificationPermission !== 'granted' && (
                <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-amber-300">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>إذن إشعارات المتصفح غير مفعل. قم بتفعيله لتصلك التنبيهات في الخلفية وعند إغلاق الشاشة.</span>
                  </div>
                  <button
                    onClick={handleRequestNotificationPermission}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs"
                  >
                    تفعيل الإشعارات الآن
                  </button>
                </div>
              )}

              {testAlertSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{testAlertSuccess}</span>
                </div>
              )}

              {/* Audio Speaker & Lock-Screen Test Bar */}
              <div className="p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span>فحص صوت الأذان وشاشة القفل في جهازك</span>
                  </div>
                  <p className="text-[11px] text-stone-400">
                    تأكد من عدم تفعيل وضع الصامت في هاتفك ليعمل صوت الأذان تلقائياً
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      soundService.playTasbeehClick();
                      setTestAlertSuccess('تم إرسال نقرة صوتية تجريبية');
                      setTimeout(() => setTestAlertSuccess(null), 2500);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold cursor-pointer"
                  >
                    🔊 تجربة الصوت
                  </button>
                  <button
                    onClick={async () => {
                      await backgroundAdhanService.sendTestNotification(currentLocation.cityName);
                      setTestAlertSuccess('تم إرسال إشعار تجريبي لشاشة القفل!');
                      setTimeout(() => setTestAlertSuccess(null), 3000);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shadow-xs"
                  >
                    📲 إرسال إشعار للشاشة
                  </button>
                </div>
              </div>

              {/* Individual Prayer Alert Settings Cards */}
              <div className="space-y-3">
                {PRAYERS_LIST.map((prayer) => {
                  const rule = reminders[prayer.key] || { enabled: true, preAlertMinutes: 10, soundType: 'adhan' };

                  return (
                    <div
                      key={prayer.key}
                      className={`p-4 rounded-2xl border transition-all text-right space-y-3 ${
                        rule.enabled
                          ? 'bg-stone-950/70 border-emerald-500/30'
                          : 'bg-stone-950/30 border-stone-800 opacity-60'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {/* Toggle Switch */}
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              checked={rule.enabled}
                              onChange={(e) => handleUpdateReminder(prayer.key, { enabled: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-10 h-5 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                          </label>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-white">{prayer.nameArabic}</h4>
                              {prayer.isFard ? (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                                  فريضة
                                </span>
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-stone-800 text-stone-400">
                                  سنة / نافلة
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-stone-400 mt-0.5">{prayer.description}</p>
                          </div>
                        </div>

                        {/* Test Button */}
                        <button
                          onClick={() => handleTestAlert(prayer.nameArabic, rule.preAlertMinutes)}
                          className="px-2.5 py-1 text-[11px] rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                          title="إرسال إشعار تجريبي لهذا التنبيه"
                        >
                          <Volume2 className="w-3 h-3 text-emerald-400" />
                          <span>تجربة التنبيه</span>
                        </button>
                      </div>

                      {/* Config Row: Pre-Alert Minutes & Sound */}
                      {rule.enabled && (
                        <div className="pt-2 border-t border-stone-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                          {/* Pre-alert time selector */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-stone-400 text-[11px] ml-1">موعد التذكير المسبق:</span>
                            {PRE_ALERT_OPTIONS.map((opt) => (
                              <button
                                key={opt.minutes}
                                onClick={() => handleUpdateReminder(prayer.key, { preAlertMinutes: opt.minutes })}
                                className={`px-2.5 py-1 text-[11px] rounded-lg transition-colors cursor-pointer border ${
                                  rule.preAlertMinutes === opt.minutes
                                    ? 'bg-emerald-600 text-white font-bold border-emerald-500 shadow-xs'
                                    : 'bg-stone-900 text-stone-300 border-stone-800 hover:bg-stone-800 hover:text-white'
                                }`}
                              >
                                {opt.minutes === 0 ? 'عند الأذان' : `${opt.minutes} دقيقة`}
                              </button>
                            ))}
                          </div>

                          {/* Sound selector */}
                          <div className="flex items-center gap-1 bg-stone-900 px-2 py-1 rounded-xl border border-stone-800">
                            <span className="text-[10px] text-stone-400 ml-1">نوع الصوت:</span>
                            {(['adhan', 'takbeer', 'beep', 'silent'] as const).map((snd) => (
                              <button
                                key={snd}
                                onClick={() => handleUpdateReminder(prayer.key, { soundType: snd })}
                                className={`px-2 py-0.5 text-[10px] rounded-md transition-colors cursor-pointer ${
                                  rule.soundType === snd
                                    ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-500/40'
                                    : 'text-stone-400 hover:text-white'
                                }`}
                              >
                                {snd === 'adhan' ? 'أذان' : snd === 'takbeer' ? 'تكبير' : snd === 'beep' ? 'نغمة' : 'صامت'}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Universal Search Across All States & Global Cities */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-3" />
                <input
                  type="text"
                  placeholder="ابحث عن اسم أي مدينة، ولاية، محافظة أو قرية (مثال: وهران، مكة، القاهرة، الإسكندرية، طنجة، دبي)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-xs text-white placeholder-stone-400 focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 top-2.5 p-1 rounded-md text-stone-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                {/* 1. Database matches */}
                {searchResults.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-emerald-400 px-1 flex items-center justify-between">
                      <span>المدن والولايات المعتمدة المسجلة ({searchResults.length})</span>
                      <span className="text-stone-400 font-normal text-[10px]">بحث فوري متطابق</span>
                    </div>

                    {searchResults.map((item) => {
                      const countryObj =
                        COUNTRIES_AND_STATES.find((c) => c.id === item.countryId) || COUNTRIES_AND_STATES[0];
                      return (
                        <button
                          key={`${item.countryId}-${item.nameArabic}`}
                          onClick={() => handleSelectState(item, countryObj)}
                          className="w-full p-2.5 rounded-xl text-right flex items-center justify-between text-xs bg-stone-950/70 hover:bg-stone-800/90 border border-stone-800 hover:border-emerald-500/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{item.countryFlag}</span>
                            <span className="font-semibold text-white">{item.nameArabic}</span>
                            <span className="text-stone-400 font-sans text-[11px]">({item.nameEnglish})</span>
                          </div>
                          <span className="text-[10px] text-stone-400 bg-stone-900 px-2 py-0.5 rounded-md">
                            {item.countryNameArabic}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 2. Global Online Results */}
                {onlineResults.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-stone-800/80">
                    <div className="text-[11px] font-bold text-blue-400 px-1 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      <span>نتائج البحث الجغرافي المباشر لجميع مدن وقرى العالم ({onlineResults.length})</span>
                    </div>

                    {onlineResults.map((item, idx) => (
                      <button
                        key={`${item.displayName}-${idx}`}
                        onClick={() => handleSelectOnlineCity(item)}
                        className="w-full p-2.5 rounded-xl text-right flex items-center justify-between text-xs bg-stone-950/60 hover:bg-blue-950/40 border border-stone-800 hover:border-blue-500/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate max-w-[80%]">
                          <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <div className="truncate">
                            <span className="font-semibold text-white">{item.cityName}</span>
                            <span className="text-[10px] text-stone-400 block truncate">{item.displayName}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-blue-300 font-semibold shrink-0 bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-500/30">
                          {item.countryName}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {isSearchingOnline && (
                  <div className="p-3 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>جارٍ البحث المباشر في خرائط المدن العالمية...</span>
                  </div>
                )}

                {searchQuery &&
                  searchResults.length === 0 &&
                  onlineResults.length === 0 &&
                  !isSearchingOnline && (
                    <div className="p-8 text-center text-stone-400 text-xs bg-stone-950/40 rounded-2xl border border-stone-800 space-y-2">
                      <p>لم يتم العثور على مدينة تطابق بحثك حالياً.</p>
                      <p className="text-[11px] text-stone-500">
                        تأكد من كتابة اسم المدينة بدون أخطاء إملائية، أو استخدم تبويب "الدول والولايات" لاختيار مدينتك من القائمة المباشرة.
                      </p>
                    </div>
                  )}

                {!searchQuery && (
                  <div className="p-6 text-center text-stone-400 text-xs space-y-2">
                    <p>اكتب اسم أي مدينة، ولاية، محافظة، بلدة أو قرية في أي دولة عربية أو إسلامية أو أجنبية.</p>
                    <p className="text-[11px] text-stone-500">
                      النظام يدعم البحث الذكي بدون مراعاة الهمزات أو أل التعريف (مثلاً: وهران، قاهرة، اسكندرية، رياض، مكة).
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Custom Manual GPS */}
          {activeTab === 'custom_gps' && (
            <form onSubmit={handleApplyCustomGPS} className="space-y-4 max-w-lg mx-auto py-2">
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-stone-300 leading-relaxed">
                يمكنك إدخال إحداثيات خط العرض والطول الدقيقة لأي بلدة أو مزرعة أو مخيم للحصول على أوقات الصلاة الدقيقة واتجاه القبلة.
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  اسم الموقع أو الولاية (اختياري)
                </label>
                <input
                  type="text"
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  placeholder="مثال: ولاية وهران، أو مزرعة النخيل"
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                    خط العرض (Latitude)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={customLat}
                    onChange={(e) => setCustomLat(e.target.value)}
                    placeholder="مثال: 36.7538"
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-white text-xs font-mono tabular-nums focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                    خط الطول (Longitude)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={customLon}
                    onChange={(e) => setCustomLon(e.target.value)}
                    placeholder="مثال: 3.0588"
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-white text-xs font-mono tabular-nums focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-700/30 transition-transform active:scale-95 cursor-pointer"
              >
                تطبيق هذه الإحداثيات وحساب المواقيت
              </button>
            </form>
          )}

          {/* TAB 5: Methods & Juristic Settings */}
          {activeTab === 'settings' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-2">
                  طريقة الحساب الفلكي لمواقيت الصلاة
                </label>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {Object.values(CALCULATION_METHODS).map((method) => {
                    const isSelected = currentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        onClick={() => onSelectMethod(method.id)}
                        className={`w-full p-2.5 rounded-xl text-right flex items-center justify-between text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-500/40 font-medium'
                            : 'hover:bg-stone-800/80 text-stone-300 border border-stone-800'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-sm">{method.nameArabic}</div>
                          <div className="text-[11px] text-stone-400">
                            فجر: {method.fajrAngle}° · عشاء:{' '}
                            {method.ishaIntervalMinutes
                              ? `${method.ishaIntervalMinutes} دقيقة`
                              : `${method.ishaAngle}°`}
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-2">
                  طريقة حساب وقت صلاة العصر (المذهب الفقهي)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onSelectJuristic('standard')}
                    className={`p-3 rounded-xl text-right text-xs transition-colors border cursor-pointer ${
                      currentJuristic === 'standard'
                        ? 'bg-emerald-900/40 text-emerald-300 border-emerald-500/40 font-medium'
                        : 'bg-stone-800/50 hover:bg-stone-800 text-stone-300 border-stone-700'
                    }`}
                  >
                    <div className="font-semibold text-sm mb-1">الجمهور (المالكي، الشافعي، الحنبلي)</div>
                    <div className="text-[11px] text-stone-400">ظل الشيء مثله (المعتمد في شمال إفريقيا والخليج)</div>
                  </button>

                  <button
                    onClick={() => onSelectJuristic('hanafi')}
                    className={`p-3 rounded-xl text-right text-xs transition-colors border cursor-pointer ${
                      currentJuristic === 'hanafi'
                        ? 'bg-emerald-900/40 text-emerald-300 border-emerald-500/40 font-medium'
                        : 'bg-stone-800/50 hover:bg-stone-800 text-stone-300 border-stone-700'
                    }`}
                  >
                    <div className="font-semibold text-sm mb-1">المذهب الحنفي</div>
                    <div className="text-[11px] text-stone-400">ظل الشيء مثليه</div>
                  </button>
                </div>
              </div>

              {/* Manual ± Minutes Adjustment per Prayer */}
              <div className="pt-3 border-t border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                      <span>تعديل يدوي لمواقيت الصلاة (دقائق ± للمطابقة مع مسجدي المحلي)</span>
                    </label>
                    <p className="text-[11px] text-stone-400">
                      يمكنك تقديم أو تأخير موعد أي صلاة ببضع دقائق لمطابقة التوقيت المعتمد في مسجدك
                    </p>
                  </div>
                  <button
                    onClick={handleResetAdjustments}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 cursor-pointer"
                  >
                    إعادة ضبط (0)
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { key: 'fajr' as const, label: 'الفجر' },
                    { key: 'sunrise' as const, label: 'الشروق' },
                    { key: 'dhuhr' as const, label: 'الظهر' },
                    { key: 'asr' as const, label: 'العصر' },
                    { key: 'maghrib' as const, label: 'المغرب' },
                    { key: 'isha' as const, label: 'العشاء' },
                  ].map((p) => {
                    const val = adjustments[p.key];
                    return (
                      <div
                        key={p.key}
                        className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-stone-200">{p.label}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleAdjustPrayer(p.key, -1)}
                            className="w-6 h-6 rounded-lg bg-stone-800 hover:bg-stone-700 text-white flex items-center justify-center font-bold text-xs cursor-pointer active:scale-95"
                            title="تأخير دقيقة (-1)"
                          >
                            -
                          </button>
                          <span
                            className={`w-9 text-center font-mono font-bold ${
                              val > 0 ? 'text-emerald-400' : val < 0 ? 'text-amber-400' : 'text-stone-400'
                            }`}
                          >
                            {val > 0 ? `+${val}` : val} د
                          </span>
                          <button
                            onClick={() => handleAdjustPrayer(p.key, 1)}
                            className="w-6 h-6 rounded-lg bg-stone-800 hover:bg-stone-700 text-white flex items-center justify-center font-bold text-xs cursor-pointer active:scale-95"
                            title="تقديم دقيقة (+1)"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-800 bg-stone-950 flex items-center justify-between">
          <div className="text-xs text-stone-400">
            المدينة الحالية: <span className="text-emerald-400 font-bold">{currentLocation.cityName}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors cursor-pointer"
          >
            تأكيد وإغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
