/* Service Worker for CallNotify Web Push */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'Incoming call event',
      tag: data.tag || ('call-' + Date.now()),
      renotify: true,
      requireInteraction: true,
      data: data.data || {}
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Alert', options)
    );
  } catch (e) {
    console.error('Error handling push notification:', e);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
