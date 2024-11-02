self.addEventListener('push', event => {
  const options = {
    body: event.data.text(),
    icon: '/notification-icon.png',
    badge: '/badge-icon.png',
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification('AFK Community', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
}); 