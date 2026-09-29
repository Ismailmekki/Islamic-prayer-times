import { CalculationMethod, CalculationMethodId, JuristicMethod, PrayerName, PrayerTimeItem, HijriDateInfo } from '../types/prayer';

export const CALCULATION_METHODS: Record<CalculationMethodId, CalculationMethod> = {
  MAKKAH: {
    id: 'MAKKAH',
    nameArabic: 'أم القرى (مكة المكرمة والمملكة العربية السعودية)',
    nameEnglish: 'Umm al-Qura University, Makkah',
    fajrAngle: 18.5,
    ishaIntervalMinutes: 90, // 90 min after Maghrib (120 in Ramadan)
  },
  QATAR: {
    id: 'QATAR',
    nameArabic: 'وزارة الأوقاف والشؤون الإسلامية القطرية',
    nameEnglish: 'Ministry of Awqaf, Qatar',
    fajrAngle: 18,
    ishaIntervalMinutes: 90, // 90 min after Maghrib (120 in Ramadan)
  },
  FRANCE_UOIF: {
    id: 'FRANCE_UOIF',
    nameArabic: 'اتحاد مسلمي فرنسا (UOIF - زاوية 12° المعتمدة)',
    nameEnglish: 'Musulmans de France / UOIF (12°)',
    fajrAngle: 12,
    ishaAngle: 12,
  },
  FRANCE_15: {
    id: 'FRANCE_15',
    nameArabic: 'مساجد فرنسا الكبرى (زاوية 15°)',
    nameEnglish: 'French Mosques & Islamic Centres (15°)',
    fajrAngle: 15,
    ishaAngle: 15,
  },
  FRANCE_18: {
    id: 'FRANCE_18',
    nameArabic: 'مسجد باريس الكبير (زاوية 18°)',
    nameEnglish: 'Grande Mosquée de Paris (18°)',
    fajrAngle: 18,
    ishaAngle: 18,
  },
  SUDAN: {
    id: 'SUDAN',
    nameArabic: 'مجمع الفقه الإسلامي بالسودان',
    nameEnglish: 'Islamic Fiqh Academy of Sudan',
    fajrAngle: 18,
    ishaAngle: 17.5,
  },
  LIBYA: {
    id: 'LIBYA',
    nameArabic: 'الهيئة العامة للأوقاف والشؤون الإسلامية بليبيا',
    nameEnglish: 'General Authority of Awqaf, Libya',
    fajrAngle: 18,
    ishaAngle: 17.5,
  },
  MWL: {
    id: 'MWL',
    nameArabic: 'رابطة العالم الإسلامي',
    nameEnglish: 'Muslim World League',
    fajrAngle: 18,
    ishaAngle: 17,
  },
  EGYPT: {
    id: 'EGYPT',
    nameArabic: 'الهيئة المصرية العامة للمساحة',
    nameEnglish: 'Egyptian General Authority of Survey',
    fajrAngle: 19.5,
    ishaAngle: 17.5,
  },
  ALGERIA: {
    id: 'ALGERIA',
    nameArabic: 'وزارة الشؤون الدينية والأوقاف بالجزائر',
    nameEnglish: 'Ministry of Religious Affairs, Algeria',
    fajrAngle: 18,
    ishaAngle: 17,
  },
  TUNISIA: {
    id: 'TUNISIA',
    nameArabic: 'وزارة الشؤون الدينية بتونس',
    nameEnglish: 'Ministry of Religious Affairs, Tunisia',
    fajrAngle: 18,
    ishaAngle: 18,
  },
  MOROCCO: {
    id: 'MOROCCO',
    nameArabic: 'وزارة الأوقاف والشؤون الإسلامية بالمغرب',
    nameEnglish: 'Ministry of Habous & Islamic Affairs, Morocco',
    fajrAngle: 19,
    ishaAngle: 17,
  },
  ISNA: {
    id: 'ISNA',
    nameArabic: 'الجمعية الإسلامية لأمريكا الشمالية (ISNA)',
    nameEnglish: 'Islamic Society of North America',
    fajrAngle: 15,
    ishaAngle: 15,
  },
  KARACHI: {
    id: 'KARACHI',
    nameArabic: 'جامعة العلوم الإسلامية بكراتشي',
    nameEnglish: 'University of Islamic Sciences, Karachi',
    fajrAngle: 18,
    ishaAngle: 18,
  },
  DUBAI: {
    id: 'DUBAI',
    nameArabic: 'دائرة الشؤون الإسلامية بدبي',
    nameEnglish: 'Dubai Islamic Affairs',
    fajrAngle: 18.2,
    ishaAngle: 18.2,
  },
  KUWAIT: {
    id: 'KUWAIT',
    nameArabic: 'وزارة الأوقاف والشؤون الإسلامية بالكويت',
    nameEnglish: 'Ministry of Awqaf, Kuwait',
    fajrAngle: 18,
    ishaAngle: 17.5,
  },
};

