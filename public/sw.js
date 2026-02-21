const CACHE_NAME = 'unfric-shell-v3';

// App Shell assets to pre-cache — UI is always visible
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
];

// Install: pre-cache app shell
self.addEventListener('install', (event) => {
  console.log('[SW] Installing unfric-shell-v3…');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(APP_SHELL).catch((err) => {
        console.warn('[SW] Pre-cache partial failure:', err);
      })
    )
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating unfric-shell-v3…');
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    )
  );
  self.clients.claim();
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Skip Supabase API calls — handled by React Query + IndexedDB
  if (url.hostname.includes('supabase')) return;
  if (url.pathname.startsWith('/rest/') || url.pathname.startsWith('/auth/')) return;

  // Navigation requests → Network-first, fallback to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put('/', clone.clone());
              cache.put('/index.html', clone);
            });
          }
          return response;
        })
        .catch(() => {
          console.log('[SW] Navigation offline — serving cached /index.html');
          return caches.match('/index.html')
            .then((cached) => cached || caches.match('/'));
        })
    );
    return;
  }

  // Static assets (JS, CSS, fonts, images) — cache-first, network fallback
  if (
    url.pathname.match(/\.(js|css|woff2?|ttf|otf|png|jpg|jpeg|svg|webp|ico)$/) ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => new Response('', { status: 503 }));
      })
    );
    return;
  }
});

// Listen for skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
