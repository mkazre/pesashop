// Service Worker for Web Push Notifications
// This file must be in the public directory to have the correct scope

self.addEventListener('push', function(event) {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: 'New Notification', body: event.data.text() };
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    image: data.image || undefined,
    data: data.data || {},
    actions: data.actions || [],
    tag: data.tag || 'default',
    renotify: data.renotify || false,
    requireInteraction: false,
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const data = event.notification.data || {};
  let url = '/';

  if (event.action === 'open' && data.actionUrl) {
    url = data.actionUrl;
  } else if (event.action === 'secondary' && data.secondaryActionUrl) {
    url = data.secondaryActionUrl;
  } else if (data.actionUrl) {
    url = data.actionUrl;
  }

  // Make relative URLs absolute
  if (url.startsWith('/')) {
    url = self.location.origin + url;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Focus existing window if available
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Handle notification close (for analytics)
self.addEventListener('notificationclose', function(event) {
  // Could send analytics event here if needed
});
