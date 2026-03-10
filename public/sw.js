/* eslint-disable no-restricted-globals */
self.addEventListener('push', (event) => {
  let data = { title: 'Notification', body: '', url: '/' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (_) {}
  }
  const options: NotificationOptions = {
    body: data.body || '',
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(data.title || 'Notification', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(self.location.origin + (url.startsWith('/') ? url : '/' + url));
      }
    }),
  );
});
