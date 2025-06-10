// Service Worker para aplicação offline
const CACHE_NAME = 'granduvale-offline-v4'; // Incrementado versão para forçar atualização
const STATIC_CACHE_NAME = 'granduvale-static-v4';
const OFFLINE_URL = '/offline.html';

// URLs estáticas que serão cacheadas para uso offline
const STATIC_URLS = [
  '/',
  '/index.html',
  '/manifest.json'
  // Removido OFFLINE_URL pois pode não existir
];

// Extensões de arquivo para recursos estáticos
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

// URLs de API que não devem ser cacheadas
const API_PATHS = [
  '/api/'
];

// Instalação do service worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalando v4...');

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Tentando cachear recursos estáticos...');
        // Adicionar cada URL individualmente para melhor tratamento de erros
        return Promise.all(
          STATIC_URLS.map(url => {
            return cache.add(url).catch(err => {
              console.warn(`[Service Worker] Falha ao cachear ${url}:`, err);
              // Não falhar toda a instalação se um recurso falhar
              return Promise.resolve();
            });
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Instalação completa, ativando imediatamente...');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[Service Worker] Erro durante instalação:', err);
      })
  );
});

// Ativação do service worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] Ativando v4...');

  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Remover todos os caches antigos
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
              console.log('[Service Worker] Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Ativação completa, reivindicando clientes...');
        return self.clients.claim();
      })
      .catch(err => {
        console.error('[Service Worker] Erro durante ativação:', err);
      })
  );
});

// Função para verificar se é uma URL de API
function isApiUrl(url) {
  return API_PATHS.some(path => url.includes(path));
}

// Função para verificar se é um recurso estático
function isStaticResource(url) {
  try {
    const urlObj = new URL(url);
    return STATIC_EXTENSIONS.some(ext => urlObj.pathname.endsWith(ext));
  } catch (e) {
    return false;
  }
}

// Interceptação de requisições fetch
self.addEventListener('fetch', event => {
  // Skip requisições que não são do mesmo domínio
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip requisições de API
  if (isApiUrl(event.request.url)) {
    return;
  }

  // Para requisições de navegação (páginas HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Se conseguiu buscar online, retorna e atualiza o cache
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              })
              .catch(err => {
                console.warn('[Service Worker] Erro ao cachear resposta:', err);
              });
          }
          return response;
        })
        .catch(error => {
          // Se falhou, tenta o cache
          console.log('[Service Worker] Navegação offline, tentando cache...');
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Se não tem no cache, tenta a página principal
              return caches.match('/');
            });
        })
    );
    return;
  }

  // Para recursos estáticos
  if (isStaticResource(event.request.url)) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          // Se tem no cache, retorna do cache
          if (cachedResponse) {
            // Faz fetch em background para atualizar o cache (stale-while-revalidate)
            fetch(event.request)
              .then(response => {
                if (response && response.status === 200) {
                  const responseToCache = response.clone();
                  caches.open(STATIC_CACHE_NAME)
                    .then(cache => {
                      cache.put(event.request, responseToCache);
                    })
                    .catch(err => {
                      console.warn('[Service Worker] Erro ao atualizar cache:', err);
                    });
                }
              })
              .catch(() => {
                // Ignora erros de atualização em background
              });

            return cachedResponse;
          }

          // Se não tem no cache, busca na rede
          return fetch(event.request)
            .then(response => {
              if (response && response.status === 200) {
                const responseToCache = response.clone();
                caches.open(STATIC_CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseToCache);
                  })
                  .catch(err => {
                    console.warn('[Service Worker] Erro ao cachear:', err);
                  });
              }
              return response;
            });
        })
        .catch(error => {
          console.error('[Service Worker] Erro ao buscar recurso:', error);
          // Retorna uma resposta de erro mais amigável
          return new Response('Recurso não disponível offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        })
    );
    return;
  }

  // Para outras requisições, tenta network first
  event.respondWith(
    fetch(event.request)
      .then(response => {
        return response;
      })
      .catch(error => {
        // Se falhou, tenta o cache
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Se não tem no cache, retorna erro
            return new Response('Recurso não disponível offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Listener para mensagens do cliente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Skip waiting solicitado');
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[Service Worker] Limpando todos os caches...');

    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log('[Service Worker] Removendo cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('[Service Worker] Caches limpos com sucesso');
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: true });
      }
    }).catch(err => {
      console.error('[Service Worker] Erro ao limpar caches:', err);
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: false, error: err.message });
      }
    });
  }
});

// Sincronização em background
self.addEventListener('sync', event => {
  if (event.tag === 'sync-pending-operations') {
    console.log('[Service Worker] Evento de sincronização recebido');

    event.waitUntil(
      self.clients.matchAll()
        .then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'START_SYNC'
            });
          });
        })
    );
  }
});

// Log para debug
console.log('[Service Worker] Script carregado. Versão: v4');