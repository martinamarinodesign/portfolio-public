// Service Worker — caches videos, images, and pages for instant back-navigation
// Bump the version number to invalidate old caches when content changes
const CACHE_VERSION = 'mm-v2';

const PRECACHE_URLS = [
  'index.html',
  'cover-hd-opt.mp4',
  'compressed-opt.mp4',
  'star-opt.mp4',
  'flowpilot-opt.mp4'
];

// Install: precache critical assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches when version changes
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: serve from cache first, fall back to network, cache the response
self.addEventListener('fetch', (e) => {
  const url = e.request.url;

  // Only cache GET requests for same-origin + Behance CDN images
  if (e.request.method !== 'GET') return;

  const shouldCache =
    url.startsWith(self.location.origin) ||
    url.includes('mir-s3-cdn-cf.behance.net');

  if (!shouldCache) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;

      return fetch(e.request).then(response => {
        // Only cache successful responses
        if (!response || response.status !== 200) return response;

        const clone = response.clone();
        caches.open(CACHE_VERSION).then(cache => cache.put(e.request, clone));
        return response;
      });
    })
  );
});
