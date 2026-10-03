// Custom Service Worker script for Salati PWA (Adhan & Prayer Notifications)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;
  const data = event.notification.data || {};

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.postMessage({
            type: 'SALATI_NOTIFICATION_CLICK',
            action,
            data,
          });
          return client.focus();
        }
      }
      // If no open window, open app
      if (clients.openWindow) {
        return clients.openWindow('/?adhan=1');
      }
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
