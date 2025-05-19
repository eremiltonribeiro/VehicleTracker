// Nome do cache
const CACHE_NAME = 'gestao-frota-v1';

// Arquivos para pré-cache
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Estratégia de cache: Network First com fallback para cache
self.addEventListener('fetch', (event) => {
  // Ignorar requisições para APIs
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se a resposta for válida, a clone para poder armazenar em cache
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();

        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // Se falhar, busca no cache
        return caches.match(event.request);
      })
  );
});

// Sincronização em segundo plano
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-registrations') {
    event.waitUntil(syncRegistrations());
  }
});

// Função para sincronizar registros pendentes
async function syncRegistrations() {
  try {
    // Buscar registros pendentes do IndexedDB
    const pendingItems = await getPendingItems();
    
    // Enviar cada registro para o servidor
    const syncPromises = pendingItems.map(async (item) => {
      try {
        const response = await fetch('/api/registrations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(item),
        });
        
        if (response.ok) {
          // Se a sincronização for bem-sucedida, remover do IndexedDB
          await removePendingItem(item.id);
          return { success: true, id: item.id };
        } else {
          return { success: false, id: item.id };
        }
      } catch (error) {
        return { success: false, id: item.id, error };
      }
    });
    
    return Promise.all(syncPromises);
  } catch (error) {
    console.error('Erro durante a sincronização:', error);
    return Promise.reject(error);
  }
}

// Funções de apoio para o IndexedDB (serão implementadas pelo cliente)
async function getPendingItems() {
  // Esta função será chamada pelo service worker, mas implementada pelo cliente
  return [];
}

async function removePendingItem(id) {
  // Esta função será chamada pelo service worker, mas implementada pelo cliente
}