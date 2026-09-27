export type PrayerName = 'fajr' | 'sunrise' | 'duha' | 'dhuhr' | 'jumuah' | 'asr' | 'maghrib' | 'isha' | 'qiyam';

export interface PrayerTimeItem {
  id: PrayerName;
  nameArabic: string;
  nameEnglish: string;
  time: string; // HH:mm
  timestamp: number; // Unix epoch ms
  isNext: boolean;
  isPassed: boolean;
  isCurrent: boolean;
  isPrayer: boolean; // false for sunrise
}

export type CalculationMethodId = 
  | 'MWL'      // Muslim World League
  | 'ISNA'     // Islamic Society of North America
  | 'EGYPT'    // Egyptian General Authority of Survey
  | 'MAKKAH'   // Umm al-Qura University, Makkah
  | 'KARACHI'  // Univ. of Islamic Sciences, Karachi
  | 'DUBAI'    // UAE / Dubai
  | 'KUWAIT'   // Kuwait
  | 'QATAR';   // Qatar

export interface CalculationMethod {
  id: CalculationMethodId;
  nameArabic: string;
  nameEnglish: string;
  fajrAngle: number;
  ishaAngle?: number;
  ishaIntervalMinutes?: number;
}

export type JuristicMethod = 'standard' | 'hanafi'; // Asr calculation

export interface UserLocation {
  latitude: number;
  longitude: number;
  cityName: string;
  countryName: string;
  timezone: string;
  isAutoGPS: boolean;
}

export interface AdhanVoice {
  id: string;
  titleArabic: string;
  reciterArabic: string;
  locationArabic: string;
  audioUrl: string;
  durationText: string;
  isFajrSpecific?: boolean;
}

export interface MosqueItem {
  id: string | number;
  name: string;
  lat: number;
  lon: number;
  distanceMeters: number;
  address?: string;
  hasFridayPrayer?: boolean;
  hasAblution?: boolean;
}

export interface HijriDateInfo {
  day: number;
  monthIndex: number;
  monthNameArabic: string;
  year: number;
  gregorianDateFormatted: string;
  dayNameArabic: string;
}
