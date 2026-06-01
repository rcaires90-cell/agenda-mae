// --- SERVICE WORKER: offline cache + scheduled notifications ---
const CACHE = 'agenda-mae-v1';
const ASSETS = ['/', '/index.html', '/icon.svg', '/manifest.json'];

// Install: cache assets
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

// Fetch: serve from cache, fallback to network
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res && res.status === 200) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }))
  );
});

// --- NOTIFICATION SCHEDULING ---
let scheduled = {};

self.addEventListener('message', event => {
  const { action, notifications } = event.data || {};

  if (action === 'schedule') {
    // Clear old timers
    Object.values(scheduled).forEach(clearTimeout);
    scheduled = {};

    const now = Date.now();
    (notifications || []).forEach(n => {
      const delay = n.fireAt - now;
      // Only schedule if in the future and within 48h
      if (delay > 0 && delay < 172800000) {
        scheduled[n.id] = setTimeout(() => {
          self.registration.showNotification(n.title, {
            body: n.body,
            icon: '/icon.svg',
            badge: '/icon.svg',
            tag: n.id,
            vibrate: [200, 100, 200],
            requireInteraction: false,
            data: { url: '/' }
          });
        }, delay);
      }
    });
  }

  if (action === 'test') {
    self.registration.showNotification('🔔 Notificações ativas!', {
      body: 'Os lembretes da Agenda da Mãe estão funcionando.',
      icon: '/icon.svg',
      tag: 'test',
      vibrate: [200, 100, 200]
    });
  }
});

// Click na notificação abre o app
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cls => {
      const open = cls.find(c => c.url.includes(self.location.origin));
      if (open) return open.focus();
      return clients.openWindow('/');
    })
  );
});
