// The cache name
const CACHE_NAME = 'afk-cache-v1';

const CACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  // '/bundle.js',
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching app shell');
      return cache.addAll(CACHE_ASSETS);
    }),
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('Deleting old cache:', name);
            return caches.delete(name);
          }
        }),
      );
    }),
  );
});

// Fetch event - serve cached files or fetch from network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Check if we already have the requested resource in cache
      if (response) {
        return response; // Return cached version
      }
      // Else fetch from the network
      return fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          // Cache the new response
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      });
    }),
  );
});
