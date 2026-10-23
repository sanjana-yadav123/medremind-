// MedRemind Service Worker - Mobile PWA & Push Notifications
const CACHE_NAME = 'medremind-shell-v1';
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

// Install event: cache static shell only
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: Network-first for dynamic navigation, Cache-first for safe static assets
// NEVER cache /api/*, /prescriptions/download/* or sensitive Supabase auth routes in SW cache.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Exclude sensitive healthcare APIs and auth
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.hostname.includes('supabase.co') ||
    event.request.method !== 'GET'
  ) {
    return; // Pass directly to network
  }

  // Static assets & navigation
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful static responses
        if (
          networkResponse.status === 200 &&
          (url.pathname.startsWith('/_next/static/') ||
            url.pathname.startsWith('/icons/') ||
            url.pathname.endsWith('.svg') ||
            url.pathname.endsWith('.png'))
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(async () => {
        // Network failure: try cache
        const cached = await caches.match(event.request);
        if (cached) return cached;

        // If navigation request fails, return friendly offline Hindi fallback
        if (event.request.mode === 'navigate') {
          const offlinePage = await caches.match('/offline.html');
          if (offlinePage) return offlinePage;
        }

        return new Response('इंटरनेट कनेक्शन उपलब्ध नहीं है (Offline)', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      })
  );
});

// Web Push Event Handler
self.addEventListener('push', (event) => {
  let data = {
    title: 'दवा का समय हो गया है (Medicine Reminder)',
    body: 'कृपया अपनी निर्धारित दवा लें।',
    doseEventId: null,
    targetUrl: '/dashboard',
    tag: 'medremind-dose-alert',
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192.svg',
    badge: '/icons/icon-192.svg',
    vibrate: [200, 100, 200, 100, 400],
    tag: data.tag || 'medremind-alert',
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.targetUrl || '/dashboard',
      doseEventId: data.doseEventId,
    },
    actions: [
      { action: 'view', title: 'दवा देखें (View Dose)' },
      { action: 'dismiss', title: 'हटाएँ (Dismiss)' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification Click Handler: Navigate to the relevant medicine dashboard
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus and navigate it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
