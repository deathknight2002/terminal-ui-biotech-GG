/**
 * Service Worker - Static Assets Only (Manual Refresh Model)
 * 
 * This service worker ONLY caches static build assets (app shell).
 * It does NOT:
 * - Intercept API routes
 * - Use Periodic Background Sync
 * - Use Background Fetch
 * - Prefetch dynamic data
 * 
 * Safari/iOS 26 compatible - no experimental features.
 */

const CACHE_NAME = 'biotech-terminal-static-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip API routes - never cache dynamic data
  if (url.pathname.startsWith('/api/')) {
    return; // Let it pass through to network
  }

  // For static assets, try cache first, then network
  event.respondWith(
    caches.match(request)
      .then((cached) => {
        if (cached) {
          console.log('[SW] Serving from cache:', request.url);
          return cached;
        }
        
        // Not in cache, fetch from network
        return fetch(request)
          .then((response) => {
            // Only cache successful responses for static assets
            if (response.ok && request.method === 'GET') {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseClone);
                });
            }
            return response;
          });
      })
      .catch(() => {
        // Network failed, return offline page if available
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      })
  );
});
