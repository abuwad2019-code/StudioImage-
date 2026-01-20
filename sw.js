// sw.js - Service Worker with Robust Offline Support
const CACHE_NAME = 'studio-cache-v9'; // Incremented version to force update
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  'https://cdn.tailwindcss.com', // Cache Tailwind
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&display=swap', // Cache Fonts CSS
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Try to cache all, but don't fail if one fails (handled in fetch)
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('Some assets failed to cache:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isNavigate = event.request.mode === 'navigate';

  // 1. Navigation Fallback (SPA Routing Support)
  if (isNavigate) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }

  // 2. For Google Fonts & CDNs: Cache First
  if (url.hostname.includes('fonts.gstatic.com') || 
      url.hostname.includes('cdn.tailwindcss.com') ||
      url.hostname.includes('fonts.googleapis.com')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((fetchRes) => {
          return caches.open(CACHE_NAME).then((cache) => {
             // Only cache valid GET responses
             if (event.request.method === 'GET' && fetchRes.status === 200) {
                cache.put(event.request, fetchRes.clone());
             }
             return fetchRes;
          });
        });
      })
    );
    return;
  }

  // 3. For API Calls: Network Only
  // Explicitly ignore caching for any Google API to prevent CORS/POST issues
  if (url.hostname.includes('googleapis') || url.hostname.includes('generativelanguage')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 4. Default: Stale-While-Revalidate for other assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // CRITICAL FIX: Only cache GET requests.
        // Attempting to cache POST requests (like Gemini API calls if they fall through) throws an error.
        if (event.request.method === 'GET' && networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
           // Don't cache tsx files in runtime/dev
           if (!url.pathname.endsWith('.tsx')) {
             const responseToCache = networkResponse.clone();
             caches.open(CACHE_NAME).then((cache) => {
               cache.put(event.request, responseToCache);
             });
           }
        }
        return networkResponse;
      });
      return cachedResponse || fetchPromise;
    })
  );
});