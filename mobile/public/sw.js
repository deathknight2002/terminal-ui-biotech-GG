/**
 * Service Worker for Mobile App - Offline Support
 * 
 * Provides offline functionality with:
 * - Static asset caching (app shell)
 * - Dynamic API response caching
 * - Background sync for offline actions
 * - IndexedDB for structured data storage
 */

const CACHE_NAME = 'biotech-mobile-v1';
const DYNAMIC_CACHE = 'biotech-mobile-dynamic-v1';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// API routes that can be cached
const CACHEABLE_API_ROUTES = [
  '/api/biotech-data/companies',
  '/api/biotech-data/pipeline',
  '/api/market-data/quotes',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW Mobile] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW Mobile] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW Mobile] Activating service worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== DYNAMIC_CACHE)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - network-first for APIs, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Check if this is an API request
  const isApiRequest = url.pathname.startsWith('/api/');
  const isCacheableApi = CACHEABLE_API_ROUTES.some(route => 
    url.pathname.startsWith(route)
  );

  if (isApiRequest && isCacheableApi) {
    // Network-first strategy for API requests
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response before caching
          const responseClone = response.clone();
          
          // Cache the successful response
          if (response.ok) {
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request)
            .then((cached) => {
              if (cached) {
                console.log('[SW Mobile] Serving API from cache:', url.pathname);
                return cached;
              }
              
              // Return offline response
              return new Response(
                JSON.stringify({
                  error: 'Offline',
                  message: 'You are offline and this data is not cached',
                }),
                {
                  status: 503,
                  headers: { 'Content-Type': 'application/json' },
                }
              );
            });
        })
    );
  } else if (isApiRequest) {
    // Don't cache other API requests, just pass through
    return;
  } else {
    // Cache-first strategy for static assets
    event.respondWith(
      caches.match(request)
        .then((cached) => {
          if (cached) {
            console.log('[SW Mobile] Serving from cache:', request.url);
            return cached;
          }
          
          // Not in cache, fetch from network
          return fetch(request)
            .then((response) => {
              // Cache successful responses
              if (response.ok && request.method === 'GET') {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, responseClone);
                });
              }
              return response;
            })
            .catch(() => {
              // Network failed and not in cache
              if (request.mode === 'navigate') {
                return caches.match('/index.html');
              }
            });
        })
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW Mobile] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-offline-actions') {
    event.waitUntil(syncOfflineActions());
  }
});

// Sync offline actions when back online
async function syncOfflineActions() {
  try {
    console.log('[SW Mobile] Syncing offline actions...');
    
    // Open IndexedDB to get pending actions
    const db = await openDatabase();
    const actions = await getPendingActions(db);
    
    // Process each action
    for (const action of actions) {
      try {
        await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body,
        });
        
        // Remove action from IndexedDB after successful sync
        await removeAction(db, action.id);
        console.log('[SW Mobile] Synced action:', action.id);
      } catch (error) {
        console.error('[SW Mobile] Failed to sync action:', action.id, error);
      }
    }
    
    console.log('[SW Mobile] Offline actions synced');
  } catch (error) {
    console.error('[SW Mobile] Sync failed:', error);
  }
}

// IndexedDB helper functions
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('biotech-mobile-db', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores
      if (!db.objectStoreNames.contains('offline-actions')) {
        db.createObjectStore('offline-actions', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('cached-data')) {
        db.createObjectStore('cached-data', { keyPath: 'key' });
      }
    };
  });
}

function getPendingActions(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offline-actions'], 'readonly');
    const store = transaction.objectStore('offline-actions');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removeAction(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offline-actions'], 'readwrite');
    const store = transaction.objectStore('offline-actions');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Message handler for cache control
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});
