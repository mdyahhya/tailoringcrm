/* ==============================================================================
   IQBAL FASHION TAILORING ERP - SERVICE WORKER (sw.js)
   Production PWA Offline Caching & Web Push Notifications
   ============================================================================== */

const CACHE_NAME = 'iqbal-erp-v1.0.2';

// Core static app shell assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/orders.html',
  '/new-order.html',
  '/order-detail.html',
  '/customers.html',
  '/employees.html',
  '/history.html',
  '/notifications.html',
  '/settings.html',
  '/offline.html',
  '/manifest.json',
  '/scripts/i18n.js',
  '/icons/iqbal_logo.jpg',
  '/icons/logo.svg',
  '/icons/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon-180.png'
];

// Install Event: Precache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up stale caches & claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Skip Waiting trigger from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch Event: Network-first for HTML navigation & APIs; stale-while-revalidate for static files
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignore non-GET requests and browser extensions
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // 1. Navigation requests (HTML pages): Network-first with offline.html fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If valid response, update cache
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // 2. Supabase API or Dynamic JSON calls: Network only (never cache authenticated DB responses)
  if (url.hostname.includes('supabase.co') || url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // 3. Static Assets (Icons, fonts, CDN scripts): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// ==============================================================================
// BACKGROUND WEB PUSH NOTIFICATION HANDLER
// ==============================================================================

self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Iqbal Fashion ERP', body: event.data.text() };
    }
  }

  const title = data.title || 'Iqbal Fashion Order Update';
  const orderId = data.order_id || (data.data && data.data.order_id) || '';
  const stage = data.stage || '';
  
  // High-priority stages require interaction
  const isHighPriority = stage === 'ready' || stage === 'delivered';

  const options = {
    body: data.body || 'An order in your tailoring pipeline has been updated.',
    icon: '/icons/icon-192.png',
    badge: '/icons/favicon.svg',
    tag: orderId ? `order-${orderId}` : `notification-${Date.now()}`,
    renotify: true,
    silent: false,
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: isHighPriority,
    data: {
      url: data.url || (orderId ? `/order-detail.html?id=${orderId}` : '/orders.html'),
      order_id: orderId,
      timestamp: Date.now()
    },
    actions: orderId ? [
      { action: 'view_order', title: 'View Order' }
    ] : []
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification Click Handler: Deep-link to Order Detail
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) 
    ? event.notification.data.url 
    : '/orders.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If an existing tab/window is open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
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

// Automatic Push Subscription Change Renewal
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options).then((newSubscription) => {
      // Forward new subscription payload to serverless endpoint
      return fetch('/api/send-push?action=renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldEndpoint: event.oldSubscription ? event.oldSubscription.endpoint : null,
          newSubscription: newSubscription
        })
      });
    }).catch((err) => {
      console.error('[SW] pushsubscriptionchange failed:', err);
    })
  );
});
