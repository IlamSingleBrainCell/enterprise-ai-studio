/**
 * Service Worker for Macquarie CGM Post Trade Platform
 * Provides offline capability and caching strategies
 */

const CACHE_NAME = 'macquarie-pt-v1.0.0';
const RUNTIME_CACHE = 'macquarie-pt-runtime';

// Core assets to cache immediately
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/src/css/base.css',
  '/src/css/layout.css',
  '/src/css/components.css',
  '/src/css/features.css',
  '/src/css/dora-space.css',
  '/src/js/app.js',
  '/src/js/tab-manager.js',
  '/src/js/notification-manager.js',
  '/src/js/dora-metrics.js',
  '/src/js/project-form-manager.js',
  '/src/js/space-framework.js',
  '/src/js/tab-content.js',
  '/manifest.json'
];

// Install event - cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Core assets cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Failed to cache core assets', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          console.log('Service Worker: Serving from cache', event.request.url);
          return cachedResponse;
        }

        // Clone the request because it's a stream that can only be consumed once
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then(response => {
            // Check if response is valid
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response because it's a stream that can only be consumed once
            const responseToCache = response.clone();

            // Cache the response for runtime
            caches.open(RUNTIME_CACHE)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.log('Service Worker: Fetch failed, serving offline fallback', error);
            
            // Return a custom offline page for navigation requests
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
            
            // For other requests, you might want to return a default response
            return new Response('Offline - Content not available', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Background sync for form submissions
self.addEventListener('sync', event => {
  if (event.tag === 'project-form-sync') {
    event.waitUntil(
      // Handle offline form submissions when back online
      handleOfflineFormSubmissions()
    );
  }
});

// Push notification handler
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/src/assets/icons/pwa-192x192.png',
    badge: '/src/assets/icons/pwa-64x64.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Dashboard',
        icon: '/src/assets/icons/pwa-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/src/assets/icons/pwa-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Macquarie Post Trade Platform', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});

// Handle offline form submissions
async function handleOfflineFormSubmissions() {
  try {
    // This would typically read from IndexedDB or localStorage
    // where offline form data was stored
    console.log('Service Worker: Handling offline form submissions');
    
    // Example: retrieve offline submissions and send them
    // const offlineSubmissions = await getOfflineSubmissions();
    // for (const submission of offlineSubmissions) {
    //   await submitForm(submission);
    // }
  } catch (error) {
    console.error('Service Worker: Failed to handle offline submissions', error);
  }
}

// Update notification for new versions
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('Service Worker: Script loaded');