// Math helpers
const radToDeg = (rad: number) => (rad * 180.0) / Math.PI;
const degToRad = (deg: number) => (deg * Math.PI) / 180.0;

function fixAngle(angle: number): number {
  return angle - 360.0 * Math.floor(angle / 360.0);
}

function fixHour(hour: number): number {
  return hour - 24.0 * Math.floor(hour / 24.0);
}

// Astronomical Solar Coordinates
function calculateSunPosition(julianDate: number) {
  const D = julianDate - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * D);
  const q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(q + 1.915 * Math.sin(degToRad(g)) + 0.02 * Math.sin(degToRad(2 * g)));
  const e = 23.439 - 0.00000036 * D;
  const d = radToDeg(Math.asin(Math.sin(degToRad(e)) * Math.sin(degToRad(L))));
  let RA = radToDeg(Math.atan2(Math.cos(degToRad(e)) * Math.sin(degToRad(L)), Math.cos(degToRad(L)))) / 15.0;
  RA = fixHour(RA);
  const EqT = q / 15.0 - RA;
  return { declination: d, equationOfTime: EqT };
}

function getJulianDate(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

export interface CalculatedTimes {
  fajr: Date;
  sunrise: Date;
  duha: Date;
  dhuhr: Date;
  jumuah: Date;
  jumuahFirstAdhan: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  qiyam: Date;
}

export interface PrayerTimeAdjustments {
  fajr: number;
  sunrise: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

export function getSavedPrayerAdjustments(): PrayerTimeAdjustments {
  try {
    const val = localStorage.getItem('salati_prayer_adjustments');
    if (val) {
      return JSON.parse(val);
    }
  } catch {}
  return { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
}

export function savePrayerAdjustments(adj: PrayerTimeAdjustments): void {
  try {
    localStorage.setItem('salati_prayer_adjustments', JSON.stringify(adj));
  } catch {}
}

export function getTimezoneOffsetHours(timeZoneName?: string, date: Date = new Date()): number {
  if (!timeZoneName) {
    return -date.getTimezoneOffset() / 60;
  }
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZoneName,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const getPart = (type: string) => parseInt(parts.find((p) => p.type === type)?.value || '0', 10);
    const year = getPart('year');
    const month = getPart('month');
    const day = getPart('day');
    let hour = getPart('hour');
    if (hour === 24) hour = 0;
    const minute = getPart('minute');
    const second = getPart('second');

    const asUTC = Date.UTC(year, month - 1, day, hour, minute, second);
    const diffMs = asUTC - date.getTime();
    return diffMs / (1000 * 60 * 60);
  } catch (e) {
    return -date.getTimezoneOffset() / 60;
  }
}

export function getSavedFridayOffsetMinutes(): number {
  try {
    const val = localStorage.getItem('salati_friday_offset');
    if (val !== null) {
      const num = parseInt(val, 10);
      if (!isNaN(num)) return num;
    }
  } catch {}
  return 0;
}

export function saveFridayOffsetMinutes(minutes: number): void {
  try {
    localStorage.setItem('salati_friday_offset', minutes.toString());
  } catch {}
}

export function calculateDailyPrayerTimes(
  date: Date,
  latitude: number,
  longitude: number,
  methodId: CalculationMethodId = 'MAKKAH',
  juristic: JuristicMethod = 'standard',
  fridayOffsetMinutes?: number,
  targetTimezone?: string
): CalculatedTimes {
  const method = CALCULATION_METHODS[methodId] || CALCULATION_METHODS.MAKKAH;
  const julian = getJulianDate(date);
  const sun = calculateSunPosition(julian);

  // Accurate timezone offset for the target city / country
  const timezoneOffset = getTimezoneOffsetHours(targetTimezone, date);

  // Dhuhr (solar transit noon) in local decimal hours
  const dhuhrHour = fixHour(12 + timezoneOffset - longitude / 15.0 - sun.equationOfTime);

  const latRad = degToRad(latitude);
  const decRad = degToRad(sun.declination);

  // Helper for angle zenith with high latitude safety
  function timeForSunAngle(angle: number, isMorning: boolean): { hour: number; isExtreme: boolean } {
    const cosHourAngle =
      (Math.sin(degToRad(-angle)) - Math.sin(latRad) * Math.sin(decRad)) /
      (Math.cos(latRad) * Math.cos(decRad));

    if (cosHourAngle > 1 || cosHourAngle < -1 || isNaN(cosHourAngle)) {
      return { hour: isMorning ? 0 : 24, isExtreme: true };
    }

    const hourAngle = radToDeg(Math.acos(cosHourAngle)) / 15.0;
    return {
      hour: isMorning ? dhuhrHour - hourAngle : dhuhrHour + hourAngle,
      isExtreme: false,
    };
  }

  // Sunrise and Sunset (approx 0.833 degrees for atmospheric refraction + sun diameter)
  const sunriseRes = timeForSunAngle(0.833, true);
  const sunsetRes = timeForSunAngle(0.833, false);

  // Fallback for extreme polar conditions (if sun never rises or sets)
  const sunriseHour = sunriseRes.isExtreme ? 6.0 : sunriseRes.hour;
  const sunsetHour = sunsetRes.isExtreme ? 18.0 : sunsetRes.hour;

  // Day & Night duration (needed for European / High-Latitude rules like France & northern cities)
  let nightDuration = fixHour(sunriseHour - sunsetHour);
  if (nightDuration <= 0) nightDuration += 24;

  // 1. Fajr calculation with High-Latitude fallback for France and Northern Europe
  let fajrHour: number;
  const fajrRes = timeForSunAngle(method.fajrAngle, true);

  if (fajrRes.isExtreme || Math.abs(latitude) >= 48) {
    // High-Latitude condition (e.g. Paris, Lille, Strasbourg, London during summer)
    // Use Angle-based portion or 1/7th of night rule
    const fajrPortion = (method.fajrAngle / 60) * nightDuration;
    const maxFajrBeforeSunrise = Math.min(fajrPortion, nightDuration / 2);
    fajrHour = fixHour(sunriseHour - maxFajrBeforeSunrise);
  } else {
    fajrHour = fajrRes.hour;
    // Check if Fajr is excessively early (more than half the night before sunrise)
    let fajrInterval = fixHour(sunriseHour - fajrHour);
    if (fajrInterval <= 0) fajrInterval += 24;
    if (fajrInterval > nightDuration / 2) {
      fajrHour = fixHour(sunriseHour - (method.fajrAngle / 60) * nightDuration);
    }
  }

  // 2. Asr calculation
  const shadowMultiplier = juristic === 'hanafi' ? 2 : 1;
  const angleAsr = radToDeg(
    Math.atan(1.0 / (shadowMultiplier + Math.tan(Math.abs(latRad - decRad))))
  );
  const asrRes = timeForSunAngle(90 - angleAsr, false);
  const asrHour = asrRes.isExtreme ? dhuhrHour + 3.0 : asrRes.hour;

  // 3. Maghrib (sunset + 2 min precaution)
  const maghribHour = sunsetHour + 2 / 60;

  // 4. Isha calculation
  let ishaHour: number;
  // Check if Ramadan is active for Umm Al-Qura and Qatar (120 min instead of 90 min)
  const hijriInfo = getHijriDate(date);
  const isRamadan = hijriInfo.monthIndex === 8; // Month 9 (Ramadan, index 8)

  if (method.ishaIntervalMinutes) {
    const ishaMinutes = (method.id === 'MAKKAH' || method.id === 'QATAR') && isRamadan ? 120 : method.ishaIntervalMinutes;
    ishaHour = maghribHour + ishaMinutes / 60;
  } else if (method.ishaAngle) {
    const ishaRes = timeForSunAngle(method.ishaAngle, false);
    if (ishaRes.isExtreme || Math.abs(latitude) >= 48) {
      const ishaPortion = (method.ishaAngle / 60) * nightDuration;
      const maxIshaAfterSunset = Math.min(ishaPortion, nightDuration / 2);
      ishaHour = fixHour(sunsetHour + maxIshaAfterSunset);
    } else {
      ishaHour = ishaRes.hour;
      let ishaInterval = fixHour(ishaHour - sunsetHour);
      if (ishaInterval <= 0) ishaInterval += 24;
      if (ishaInterval > nightDuration / 2) {
        ishaHour = fixHour(sunsetHour + (method.ishaAngle / 60) * nightDuration);
      }
    }
  } else {
    ishaHour = maghribHour + 1.5;
  }

  // Load user manual adjustments (± minutes)
  const adjustments = getSavedPrayerAdjustments();

  // Convert decimal hours into real Date objects
  const makeDate = (hourVal: number, manualOffsetMin = 0, dayOffset = 0): Date => {
    const adjustedHourVal = hourVal + manualOffsetMin / 60;
    const result = new Date(date);
    result.setDate(result.getDate() + dayOffset);
    let h = Math.floor(adjustedHourVal);
    let remMinutes = (adjustedHourVal - h) * 60;
    let m = Math.floor(remMinutes);
    let s = Math.floor((remMinutes - m) * 60);

    if (h >= 24) {
      h -= 24;
      result.setDate(result.getDate() + 1);
    } else if (h < 0) {
      h += 24;
      result.setDate(result.getDate() - 1);
    }

    result.setHours(h, m, s, 0);
    return result;
  };

  const fajrDate = makeDate(fajrHour, adjustments.fajr);
  const sunriseDate = makeDate(sunriseHour, adjustments.sunrise);
  // Salat al-Duha starts ~20 minutes after sunrise (after the sun rises a spear height / خروج وقت الكراهة)
  const duhaDate = new Date(sunriseDate.getTime() + 20 * 60 * 1000);
  const dhuhrDate = makeDate(dhuhrHour, adjustments.dhuhr);
  const offsetMin = fridayOffsetMinutes !== undefined ? fridayOffsetMinutes : getSavedFridayOffsetMinutes();
  const jumuahDate = new Date(dhuhrDate.getTime() + offsetMin * 60 * 1000);
  const jumuahFirstAdhan = new Date(jumuahDate.getTime() - 25 * 60 * 1000);
  const asrDate = makeDate(asrHour, adjustments.asr);
  const maghribDate = makeDate(maghribHour, adjustments.maghrib);
  const ishaDate = makeDate(ishaHour, adjustments.isha);

  // Qiyam (Last third of the night between Maghrib and Next Fajr)
  const nightDurationMs = fajrDate.getTime() + 24 * 3600 * 1000 - maghribDate.getTime();
  const qiyamDate = new Date(maghribDate.getTime() + (nightDurationMs * 2) / 3);

  return {
    fajr: fajrDate,
    sunrise: sunriseDate,
    duha: duhaDate,
    dhuhr: dhuhrDate,
    jumuah: jumuahDate,
    jumuahFirstAdhan,
    asr: asrDate,
    maghrib: maghribDate,
    isha: ishaDate,
    qiyam: qiyamDate,
  };
}

export function formatTimeArabic(date: Date, includeSeconds = false): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const isPm = hours >= 12;
  const period = isPm ? 'م' : 'ص';
  hours = hours % 12 || 12;

  const mm = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const ss = seconds < 10 ? `0${seconds}` : `${seconds}`;

  if (includeSeconds) {
    return `${hours}:${mm}:${ss} ${period}`;
  }
  return `${hours}:${mm} ${period}`;
}

export function formatTime24h(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function getPrayerList(times: CalculatedTimes, now: Date): PrayerTimeItem[] {
  const nowMs = now.getTime();
  const isFriday = now.getDay() === 5;

  const rawList: Array<{
    id: PrayerName;
    nameArabic: string;
    nameEnglish: string;
    date: Date;
    isPrayer: boolean;
  }> = [
    { id: 'fajr', nameArabic: 'الفجر', nameEnglish: 'Fajr', date: times.fajr, isPrayer: true },
    { id: 'sunrise', nameArabic: 'الشروق', nameEnglish: 'Sunrise', date: times.sunrise, isPrayer: false },
    { id: 'duha', nameArabic: 'الضحى', nameEnglish: 'Duha', date: times.duha, isPrayer: true },
    isFriday
      ? { id: 'jumuah', nameArabic: 'صلاة الجمعة', nameEnglish: "Jumu'ah", date: times.jumuah, isPrayer: true }
      : { id: 'dhuhr', nameArabic: 'الظهر', nameEnglish: 'Dhuhr', date: times.dhuhr, isPrayer: true },
    { id: 'asr', nameArabic: 'العصر', nameEnglish: 'Asr', date: times.asr, isPrayer: true },
    { id: 'maghrib', nameArabic: 'المغرب', nameEnglish: 'Maghrib', date: times.maghrib, isPrayer: true },
    { id: 'isha', nameArabic: 'العشاء', nameEnglish: 'Isha', date: times.isha, isPrayer: true },
  ];

  // Identify next prayer
  let nextFoundIndex = -1;
  for (let i = 0; i < rawList.length; i++) {
    if (rawList[i].date.getTime() > nowMs) {
      nextFoundIndex = i;
      break;
    }
  }

  // If all prayers today have passed, next is Fajr tomorrow
  const isAllPassed = nextFoundIndex === -1;

  return rawList.map((item, index) => {
    const isPassed = isAllPassed ? true : index < nextFoundIndex;
    const isNext = isAllPassed ? index === 0 : index === nextFoundIndex;
    
    // Determine current active prayer period
    let isCurrent = false;
    if (isAllPassed && index === rawList.length - 1) {
      isCurrent = true; // After Isha until next Fajr
    } else if (!isAllPassed && nextFoundIndex > 0 && index === nextFoundIndex - 1) {
      isCurrent = true;
    }

    return {
      id: item.id,
      nameArabic: item.nameArabic,
      nameEnglish: item.nameEnglish,
      time: formatTimeArabic(item.date),
      timestamp: item.date.getTime(),
      isNext,
      isPassed,
      isCurrent,
      isPrayer: item.isPrayer,
    };
  });
}

export function getCountdownToNextPrayer(
  prayerList: PrayerTimeItem[],
  times: CalculatedTimes,
  now: Date
): {
  targetPrayer: PrayerTimeItem;
  hours: number;
  minutes: number;
  seconds: number;
  totalSecondsRemaining: number;
  percentageElapsed: number;
} {
  const nextItem = prayerList.find((p) => p.isNext) || prayerList[0];
  let targetTime = nextItem.timestamp;

  // If next is Fajr and all passed today, target is tomorrow's Fajr
  if (now.getTime() > targetTime) {
    targetTime += 24 * 3600 * 1000;
  }

  const diffMs = Math.max(0, targetTime - now.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Calculate percentage between previous prayer and next prayer
  const currentItem = prayerList.find((p) => p.isCurrent) || prayerList[prayerList.length - 1];
  let startTime = currentItem.timestamp;
  if (startTime > targetTime) {
    startTime -= 24 * 3600 * 1000;
  }
  const totalDuration = targetTime - startTime;
  const elapsed = now.getTime() - startTime;
  const percentage = Math.min(100, Math.max(0, Math.round((elapsed / (totalDuration || 1)) * 100)));

  return {
    targetPrayer: nextItem,
    hours,
    minutes,
    seconds,
    totalSecondsRemaining: totalSeconds,
    percentageElapsed: percentage,
  };
}

// Arabic Day Names
const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

// Arabic Hijri Month Names
const HIJRI_MONTHS = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الآخر',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة',
];

export function getHijriDate(date: Date, adjustmentDays = 0): HijriDateInfo {
  const adjustedDate = new Date(date);
  adjustedDate.setDate(adjustedDate.getDate() + adjustmentDays);

  const day = adjustedDate.getDate();
  const month = adjustedDate.getMonth();
  const year = adjustedDate.getFullYear();

  let jd = getJulianDate(adjustedDate);

  // Kuwati / Umm Al Qura algorithmic conversion
  let l = jd - 1948440 + 10632;
  let n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  let j =
    Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
    Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l =
    l -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  let m = Math.floor((24 * l) / 709);
  let d = l - Math.floor((709 * m) / 24);
  let y = 30 * n + j - 30;

  // Month index 0-11
  const monthIndex = Math.max(0, Math.min(11, m - 1));

  // Gregorian format (e.g. 24 سبتمبر 2026)
  const gregorianMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  const gregorianDateFormatted = `${day} ${gregorianMonths[month]} ${year}`;

  return {
    day: d,
    monthIndex,
    monthNameArabic: HIJRI_MONTHS[monthIndex],
    year: y,
    gregorianDateFormatted,
    dayNameArabic: ARABIC_DAYS[adjustedDate.getDay()],
  };
}

export const POPULAR_CITIES: Array<{
  cityName: string;
  countryName: string;
  latitude: number;
  longitude: number;
  timezone: string;
}> = [
  { cityName: 'مكة المكرمة', countryName: 'المملكة العربية السعودية', latitude: 21.4225, longitude: 39.8262, timezone: 'Asia/Riyadh' },
  { cityName: 'المدينة المنورة', countryName: 'المملكة العربية السعودية', latitude: 24.5247, longitude: 39.5692, timezone: 'Asia/Riyadh' },
  { cityName: 'الرياض', countryName: 'المملكة العربية السعودية', latitude: 24.7136, longitude: 46.6753, timezone: 'Asia/Riyadh' },
  { cityName: 'جدة', countryName: 'المملكة العربية السعودية', latitude: 21.5433, longitude: 39.1728, timezone: 'Asia/Riyadh' },
  { cityName: 'القاهرة', countryName: 'مصر', latitude: 30.0444, longitude: 31.2357, timezone: 'Africa/Cairo' },
  { cityName: 'الإسكندرية', countryName: 'مصر', latitude: 31.2001, longitude: 29.9187, timezone: 'Africa/Cairo' },
  { cityName: 'القدس الشريف', countryName: 'فلسطين', latitude: 31.7683, longitude: 35.2137, timezone: 'Asia/Jerusalem' },
  { cityName: 'دبي', countryName: 'الإمارات العربية المتحدة', latitude: 25.2048, longitude: 55.2708, timezone: 'Asia/Dubai' },
  { cityName: 'أبو ظبي', countryName: 'الإمارات العربية المتحدة', latitude: 24.4539, longitude: 54.3773, timezone: 'Asia/Dubai' },
  { cityName: 'الدوحة', countryName: 'قطر', latitude: 25.2854, longitude: 51.5310, timezone: 'Asia/Qatar' },
  { cityName: 'الكويت', countryName: 'الكويت', latitude: 29.3759, longitude: 47.9774, timezone: 'Asia/Kuwait' },
  { cityName: 'مسقط', countryName: 'عمان', latitude: 23.5880, longitude: 58.3829, timezone: 'Asia/Muscat' },
  { cityName: 'المنامة', countryName: 'البحرين', latitude: 26.2285, longitude: 50.5860, timezone: 'Asia/Bahrain' },
  { cityName: 'عمّان', countryName: 'الأردن', latitude: 31.9454, longitude: 35.9284, timezone: 'Asia/Amman' },
  { cityName: 'بيروت', countryName: 'لبنان', latitude: 33.8938, longitude: 35.5018, timezone: 'Asia/Beirut' },
  { cityName: 'دمشق', countryName: 'سوريا', latitude: 33.5138, longitude: 36.2765, timezone: 'Asia/Damascus' },
  { cityName: 'بغداد', countryName: 'العراق', latitude: 33.3152, longitude: 44.3661, timezone: 'Asia/Baghdad' },
  { cityName: 'إسطنبول', countryName: 'تركيا', latitude: 41.0082, longitude: 28.9784, timezone: 'Europe/Istanbul' },
  { cityName: 'الدار البيضاء', countryName: 'المغرب', latitude: 33.5731, longitude: -7.5898, timezone: 'Africa/Casablanca' },
  { cityName: 'الرباط', countryName: 'المغرب', latitude: 34.0209, longitude: -6.8416, timezone: 'Africa/Casablanca' },
  { cityName: 'الجزائر العاصمة', countryName: 'الجزائر', latitude: 36.7538, longitude: 3.0588, timezone: 'Africa/Algiers' },
  { cityName: 'تونس', countryName: 'تونس', latitude: 36.8065, longitude: 10.1815, timezone: 'Africa/Tunis' },
  { cityName: 'طرابلس', countryName: 'ليبيا', latitude: 32.8872, longitude: 13.1913, timezone: 'Africa/Tripoli' },
  { cityName: 'الخرطوم', countryName: 'السودان', latitude: 15.5007, longitude: 32.5599, timezone: 'Africa/Khartoum' },
  { cityName: 'لندن', countryName: 'المملكة المتحدة', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London' },
  { cityName: 'باريس', countryName: 'فرنسا', latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris' },
  { cityName: 'برلين', countryName: 'ألمانيا', latitude: 52.5200, longitude: 13.4050, timezone: 'Europe/Berlin' },
  { cityName: 'نيويورك', countryName: 'الولايات المتحدة', latitude: 40.7128, longitude: -74.0060, timezone: 'America/New_York' },
  { cityName: 'تورونتو', countryName: 'كندا', latitude: 43.6532, longitude: -79.3832, timezone: 'America/Toronto' },
];
