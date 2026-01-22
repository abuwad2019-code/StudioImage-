
// sw.js - Optimized for AI Production Environment
// Updated Cache Name to force refresh
const CACHE_NAME = 'studio-v13-hotfix-429';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&display=swap',
];

// Regex for all Google AI/API endpoints to ensure zero interference
const GOOGLE_API_REGEX = /googleapis\.com|generativelanguage|google\.ai/;

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force new SW to take control immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(), // Become available to all pages immediately
      caches.keys().then((keys) => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // RULE 1: STRICT BYPASS for Google APIs - No caching, no hijacking
  if (GOOGLE_API_REGEX.test(url)) {
    return; // Let browser handle it directly via network
  }

  // RULE 2: Navigation Fallback for PWA feel
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // RULE 3: Stale-While-Revalidate for local assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request).then((res) => {
        if (res.ok && event.request.method === 'GET') {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, resClone));
        }
        return res;
      });
      return cached || network;
    })
  );
});