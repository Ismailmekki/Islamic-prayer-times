/**
 * iCalendar (.ics) Prayer Times & Adhan Generator
 * Enables iOS and Android users to import native calendar alarms with sound
 * that trigger reliably on lock screen even if the phone is locked, off, or app is fully closed!
 */

import { PrayerTimeItem, UserLocation } from '../types/prayer';

export function generatePrayerTimesIcs(
  prayers: PrayerTimeItem[],
  location: UserLocation,
  daysCount = 30
): string {
  const now = new Date();
  const prodId = '-//Salati App//Islamic Prayer Times & Adhan Alarm//AR';

  let events = '';

  const pad = (n: number) => n.toString().padStart(2, '0');

  // Generate events for the next N days
  for (let dayOffset = 0; dayOffset < daysCount; dayOffset++) {
    const targetDate = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const yyyy = targetDate.getFullYear();
    const mm = pad(targetDate.getMonth() + 1);
    const dd = pad(targetDate.getDate());
    const datePrefix = `${yyyy}${mm}${dd}`;

    prayers
      .filter((p) => p.isPrayer)
      .forEach((prayer) => {
        const [hStr, mStr] = prayer.time.split(':');
        const h = parseInt(hStr, 10) || 0;
        const m = parseInt(mStr, 10) || 0;

        const startLocal = `${datePrefix}T${pad(h)}${pad(m)}00`;

        // End time is 25 minutes after start
        let endH = h;
        let endM = m + 25;
        if (endM >= 60) {
          endH = (endH + 1) % 24;
          endM = endM - 60;
        }
        const endLocal = `${datePrefix}T${pad(endH)}${pad(endM)}00`;

        const uid = `salati-${prayer.id}-${datePrefix}@salati.app`;
        const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        events += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${stamp}
DTSTART:${startLocal}
DTEND:${endLocal}
SUMMARY:🕌 أذان صلاة ${prayer.nameArabic} (${location.cityName})
DESCRIPTION:الله أكبر، الله أكبر. حان الآن موعد رفع أذان صلاة ${prayer.nameArabic} حسب التوقيت المحلي لمدينة ${location.cityName}. الصلاة خير من النوم، وصلاتك نجاتك.
LOCATION:${location.cityName}
STATUS:CONFIRMED
TRANSP:TRANSPARENT
CATEGORIES:PRAYER,ISLAMIC
BEGIN:VALARM
TRIGGER:-PT0M
ACTION:DISPLAY
DESCRIPTION:🕌 حان الآن وقت أذان صلاة ${prayer.nameArabic}
END:VALARM
BEGIN:VALARM
TRIGGER:-PT0M
ACTION:AUDIO
ATTACH;VALUE=URI:Chord
END:VALARM
BEGIN:VALARM
TRIGGER:-PT10M
ACTION:DISPLAY
DESCRIPTION:⏰ اقترب موعد أذان صلاة ${prayer.nameArabic} (بقي 10 دقائق)
END:VALARM
END:VEVENT
`;
      });
  }

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:${prodId}
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:مواقيت صلاتي والأذان - ${location.cityName}
X-WR-TIMEZONE:${location.timezone || 'UTC'}
X-WR-CALDESC:مواقيت الصلاة اليومية ورفع الأذان مع منبهات صوتية أصلية لشاشة القفل تعمل حتى عند إغلاق التطبيق
${events}END:VCALENDAR`;
}

export function downloadPrayerTimesIcs(
  prayers: PrayerTimeItem[],
  location: UserLocation,
  daysCount = 30
): boolean {
  try {
    const icsContent = generatePrayerTimesIcs(prayers, location, daysCount);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salati-prayers-${location.cityName.replace(/\s+/g, '-')}-${daysCount}days.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return true;
  } catch (err) {
    console.error('Failed to generate prayer ICS file:', err);
    return false;
  }
}
