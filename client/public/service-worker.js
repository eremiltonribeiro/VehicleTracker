// Nome do cache
const CACHE_NAME = 'gestao-frota-v2';
const DATA_CACHE_NAME = 'gestao-frota-data-v2';

// Arquivos para pré-cache
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/index.css',
  '/assets/index.js'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Força o service worker a se tornar ativo imediatamente
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto com sucesso');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Erro ao abrir cache:', error);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME, DATA_CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Limpando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim()) // Assume o controle de todos os clientes
  );
});

// Estratégia de cache: Cache First com Network Fallback para arquivos estáticos
// Network First com Cache Fallback para APIs
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Estratégia específica para APIs
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clonar e armazenar a resposta no cache
          const responseToCache = response.clone();
          caches.open(DATA_CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          return response;
        })
        .catch(() => {
          // Em caso de falha na network, tenta buscar do cache
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Se não tiver no cache, retorna uma resposta especial para APIs
              return new Response(JSON.stringify({ 
                offline: true, 
                message: 'Você está offline. Os dados não estão disponíveis.' 
              }), {
                headers: { 'Content-Type': 'application/json' }
              });
            });
        })
    );
    return;
  }
  
  // Para recursos estáticos, usar Cache First
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Se não estiver no cache, busca na rede
        return fetch(event.request)
          .then(response => {
            // Não faz cache de respostas falhas
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clonar e armazenar no cache
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          })
          .catch(error => {
            console.error('Fetch falhou:', error);
            
            // Para navegação, retornar a página offline
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html')
                .then(response => {
                  return response || new Response('Você está offline e a página não está disponível.', {
                    headers: { 'Content-Type': 'text/html' }
                  });
                });
            }
            
            // Propagar o erro para outros tipos de solicitação
            throw error;
          });
      })
  );
});

// Escutar mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Armazenar registros offline para sincronização posterior
  if (event.data && event.data.type === 'STORE_OFFLINE_REGISTRATION') {
    // Registramos a sincronização para quando a rede voltar
    self.registration.sync.register('sync-registrations');
    
    // Podemos responder de volta ao cliente
    event.ports[0].postMessage({
      status: 'success',
      message: 'Registro armazenado para sincronização posterior'
    });
  }
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
    // Abrir mensagem para todos os clientes
    const clients = await self.clients.matchAll();
    
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_STARTED'
      });
    });
    
    // Pedir ao cliente as informações de itens pendentes
    // Isso é feito via messageChannel (avançado)
    const pendingItems = await getPendingItemsFromClient();
    
    if (!pendingItems || pendingItems.length === 0) {
      console.log('Sem itens pendentes para sincronizar');
      return;
    }
    
    console.log(`Sincronizando ${pendingItems.length} registros pendentes`);
    
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
          // Notificar o cliente sobre o sucesso
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_SUCCESS',
              id: item.id
            });
          });
          
          return { success: true, id: item.id };
        } else {
          console.error('Erro na sincronização de item:', item.id);
          return { success: false, id: item.id };
        }
      } catch (error) {
        console.error('Exception durante sincronização:', error);
        return { success: false, id: item.id, error };
      }
    });
    
    const results = await Promise.all(syncPromises);
    
    // Notificar sobre o término da sincronização
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETED',
        results
      });
    });
    
    return results;
  } catch (error) {
    console.error('Erro durante a sincronização:', error);
    
    // Notificar os clientes sobre o erro
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_ERROR',
        error: error.message
      });
    });
    
    return Promise.reject(error);
  }
}

// Função para obter itens pendentes do cliente via messageChannel
async function getPendingItemsFromClient() {
  const clients = await self.clients.matchAll();
  
  if (clients.length === 0) {
    return [];
  }
  
  // Usar o primeiro cliente disponível
  const client = clients[0];
  
  return new Promise(resolve => {
    // Criar um canal de mensagem para comunicação bidirecional
    const messageChannel = new MessageChannel();
    
    // Configurar resposta
    messageChannel.port1.onmessage = event => {
      if (event.data && event.data.pendingItems) {
        resolve(event.data.pendingItems);
      } else {
        resolve([]);
      }
    };
    
    // Enviar mensagem ao cliente
    client.postMessage({
      type: 'GET_PENDING_ITEMS'
    }, [messageChannel.port2]);
    
    // Timeout para evitar bloqueio
    setTimeout(() => resolve([]), 3000);
  });
}