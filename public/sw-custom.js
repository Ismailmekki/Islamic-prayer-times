// Custom Service Worker script for Salati PWA
// Provides background prayer alarm scheduling, Notification Triggers, and closed-app wakeups

const DB_NAME = 'salati_sw_db';
const STORE_NAME = 'prayer_alarms';

// Helper to open IndexedDB in Service Worker
function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Store upcoming prayer alarms
async function storePrayerAlarms(alarms) {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    // Clear old
    store.clear();
    alarms.forEach((item) => store.put(item));
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn('SW: storePrayerAlarms error', err);
    return false;
  }
}

// Get upcoming prayer alarms
async function getStoredPrayerAlarms() {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    return new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

// Schedule system notifications for upcoming prayers
async function schedulePrayerNotifications(alarms, cityName = 'موقعي') {
  if (!self.registration) return;

  const nowMs = Date.now();
  const hasTriggers = typeof TimestampTrigger !== 'undefined';

  for (const prayer of alarms) {
    if (!prayer || !prayer.timestamp) continue;
    if (prayer.timestamp <= nowMs) continue; // Passed already

    const targetTime = new Date(prayer.timestamp);
    const timeFormatted = `${targetTime.getHours().toString().padStart(2, '0')}:${targetTime.getMinutes().toString().padStart(2, '0')}`;

    const title = `🕌 حَانَ الآن موعد أذان ${prayer.nameArabic}`;
    const body = `الله أكبر، الله أكبر.. رُفع الآن أذان ${prayer.nameArabic} (${timeFormatted}) لمدينة ${cityName}. اضغط لسماع الأذان كاملاً.`;
    const tag = `salati-adhan-${prayer.id}-${prayer.timestamp}`;

    const options = {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag,
      requireInteraction: true,
      silent: false,
      renotify: true,
      vibrate: [800, 400, 800, 400, 1600],
      sound: '/audio/adhan/makkah.mp3',
      actions: [
        { action: 'listen_adhan', title: '🔊 سماع الأذان كاملاً' },
        { action: 'open_app', title: '🕌 فتح صلاتي' },
      ],
      data: {
        url: `/?adhan=1&prayer=${encodeURIComponent(prayer.nameArabic)}`,
        prayerName: prayer.nameArabic,
        timestamp: prayer.timestamp,
        cityName,
      },
    };

    // If Notification Triggers API is supported, schedule natively with the OS!
    if (hasTriggers) {
      try {
        options.showTrigger = new TimestampTrigger(prayer.timestamp);
        await self.registration.showNotification(title, options);
      } catch (err) {
        console.warn('SW: Notification Trigger scheduling error', err);
      }
    }
  }
}

// Check if any prayer is currently due
async function checkDuePrayers() {
  const alarms = await getStoredPrayerAlarms();
  const nowMs = Date.now();

  for (const prayer of alarms) {
    const diff = nowMs - prayer.timestamp;
    // Due within the last 5 minutes and not notified yet
    if (diff >= 0 && diff < 5 * 60 * 1000 && !prayer.notified) {
      prayer.notified = true;
      const title = `🕌 حَانَ الآن موعد أذان ${prayer.nameArabic}`;
      const body = `الله أكبر، الله أكبر.. رُفع الآن أذان ${prayer.nameArabic} حسب التوقيت المحلي لمدينة ${prayer.cityName || 'مدينتك'}. اضغط للاستماع للأذان كاملاً.`;
      
      try {
        await self.registration.showNotification(title, {
          body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: `adhan-due-${prayer.id}-${prayer.timestamp}`,
          requireInteraction: true,
          silent: false,
          renotify: true,
          vibrate: [800, 400, 800, 400, 1600],
          sound: '/audio/adhan/makkah.mp3',
          actions: [
            { action: 'listen_adhan', title: '🔊 سماع الأذان كاملاً' },
            { action: 'open_app', title: '🕌 فتح صلاتي' },
          ],
          data: {
            url: `/?adhan=1&prayer=${encodeURIComponent(prayer.nameArabic)}`,
            prayerName: prayer.nameArabic,
            timestamp: prayer.timestamp,
          },
        });
      } catch (e) {
        console.warn('SW: showNotification error', e);
      }
    }
  }

  // Update DB with notified flags
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    alarms.forEach((item) => store.put(item));
  } catch {}
}

// Background Periodic Sync (Chrome / Android)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'prayer-adhan-sync' || event.tag === 'prayer-check-sync') {
    event.waitUntil(checkDuePrayers());
  }
});

// Regular Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'prayer-check-sync') {
    event.waitUntil(checkDuePrayers());
  }
});

// Notification Click Handler: Opens app, wakes up audio, and focuses window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const targetUrl = data.url || '/?adhan=1';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. Focus existing window if available
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.postMessage({
            type: 'SALATI_TRIGGER_ADHAN',
            prayerName: data.prayerName || 'الصلاة',
          });
          return client.focus();
        }
      }
      // 2. If app was completely closed, open standalone window with ?adhan=1
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Listen for messages from frontend
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  // Frontend sends list of upcoming prayers to schedule
  if (event.data.type === 'SCHEDULE_PRAYER_ALARMS') {
    const { prayerList, cityName } = event.data.payload || {};
    if (Array.isArray(prayerList)) {
      event.waitUntil(
        (async () => {
          await storePrayerAlarms(
            prayerList.map((p) => ({
              id: `${p.id}-${p.timestamp}`,
              prayerId: p.id,
              nameArabic: p.nameArabic,
              timestamp: p.timestamp,
              time: p.time,
              cityName,
              notified: false,
            }))
          );
          await schedulePrayerNotifications(prayerList, cityName);

          // Also set direct timeouts for next 24 hours in SW
          const nowMs = Date.now();
          for (const prayer of prayerList) {
            if (!prayer || !prayer.timestamp) continue;
            const delta = prayer.timestamp - nowMs;
            if (delta > 0 && delta <= 24 * 60 * 60 * 1000) {
              setTimeout(async () => {
                try {
                  await self.registration.showNotification(`🕌 حَانَ الآن موعد أذان صلاة ${prayer.nameArabic}`, {
                    body: `الله أكبر، الله أكبر.. رُفع الآن أذان ${prayer.nameArabic} حسب التوقيت المحلي لمدينة ${cityName || 'مدينتك'}. اضغط لسماع الأذان كاملاً.`,
                    icon: '/pwa-192x192.png',
                    badge: '/pwa-192x192.png',
                    tag: `adhan-due-${prayer.id}-${prayer.timestamp}`,
                    requireInteraction: true,
                    silent: false,
                    renotify: true,
                    vibrate: [800, 400, 800, 400, 1600],
                    sound: '/audio/adhan/makkah.mp3',
                    actions: [
                      { action: 'listen_adhan', title: '🔊 استماع للأذان كاملاً' },
                      { action: 'open_app', title: '🕌 فتح صلاتي' },
                    ],
                    data: {
                      url: `/?adhan=1&prayer=${encodeURIComponent(prayer.nameArabic)}`,
                      prayerName: prayer.nameArabic,
                      timestamp: prayer.timestamp,
                    },
                  });
                } catch (err) {}
              }, delta);
            }
          }
        })()
      );
    }
  }
});
