/**
 * iCalendar (.ics) Prayer Times & Adhan Generator
 * Enables iOS and Android users to import native calendar alarms with sound
 * that trigger reliably on lock screen even if the phone is locked or offline.
 */

import { PrayerTimeItem, UserLocation } from '../types/prayer';

export function generatePrayerTimesIcs(
  prayers: PrayerTimeItem[],
  location: UserLocation,
  daysCount = 14
): string {
  const now = new Date();
  const prodId = '-//Salati App//Islamic Prayer Times//AR';
  
  let events = '';

  // Generate events for the next N days
  for (let dayOffset = 0; dayOffset < daysCount; dayOffset++) {
    const targetDate = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const dateStr = targetDate.toISOString().slice(0, 10).replace(/-/g, '');

    prayers.filter((p) => p.isPrayer).forEach((prayer) => {
      const [hStr, mStr] = prayer.time.split(':');
      const h = parseInt(hStr, 10) || 0;
      const m = parseInt(mStr, 10) || 0;

      const eventStart = new Date(targetDate);
      eventStart.setHours(h, m, 0, 0);

      const eventEnd = new Date(eventStart.getTime() + 20 * 60 * 1000); // 20 min

      const dtStart = eventStart.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const dtEnd = eventEnd.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const uid = `salati-${prayer.id}-${dateStr}@salati.app`;

      events += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtStart}
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:🕌 أذان صلاة ${prayer.nameArabic}
DESCRIPTION:الله أكبر، الله أكبر. حان الآن موعد رفع أذان صلاة ${prayer.nameArabic} حسب التوقيت المحلي لمدينة ${location.cityName}. صلاتك نجاتك.
LOCATION:${location.cityName}
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:PT0M
ACTION:DISPLAY
DESCRIPTION:🕌 حان الآن وقت أذان صلاة ${prayer.nameArabic}
END:VALARM
BEGIN:VALARM
TRIGGER:PT0M
ACTION:AUDIO
ATTACH;VALUE=URI:Basso
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
X-WR-CALDESC:مواقيت الصلاة اليومية ورفع الأذان مع تنبيهات شاشة القفل التلقائية
${events}END:VCALENDAR`;
}

export function downloadPrayerTimesIcs(
  prayers: PrayerTimeItem[],
  location: UserLocation,
  daysCount = 14
): boolean {
  try {
    const icsContent = generatePrayerTimesIcs(prayers, location, daysCount);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salati-prayers-${location.cityName.replace(/\s+/g, '-')}.ics`;
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
