// sw.js - Service Worker with Robust Offline Support
const CACHE_NAME = 'studio-cache-v10'; // Incremented version
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&display=swap',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
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
  
  // 1. CRITICAL: Bypass Service Worker for all API calls immediately.
  // This prevents the SW from interfering with POST requests, CORS, or Quota headers.
  if (url.hostname.includes('googleapis') || url.hostname.includes('generativelanguage')) {
    return; // Let the browser handle the request directly (Network Only)
  }

  const isNavigate = event.request.mode === 'navigate';

  // 2. Navigation Fallback
  if (isNavigate) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // 3. Cache First for Static Assets (Fonts/CDN)
  if (url.hostname.includes('fonts.gstatic.com') || 
      url.hostname.includes('cdn.tailwindcss.com') ||
      url.hostname.includes('fonts.googleapis.com')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((fetchRes) => {
          if (fetchRes.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
               cache.put(event.request, fetchRes.clone());
            });
          }
          return fetchRes;
        });
      })
    );
    return;
  }

  // 4. Stale-While-Revalidate for local assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Only cache valid GET requests for static files
        if (event.request.method === 'GET' && networkResponse && networkResponse.status === 200) {
           if (!url.pathname.endsWith('.tsx') && !url.pathname.includes('hmr')) {
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