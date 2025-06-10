// Service Worker para aplicação offline
const CACHE_NAME = 'granduvale-offline-v3';
const STATIC_CACHE_NAME = 'granduvale-static-v3';
const OFFLINE_URL = '/offline.html';

// URLs estáticas que serão cacheadas para uso offline
const STATIC_URLS = [
  '/',
  '/index.html',
  OFFLINE_URL,
  '/manifest.json'
];

// Extensões de arquivo para recursos estáticos que devem ser cacheados automaticamente
const STATIC_EXTENSIONS = [
  '.js',
  '.css',
  '.jpg',
  '.jpeg',
  '.png',
  '.svg',
  '.webp',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot'
];

// URLs de API que não devem ser cacheadas (serão tratadas por IndexedDB)
const API_PATHS = [
  '/api/'
];

// Controle para evitar cache excessivo
let lastCacheRequest = '';
let cacheRequestCount = 0;

// Instalação do service worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cacheando recursos estáticos...');
        return cache.addAll(STATIC_URLS);
      })
      .then(() => {
        console.log('[Service Worker] Skip waiting...');
        return self.skipWaiting();
      })
  );
});

// Ativação do service worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] Ativando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
            console.log('[Service Worker] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Reivindicando controle...');
      return self.clients.claim();
    })
  );
});

// Função para verificar se é uma URL de API
function isApiUrl(url) {
  return API_PATHS.some(path => url.includes(path));
}

// Função para verificar se é um recurso estático baseado na extensão
function isStaticResource(url) {
  const urlObj = new URL(url);
  return STATIC_EXTENSIONS.some(ext => urlObj.pathname.endsWith(ext));
}

// Interceptação de requisições fetch
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(event.request.url);

  // Verificar se é uma requisição de API - passar diretamente para o app tratar
  if (isApiUrl(event.request.url)) {
    // Para API, não interfere (o app usará IndexedDB para cache)
    return;
  }

  // Se for uma requisição estática, usar estratégia Cache First
  if (isStaticResource(event.request.url) || STATIC_URLS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // Retornar do cache, mas fazer fetch em background para atualizar (stale-while-revalidate)
            fetch(event.request)
              .then(response => {
                if (response && response.status === 200) {
                  const responseToCache = response.clone();
                  caches.open(STATIC_CACHE_NAME)
                    .then(cache => cache.put(event.request, responseToCache))
                    .catch(error => {
                      console.log('[Service Worker] Erro ao atualizar cache:', error);
                    });
                }
              })
              .catch(error => {
                console.log('[Service Worker] Erro ao fazer fetch em background:', error);
              });

            return cachedResponse;
          }

          // Se não estiver no cache, buscar na rede
          return fetch(event.request)
            .then(response => {
              if (!response || response.status !== 200 || !response.ok) {
                return response;
              }

              const responseToCache = response.clone();

              caches.open(STATIC_CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                })
                .catch(error => {
                  console.log('[Service Worker] Cache put failed:', error);
                });

              return response;
            })
            .catch(error => {
              console.log('[Service Worker] Fetch failed:', error);
              throw error;
            });
        })
    );
    return;
  }

  // Para navegação e outros recursos, usar estratégia Network First com fallback melhorado
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Se a resposta for válida, armazenar no cache
        if (response && response.status === 200) {
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            })
            .catch(error => {
              console.log('[Service Worker] Erro ao salvar no cache:', error);
            });
        }

        return response;
      })
      .catch(async error => {
        console.log('[Service Worker] Falha na rede, tentando cache para:', event.request.url);

        const cachedResponse = await caches.match(event.request);

        if (cachedResponse) {
          return cachedResponse;
        }

        // Para navegação, primeiro tentar servir a aplicação principal do cache
        if (event.request.mode === 'navigate') {
          // Tentar servir a página principal da aplicação primeiro
          const mainAppResponse = await caches.match('/');
          if (mainAppResponse) {
            console.log('[Service Worker] Servindo aplicação principal do cache para navegação offline');
            return mainAppResponse;
          }

          // Se não houver cache da app principal, mostrar página offline
          const offlineResponse = await caches.match(OFFLINE_URL);
          if (offlineResponse) {
            return offlineResponse;
          }

          return new Response('App não disponível offline', {
            status: 503,
            statusText: 'Serviço indisponível'
          });
        }

        return new Response('Recurso não disponível offline', {
          status: 503,
          statusText: 'Serviço indisponível'
        });
      })
  );
});

// Ouvir mensagens do cliente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CACHE_PAGE') {
    const url = event.data.url || '/';
    const fullUrl = self.location.origin + url;

    // Verificar se já não estamos cacheando a mesma URL repetidamente
    if (lastCacheRequest === fullUrl) {
      cacheRequestCount++;
      if (cacheRequestCount > 3) {
        console.log('[Service Worker] Limitando cache excessivo para:', url);
        return;
      }
    } else {
      lastCacheRequest = fullUrl;
      cacheRequestCount = 1;
    }

    console.log('[Service Worker] Solicitação para cachear página:', fullUrl);

    // Buscar a página e adicioná-la ao cache
    fetch(fullUrl)
      .then(response => {
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              console.log('[Service Worker] Cacheando página:', url);
              cache.put(fullUrl, responseToCache);
            })
            .catch(error => {
              console.error('[Service Worker] Erro ao salvar página no cache:', error);
            });
        }
      })
      .catch(error => {
        console.error('[Service Worker] Erro ao cachear página:', error);
      });
  }

  // Verificar se é uma solicitação para limpar o cache
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[Service Worker] Limpando caches...');

    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log('[Service Worker] Removendo cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('[Service Worker] Todos os caches foram limpos');
      // Notificar cliente que o cache foi limpo
      if (event.source) {
        event.source.postMessage({
          type: 'CACHE_CLEARED',
          success: true
        });
      }
    });
  }

  // Processar mensagem SKIP_WAITING
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Evento de sincronização em segundo plano
self.addEventListener('sync', event => {
  if (event.tag === 'sync-pending-operations') {
    console.log('[Service Worker] Sincronizando operações pendentes...');

    // Notifica a página para sincronizar (ela fará o trabalho real)
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'START_SYNC'
        });
      });
    });
  }
});

// Verificação periódica reduzida e mais inteligente
let lastSyncCheck = 0;
const SYNC_CHECK_INTERVAL = 300000; // 5 minutos

setInterval(() => {
  const now = Date.now();

  // Só verificar se passou tempo suficiente desde a última verificação
  if (now - lastSyncCheck < SYNC_CHECK_INTERVAL) {
    return;
  }

  if (navigator.onLine) {
    console.log('[Service Worker] Verificação periódica de sincronização');
    lastSyncCheck = now;

    self.clients.matchAll().then(clients => {
      if (clients.length > 0) {
        // Verificar se algum cliente está ativo antes de enviar mensagem
        const activeClients = clients.filter(client => 
          client.visibilityState === 'visible' || client.focused
        );

        if (activeClients.length > 0) {
          activeClients[0].postMessage({
            type: 'CHECK_SYNC'
          });
        }
      }
    });
  }
}, 60000); // Verificar a cada minuto, mas só executar a cada 5 minutos