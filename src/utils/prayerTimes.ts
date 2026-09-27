import { CalculationMethod, CalculationMethodId, JuristicMethod, PrayerName, PrayerTimeItem, HijriDateInfo } from '../types/prayer';

export const CALCULATION_METHODS: Record<CalculationMethodId, CalculationMethod> = {
  MAKKAH: {
    id: 'MAKKAH',
    nameArabic: 'أم القرى (مكة المكرمة)',
    nameEnglish: 'Umm al-Qura University, Makkah',
    fajrAngle: 18.5,
    ishaIntervalMinutes: 90, // 90 min after Maghrib (120 in Ramadan)
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
  QATAR: {
    id: 'QATAR',
    nameArabic: 'وزارة الأوقاف القطرية',
    nameEnglish: 'Ministry of Awqaf, Qatar',
    fajrAngle: 18,
    ishaIntervalMinutes: 90,
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
  fridayOffsetMinutes?: number
): CalculatedTimes {
  const method = CALCULATION_METHODS[methodId] || CALCULATION_METHODS.MAKKAH;
  const julian = getJulianDate(date);
  const sun = calculateSunPosition(julian);

  // Timezone offset in hours
  const timezoneOffset = -date.getTimezoneOffset() / 60;

  // Dhuhr (solar transit noon)
  const dhuhrHour = fixHour(12 + timezoneOffset - longitude / 15.0 - sun.equationOfTime);

  // Helper for angle zenith
  function timeForSunAngle(angle: number, isMorning: boolean): number {
    const latRad = degToRad(latitude);
    const decRad = degToRad(sun.declination);
    const cosHourAngle =
      (Math.sin(degToRad(-angle)) - Math.sin(latRad) * Math.sin(decRad)) /
      (Math.cos(latRad) * Math.cos(decRad));

    if (cosHourAngle > 1) return isMorning ? 0 : 24; // Sun never rises
    if (cosHourAngle < -1) return isMorning ? 12 : 12; // Sun never sets

    const hourAngle = radToDeg(Math.acos(cosHourAngle)) / 15.0;
    return isMorning ? dhuhrHour - hourAngle : dhuhrHour + hourAngle;
  }

  // Sunrise and Sunset (approx 0.833 degrees for atmospheric refraction + sun diameter)
  const sunriseHour = timeForSunAngle(0.833, true);
  const sunsetHour = timeForSunAngle(0.833, false);

  // Fajr
  const fajrHour = timeForSunAngle(method.fajrAngle, true);

  // Asr shadow
  const shadowMultiplier = juristic === 'hanafi' ? 2 : 1;
  const decRad = degToRad(sun.declination);
  const latRad = degToRad(latitude);
  const angleAsr = radToDeg(
    Math.atan(1.0 / (shadowMultiplier + Math.tan(Math.abs(latRad - decRad))))
  );
  const asrHour = timeForSunAngle(90 - angleAsr, false);

  // Maghrib
  const maghribHour = sunsetHour + 2 / 60; // 2 minutes added for precautions

  // Isha
  let ishaHour: number;
  if (method.ishaIntervalMinutes) {
    ishaHour = maghribHour + method.ishaIntervalMinutes / 60;
  } else if (method.ishaAngle) {
    ishaHour = timeForSunAngle(method.ishaAngle, false);
  } else {
    ishaHour = maghribHour + 1.5;
  }

  // Convert decimal hours into real Date objects
  const makeDate = (hourVal: number, dayOffset = 0): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + dayOffset);
    let h = Math.floor(hourVal);
    let remMinutes = (hourVal - h) * 60;
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

  const fajrDate = makeDate(fajrHour);
  const sunriseDate = makeDate(sunriseHour);
  // Salat al-Duha starts ~20 minutes after sunrise (after the sun rises a spear height / خروج وقت الكراهة)
  const duhaDate = new Date(sunriseDate.getTime() + 20 * 60 * 1000);
  const dhuhrDate = makeDate(dhuhrHour);
  const offsetMin = fridayOffsetMinutes !== undefined ? fridayOffsetMinutes : getSavedFridayOffsetMinutes();
  const jumuahDate = new Date(dhuhrDate.getTime() + offsetMin * 60 * 1000);
  const jumuahFirstAdhan = new Date(jumuahDate.getTime() - 25 * 60 * 1000);
  const asrDate = makeDate(asrHour);
  const maghribDate = makeDate(maghribHour);
  const ishaDate = makeDate(ishaHour);

  // Qiyam (Last third of the night between Maghrib and Next Fajr)
  // Approximate next Fajr as 24h after current Fajr
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
