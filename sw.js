// sw.js - Service Worker with API Bypass
const CACHE_NAME = 'studio-cache-v11'; // Incremented version
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&display=swap',
];

self.addEventListener('install', (event) => {
  // Force this SW to become the active service worker immediately
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
  // Take control of all open pages immediately
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
  
  // CRITICAL: Strict bypass for Google APIs to prevent POST/CORS issues
  if (url.hostname.includes('googleapis') || url.hostname.includes('generativelanguage') || url.pathname.includes('generateContent')) {
    return; // Network only
  }

  // Navigation Fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Cache First for known CDNs
  if (url.hostname.includes('fonts.gstatic.com') || 
      url.hostname.includes('cdn.tailwindcss.com')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((fetchRes) => {
          if (fetchRes.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, fetchRes.clone()));
          }
          return fetchRes;
        });
      })
    );
    return;
  }

  // Stale-While-Revalidate for others (Only GET)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
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