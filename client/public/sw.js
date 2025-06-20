// Service Worker for Vehicle Tracker PWA
const CACHE_NAME = 'vehicle-tracker-v1';
const API_CACHE_NAME = 'vehicle-tracker-api-v1';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.svg',
  '/icon-512x512.svg',
  // Add other static assets as needed
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/vehicles',
  '/api/drivers',
  '/api/gas-stations',
  '/api/fuel-types',
  '/api/maintenance-types',
  '/api/fuel-records',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install event');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached successfully');
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Cache cleanup completed');
      // Take control of all clients
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  event.respondWith(handleStaticRequest(request));
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const cache = await caches.open(API_CACHE_NAME);

  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
      
      // Notify clients that data is available
      notifyClients({
        type: 'NETWORK_SUCCESS',
        url: url.pathname,
        timestamp: Date.now()
      });
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache for', url.pathname);
    
    // Try cache as fallback
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Notify clients that we're using cached data
      notifyClients({
        type: 'CACHE_USED',
        url: url.pathname,
        timestamp: Date.now()
      });
      
      return cachedResponse;
    }
    
    // If no cache, return error response
    notifyClients({
      type: 'OFFLINE_ERROR',
      url: url.pathname,
      timestamp: Date.now()
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Offline: Dados não disponíveis',
        offline: true 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

// Handle static requests with cache-first strategy
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Failed to fetch static asset', request.url);
    
    // Return fallback for navigation requests
    if (request.mode === 'navigate') {
      const fallbackResponse = await cache.match('/');
      if (fallbackResponse) {
        return fallbackResponse;
      }
    }
    
    throw error;
  }
}

// Notify clients about service worker events
function notifyClients(message) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage(message);
    });
  });
}

// Handle background sync
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync event', event.tag);
  
  if (event.tag === 'fuel-record-sync') {
    event.waitUntil(syncFuelRecords());
  }
});

// Sync fuel records when online
async function syncFuelRecords() {
  try {
    console.log('Service Worker: Syncing fuel records');
    
    // Get pending records from IndexedDB or cache
    const pendingRecords = await getPendingRecords();
    
    if (pendingRecords.length === 0) {
      console.log('Service Worker: No pending records to sync');
      return;
    }
    
    // Sync each record
    for (const record of pendingRecords) {
      try {
        const response = await fetch('/api/fuel-records', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(record.data),
        });
        
        if (response.ok) {
          // Remove from pending list
          await removePendingRecord(record.id);
          console.log('Service Worker: Synced record', record.id);
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync record', record.id, error);
      }
    }
    
    // Notify clients about sync completion
    notifyClients({
      type: 'SYNC_COMPLETED',
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Service Worker: Background sync failed', error);
  }
}

// Placeholder functions for pending records management
// These would integrate with your offline storage system
async function getPendingRecords() {
  // Implementation would depend on your offline storage strategy
  return [];
}

async function removePendingRecord(id) {
  // Implementation would depend on your offline storage strategy
  console.log('Removing pending record', id);
}

// Handle push notifications (if implemented)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received');
  
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Nova notificação do Vehicle Tracker',
      icon: '/icon-192x192.svg',
      badge: '/icon-192x192.svg',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/',
        timestamp: Date.now(),
      },
      actions: [
        {
          action: 'open',
          title: 'Abrir',
          icon: '/icon-192x192.svg',
        },
        {
          action: 'close',
          title: 'Fechar',
        },
      ],
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Vehicle Tracker', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click event');
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    const url = event.notification.data?.url || '/';
    
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        // Check if app is already open
        const existingClient = clients.find(client => {
          const clientUrl = new URL(client.url);
          return clientUrl.origin === self.location.origin;
        });
        
        if (existingClient) {
          // Focus existing window and navigate to URL
          existingClient.focus();
          existingClient.navigate(url);
        } else {
          // Open new window
          self.clients.openWindow(url);
        }
      })
    );
  }
});

console.log('Service Worker: Loaded successfully');
