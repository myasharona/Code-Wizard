// Code Wizard — service worker
// Strategy: cache-first for local assets so the app works offline after first load.
// Pyodide + Google Fonts are fetched from CDN; we use stale-while-revalidate for those.

const CACHE = 'code-wizard-v5';
const LOCAL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './lessons.js',
  './shared.jsx',
  './arcade-cabinet.jsx',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './sprites/kitty.png',
  './sprites/owl.png',
  './sprites/dragon.png',
];

// Install: pre-cache local assets.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(LOCAL_ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate: clear old caches.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for same-origin, stale-while-revalidate for CDN.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (isSameOrigin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          // Cache successful responses we didn't pre-list
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }).catch(() => cached);
      })
    );
    return;
  }

  // Cross-origin (Pyodide, fonts): stale-while-revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
