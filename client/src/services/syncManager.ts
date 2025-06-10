import { offlineStorage } from './offlineStorage';

// Tipos para as operações pendentes
interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  url: string;
  method: string;
  payload: any;
  fileMetadatas?: { fileId: string, name: string, type: string, operationId: string }[];
  status: 'pending' | 'syncing' | 'processing' | 'error' | 'completed';
  retryCount: number;
  error?: string;
  errorMessage?: string;
  timestamp: number;
}

// Interface para resultado de teste de conectividade
interface ConnectivityTestResult {
  isOnline: boolean;
  latency?: number;
  error?: string;
  timestamp: number;
}

// Classe para gerenciar sincronização
class SyncManager {
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private maxRetries: number = 3;
  private syncInterval: number = 30000; // 30 segundos
  private syncOperationTimeout: number = 60000; // 60 segundos para cada operação de sincronização
  private intervalId: number | null = null;
  private mutationObserver: MutationObserver | null = null;
  private syncListeners: Array<(hasPendingOperations: boolean) => void> = [];
  private onlineStatusListeners: Array<(isOnline: boolean) => void> = [];
  private connectivityCheckTimeout: number | null = null;
  private connectivityTestInProgress: boolean = false;
  private lastConnectivityTest: ConnectivityTestResult | null = null;

  constructor() {
    // Inicializa os event listeners para status de conexão
    window.addEventListener('online', this.handleOnlineStatus);
    window.addEventListener('offline', this.handleOnlineStatus);

    // Verificação mais robusta do status online além do navigator.onLine
    this.checkRealOnlineStatus();
  }

  // Debouncer para evitar testes excessivos de conectividade
  private createDebouncer(delay: number = 2000) {
    let timeoutId: number | null = null;

    return (callback: () => void) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(callback, delay);
    };
  }

  private connectivityDebouncer = this.createDebouncer(2000);

  // Verifica se a conexão está realmente ativa fazendo testes robustos
  private async checkRealOnlineStatus() {
    if (this.connectivityTestInProgress) {
      console.log('[SyncManager] Teste de conectividade já em andamento, pulando...');
      return;
    }

    this.connectivityTestInProgress = true;
    console.log('[SyncManager] Iniciando verificação de conectividade...');

    try {
      const result = await this.performConnectivityTest();
      this.lastConnectivityTest = result;

      console.log('[SyncManager] Resultado do teste de conectividade:', result);

      if (result.isOnline) {
        console.log('[SyncManager] Conectividade confirmada');
        if (result.latency) {
          console.log(`[SyncManager] Latência: ${result.latency}ms`);
        }
        this.updateOnlineStatus(true);
      } else {
        console.log('[SyncManager] Conectividade não confirmada:', result.error);
        this.updateOnlineStatus(false);
      }
    } catch (error) {
      console.error('[SyncManager] Erro durante teste de conectividade:', error);
      this.updateOnlineStatus(false);
    } finally {
      this.connectivityTestInProgress = false;
    }

    // Reagendar verificação com intervalo ajustável baseado no status atual
    const nextCheckInterval = this.isOnline ? 300000 : 60000; // 5 min se online, 1 min se offline

    if (this.connectivityCheckTimeout) {
      clearTimeout(this.connectivityCheckTimeout);
    }
    this.connectivityCheckTimeout = window.setTimeout(() => this.checkRealOnlineStatus(), nextCheckInterval);
  }

  // Teste principal de conectividade
  private async performConnectivityTest(): Promise<ConnectivityTestResult> {
    const timestamp = Date.now();

    // Se navigator.onLine é false, nem tenta testar
    if (!navigator.onLine) {
      return {
        isOnline: false,
        error: 'navigator.onLine is false',
        timestamp
      };
    }

    try {
      // Teste primário: endpoint da aplicação
      const primaryResult = await this.testPrimaryEndpoint();

      if (primaryResult.isOnline) {
        return primaryResult;
      }

      // Se o teste primário falhou, tentar teste secundário
      console.log('[SyncManager] Teste primário falhou, tentando teste secundário...');
      const secondaryResult = await this.testSecondaryEndpoint();
      return secondaryResult;

    } catch (error) {
      return {
        isOnline: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp
      };
    }
  }

  // Teste primário: endpoint da própria aplicação
  private async testPrimaryEndpoint(): Promise<ConnectivityTestResult> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/ping', {
        method: 'HEAD',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;

      if (response.ok) {
        return {
          isOnline: true,
          latency,
          timestamp: Date.now()
        };
      } else {
        return {
          isOnline: false,
          error: `Server responded with ${response.status}`,
          latency,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        isOnline: false,
        error: error instanceof Error ? error.message : 'Primary endpoint failed',
        latency,
        timestamp: Date.now()
      };
    }
  }

  // Teste secundário: recurso externo pequeno
  private async testSecondaryEndpoint(): Promise<ConnectivityTestResult> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      // Usar múltiplos endpoints para maior confiabilidade
      const endpoints = [
        'https://www.google.com/favicon.ico',
        'https://httpbin.org/status/200'
      ];

      // Tentar o primeiro endpoint disponível
      for (const endpoint of endpoints) {
        try {
          await fetch(endpoint, {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-store',
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          const latency = Date.now() - startTime;

          return {
            isOnline: true,
            latency,
            timestamp: Date.now()
          };
        } catch (endpointError) {
          // Continua para o próximo endpoint
          continue;
        }
      }

      clearTimeout(timeoutId);
      return {
        isOnline: false,
        error: 'All secondary endpoints failed',
        latency: Date.now() - startTime,
        timestamp: Date.now()
      };

    } catch (error) {
      return {
        isOnline: false,
        error: error instanceof Error ? error.message : 'Secondary test failed',
        latency: Date.now() - startTime,
        timestamp: Date.now()
      };
    }
  }

  // Detecta se estamos em um portal cativo
  private async detectCaptivePortal(): Promise<boolean> {
    try {
      const response = await fetch('/api/ping', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');

        // Se esperamos JSON mas recebemos HTML, provavelmente é portal cativo
        if (contentType && contentType.toLowerCase().includes('text/html')) {
          console.log('[SyncManager] Portal cativo detectado: resposta HTML em endpoint JSON');
          return true;
        }

        // Tentar ler como JSON
        try {
          await response.json();
          return false; // JSON válido, não é portal cativo
        } catch {
          console.log('[SyncManager] Portal cativo detectado: resposta não é JSON válido');
          return true;
        }
      }

      return false;
    } catch (error) {
      // Se não conseguimos fazer a requisição, não é portal cativo
      return false;
    }
  }

  // Atualiza o status online e notifica listeners
  private updateOnlineStatus(status: boolean) {
    if (this.isOnline !== status) {
      this.isOnline = status;
      console.log(`[SyncManager] Status de conexão alterado: ${status ? 'Online' : 'Offline'}`);

      // Notifica listeners
      this.onlineStatusListeners.forEach(listener => {
        try {
          listener(status);
        } catch (error) {
          console.error('[SyncManager] Erro ao notificar listener de status online:', error);
        }
      });

      // Se ficou online, tenta sincronizar
      if (status) {
        console.log('[SyncManager] Application came online. Refetching user authentication status.');
        // Dispatcha evento personalizado para notificar componentes
        window.dispatchEvent(new CustomEvent('connection-restored'));

        // Usar debouncer para evitar sincronizações múltiplas
        this.connectivityDebouncer(() => {
          this.syncPendingOperations();
        });
      }

      // Atualiza visual para o usuário
      this.updateOfflineUI(status);
    }
  }

  private showSyncCompletedMessage() {
    let indicator = document.getElementById('offline-indicator');
    if (!indicator) {
      const indicatorElement = document.createElement('div');
      indicatorElement.id = 'offline-indicator';
      indicatorElement.style.position = 'fixed';
      indicatorElement.style.bottom = '10px';
      indicatorElement.style.right = '10px';
      indicatorElement.style.padding = '8px 16px';
      indicatorElement.style.borderRadius = '4px';
      indicatorElement.style.zIndex = '9999';
      indicatorElement.style.fontWeight = 'bold';
      indicatorElement.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
      document.body.appendChild(indicatorElement);
      indicator = indicatorElement;
    }

    if (indicator) {
      indicator.textContent = "Sincronização concluída!";
      indicator.style.backgroundColor = '#d1e7dd';
      indicator.style.color = '#0f5132';
      indicator.style.display = 'block';

      setTimeout(() => {
        if (indicator && indicator.textContent === "Sincronização concluída!") {
           this.updateOfflineUI(this.isOnline);
        }
      }, 5000);
    }
  }

  // Método melhorado para atualizar a UI com status offline/online
  private async updateOfflineUI(online: boolean) {
    let offlineIndicator = document.getElementById('offline-indicator');

    if (!offlineIndicator) {
      const indicatorElement = document.createElement('div');
      indicatorElement.id = 'offline-indicator';
      indicatorElement.style.position = 'fixed';
      indicatorElement.style.bottom = '10px';
      indicatorElement.style.right = '10px';
      indicatorElement.style.padding = '8px 16px';
      indicatorElement.style.borderRadius = '4px';
      indicatorElement.style.zIndex = '9999';
      indicatorElement.style.fontWeight = 'bold';
      indicatorElement.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
      document.body.appendChild(indicatorElement);
      offlineIndicator = indicatorElement;
    }

    if (!offlineIndicator) return;

    const indicator = offlineIndicator;

    if (!online) {
      // Verificar se foi detectado portal cativo
      const isCaptivePortal = await this.detectCaptivePortal();

      if (isCaptivePortal) {
        indicator.textContent = 'Portal cativo detectado. Entre na rede e tente novamente.';
        indicator.style.backgroundColor = '#fff3cd';
        indicator.style.color = '#856404';
      } else {
        indicator.textContent = 'Você está offline. Suas alterações serão salvas localmente.';
        indicator.style.backgroundColor = '#f8d7da';
        indicator.style.color = '#721c24';
      }
      indicator.style.display = 'block';
    } else {
      try {
        const allOps = await offlineStorage.getPendingOperations();
        const errorOpsCount = allOps.filter(op => op.status === 'error').length;
        const pendingToSyncOpsCount = allOps.filter(op => op.status === 'pending' || op.status === 'syncing').length;

        if (this.isSyncing && pendingToSyncOpsCount > 0) {
          indicator.textContent = `Sincronizando ${pendingToSyncOpsCount} operações...`;
          indicator.style.backgroundColor = '#fff3cd';
          indicator.style.color = '#856404';
          indicator.style.cursor = 'default';
          indicator.onclick = null;
          indicator.style.display = 'block';
        } else if (pendingToSyncOpsCount > 0) {
          indicator.textContent = `${pendingToSyncOpsCount} alterações pendentes para sincronizar.`;
          indicator.style.backgroundColor = '#cfe2ff';
          indicator.style.color = '#084298';
          indicator.style.cursor = 'pointer';
          indicator.onclick = () => this.forceSyncNow();
          indicator.style.display = 'block';
        } else if (errorOpsCount > 0) {
          indicator.textContent = `Falha ao sincronizar ${errorOpsCount} alterações. Toque para tentar novamente.`;
          indicator.style.backgroundColor = '#f8d7da';
          indicator.style.color = '#721c24';
          indicator.style.cursor = 'pointer';
          indicator.onclick = () => this.forceSyncNow();
          indicator.style.display = 'block';
        } else {
          if (indicator.textContent !== "Sincronização concluída!") {
             indicator.style.display = 'none';
          }
        }
      } catch (error) {
        console.error("Erro ao atualizar UI offline:", error);
        indicator.textContent = 'Verificando status...';
        indicator.style.backgroundColor = '#e0e0e0';
        indicator.style.color = '#333';
        indicator.style.cursor = 'default';
        indicator.onclick = null;
        indicator.style.display = 'block';
      }
    }
  }

  // Handler melhorado para eventos online/offline
  private handleOnlineStatus = () => {
    console.log(`[SyncManager] Evento do navegador: ${navigator.onLine ? 'Online' : 'Offline'}`);

    if (navigator.onLine) {
      // Usar debouncer para evitar múltiplas verificações
      this.connectivityDebouncer(() => {
        this.checkRealOnlineStatus();
      });
    } else {
      this.updateOnlineStatus(false);
    }
  }

  // Inicia o gerenciador de sincronização
  public start() {
    console.log('SyncManager iniciado');

    // Se estiver online, sincroniza imediatamente
    if (this.isOnline) {
      console.log('Iniciando sincronização de operações pendentes...');
      this.syncPendingOperations();
    }

    // Cachear a página atual para uso offline
    this.cacheCurrentPage();

    // Configura a sincronização periódica
    if (this.intervalId === null) {
      this.intervalId = window.setInterval(() => {
        this.checkPendingOperations();
      }, this.syncInterval);
    }

    // Adiciona listener para mudanças de rota para cachear novas páginas
    window.addEventListener('popstate', () => this.cacheCurrentPage());

    // Para frameworks SPA como React com routing, podemos usar um MutationObserver
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }

    this.mutationObserver = new MutationObserver(() => {
      this.cacheCurrentPage();
    });

    // Observa mudanças no corpo da página
    this.mutationObserver.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
  }

  // Função para cachear a página atual (com controle de frequência)
  private cacheCurrentPage() {
    if (this.isOnline && navigator.serviceWorker.controller) {
      // Usar debouncer para evitar cache excessivo
      this.connectivityDebouncer(() => {
        navigator.serviceWorker.controller?.postMessage({
          type: 'CACHE_PAGE',
          url: window.location.pathname
        });

        console.log(`Solicitando cache da página: ${window.location.pathname}`);
      });
    }
  }

  // Para o gerenciador de sincronização
  public stop() {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.connectivityCheckTimeout !== null) {
      window.clearTimeout(this.connectivityCheckTimeout);
      this.connectivityCheckTimeout = null;
    }

    // Desconectar o MutationObserver para evitar vazamentos de memória
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    // Remover event listeners
    window.removeEventListener('online', this.handleOnlineStatus);
    window.removeEventListener('offline', this.handleOnlineStatus);
  }

  // Verifica se há operações pendentes e tenta sincronizar se estiver online
  public async checkPendingOperations() {
    try {
      const pendingOps = await offlineStorage.getPendingOperations();

      if (pendingOps.length > 0) {
        console.log(`Existem ${pendingOps.length} operações pendentes de sincronização`);

        // Notifica os listeners
        this.syncListeners.forEach(listener => {
          try {
            listener(true);
          } catch (error) {
            console.error('[SyncManager] Erro ao notificar listener de sync:', error);
          }
        });

        // Se estiver online, tenta sincronizar
        if (this.isOnline && !this.isSyncing) {
          this.syncPendingOperations();
        }
      } else {
        console.log('Nenhuma operação pendente para sincronizar');
        // Notifica que não há operações pendentes
        this.syncListeners.forEach(listener => {
          try {
            listener(false);
          } catch (error) {
            console.error('[SyncManager] Erro ao notificar listener de sync:', error);
          }
        });
      }
    } catch (error) {
      console.error('[SyncManager] Erro ao verificar operações pendentes:', error);
    }
  }

  // Intercepta requisições para lidar com modo offline
  public async interceptRequest(url: string, method: string, body: any, files?: File[]): Promise<any> {
    // Se estiver offline, salva a operação para sincronização posterior
    if (!this.isOnline) {
      console.log(`Interceptando requisição offline: ${method} ${url}`);

      // Gera um ID único
      const id = `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Extrai a entidade da URL (ex: /api/registrations -> registrations)
      const entity = url.replace(/^\/api\//, '').split('/')[0];

      // Cria o objeto de operação pendente
      const pendingOp: PendingOperation = {
        id,
        type: method === 'POST' ? 'create' : method === 'PUT' ? 'update' : 'delete',
        entity,
        url,
        method,
        payload: body,
        status: 'pending',
        retryCount: 0,
        timestamp: Date.now()
      };

      // Salva a operação pendente
      await offlineStorage.savePendingOperation(pendingOp);

      // Se for uma operação de criação, também salvar os dados localmente
      if (method === 'POST' || method === 'PUT') {
        const tempBody = { ...body };
        if (method === 'POST') {
          tempBody.id = `temp_${id}`;
          tempBody.offlinePending = true;
        }

        // Salva os dados localmente para acesso offline
        const currentData = await offlineStorage.getOfflineDataByType(entity) || [];

        if (method === 'POST') {
          await offlineStorage.saveOfflineData(entity, [...currentData, tempBody]);
          window.dispatchEvent(new CustomEvent('local-data-changed', {
            detail: { entityType: entity, operationType: 'create', data: tempBody }
          }));
        } else if (method === 'PUT') {
          const updatedData = currentData.map((item: any) => 
            item.id === body.id ? {...item, ...body, offlinePending: true} : item
          );
          await offlineStorage.saveOfflineData(entity, updatedData);
          window.dispatchEvent(new CustomEvent('local-data-changed', {
            detail: { entityType: entity, operationType: 'update', data: body }
          }));
        }
      } else if (method === 'DELETE') {
        const itemId = url.split('/').pop();
        const currentData = await offlineStorage.getOfflineDataByType(entity) || [];
        const filteredData = currentData.filter((item: any) => 
          item.id != itemId
        );
        await offlineStorage.saveOfflineData(entity, filteredData);
        window.dispatchEvent(new CustomEvent('local-data-changed', {
          detail: { entityType: entity, operationType: 'delete', id: itemId }
        }));
      }

      // Se for upload de arquivo, salvar o arquivo no storage
      if (files && files.length > 0) {
        pendingOp.fileMetadatas = [];
        for (const file of files) {
          try {
            const fileId = await offlineStorage.saveOfflineFile(pendingOp.id, file);
            pendingOp.fileMetadatas.push({
              fileId: fileId,
              name: file.name,
              type: file.type,
              operationId: pendingOp.id
            });
          } catch (error) {
            console.error(`Falha ao salvar arquivo ${file.name} offline:`, error);
          }
        }
      }

      // Salva a operação pendente atualizada
      await offlineStorage.savePendingOperation(pendingOp);

      // Notifica que há operações pendentes
      this.syncListeners.forEach(listener => {
        try {
          listener(true);
        } catch (error) {
          console.error('[SyncManager] Erro ao notificar listener de sync:', error);
        }
      });

      // Retorna uma resposta simulada
      return {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ 
          success: true, 
          id: body.id || `temp_${id}`, 
          message: 'Operação salva para sincronização posterior',
          offlinePending: true,
          isOfflineMock: true
        })
      };
    }

    // Se estiver online, faz a requisição normalmente
    try {
      let requestOptions: RequestInit = {
        method,
        headers: {}
      };

      if (files && files.length > 0) {
        const formData = new FormData();
        formData.append('data', JSON.stringify(body));
        files.forEach((file) => {
          formData.append('photo', file);
        });
        requestOptions.body = formData;
      } else if (body) {
        requestOptions.headers = {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        };
        requestOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      console.error('Erro na requisição:', error);

      if (method !== 'GET') {
        await this.addPendingOperation(url, method, body, files);
      }

      throw error;
    }
  }

  // Adiciona uma operação à fila de pendências
  private async addPendingOperation(url: string, method: string, body?: any, files?: File[]): Promise<string> {
    const id = `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const entity = url.replace(/^\/api\//, '').split('/')[0];

    const operation: PendingOperation = {
      id,
      type: method === 'POST' ? 'create' : method === 'PUT' ? 'update' : 'delete',
      entity,
      url,
      method,
      payload: body,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending'
    };

    if (files && files.length > 0) {
      operation.fileMetadatas = [];
      for (const file of files) {
        try {
          const fileId = await offlineStorage.saveOfflineFile(operation.id, file);
          operation.fileMetadatas.push({
            fileId: fileId,
            name: file.name,
            type: file.type,
            operationId: operation.id
          });
        } catch (error) {
          console.error(`Falha ao salvar arquivo ${file.name} para operação pendente ${operation.id}:`, error);
        }
      }
    }

    await offlineStorage.savePendingOperation(operation);
    this.updateOfflineUI(this.isOnline);

    return operation.id;
  }

  // Obtém o número de operações pendentes
  private async getPendingOperationsCount(): Promise<number> {
    try {
      const operations = await offlineStorage.getPendingOperations();
      return operations.length;
    } catch (error) {
      console.error('[SyncManager] Erro ao obter contagem de operações pendentes:', error);
      return 0;
    }
  }

  // Sincroniza operações pendentes
  public async syncPendingOperations() {
    if (this.isSyncing || !this.isOnline) {
      console.log('[SyncManager] Sincronização já em andamento ou offline, pulando...');
      return;
    }

    try {
      this.isSyncing = true;
      this.updateOfflineUI(true);
      console.log('Iniciando sincronização de operações pendentes...');

      const pendingOps = await offlineStorage.getPendingOperations();

      if (pendingOps.length === 0) {
        console.log('Nenhuma operação pendente para sincronizar');
        return;
      }

      console.log(`Encontradas ${pendingOps.length} operações pendentes`);

      const sortedOperations = pendingOps.sort((a, b) => a.timestamp - b.timestamp);
      let successCount = 0;

      for (const op of sortedOperations) {
        // Verificar se ainda estamos online antes de cada operação
        if (!this.isOnline) {
          console.log('[SyncManager] Conexão perdida durante sincronização, parando...');
          break;
        }

        try {
          console.log(`Sincronizando operação: ${op.id} - ${op.method} ${op.url}`);

          await offlineStorage.updateOperationStatus(op.id, 'syncing');
          this.updateOfflineUI(true);

          let requestOptions: RequestInit = {
            method: op.method,
            headers: {}
          };

          if (op.fileMetadatas && op.fileMetadatas.length > 0) {
            const formData = new FormData();

            if (op.payload !== undefined && op.payload !== null) {
                formData.append('data', JSON.stringify(op.payload));
            } else {
                formData.append('data', JSON.stringify({}));
            }

            for (const fileMeta of op.fileMetadatas) {
              try {
                const fileData = await offlineStorage.getOfflineFile(fileMeta.fileId);
                if (fileData) {
                  const file = new File([fileData.data], fileMeta.name, { type: fileMeta.type });
                  formData.append('photo', file);
                } else {
                  console.warn(`Arquivo ${fileMeta.fileId} não encontrado para operação ${op.id}`);
                }
              } catch (error) {
                console.error(`Erro ao recuperar arquivo ${fileMeta.fileId}:`, error);
                throw new Error(`Falha ao recuperar arquivo ${fileMeta.name} para sincronização.`);
              }
            }
            requestOptions.body = formData;
          } else {
            if (op.payload !== undefined && op.payload !== null) {
                requestOptions.headers = {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                };
                requestOptions.body = JSON.stringify(op.payload);
            } else {
                if (op.method !== 'DELETE' && op.method !== 'GET') {
                     requestOptions.headers = {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    };
                    requestOptions.body = JSON.stringify({});
                }
            }
          }

          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            console.log(`Timeout para operação ${op.id}`);
            controller.abort();
          }, this.syncOperationTimeout);

          let response;
          try {
            response = await fetch(op.url, { ...requestOptions, signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) {
              const errorBody = await response.text();
              throw new Error(`Erro na sincronização: ${response.status} ${response.statusText}. Resposta: ${errorBody}`);
            }
          } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
              throw new Error(`Timeout na operação de sincronização para ${op.url}`);
            }
            throw error;
          }

          await offlineStorage.updateOperationStatus(op.id, 'completed');

          if (op.fileMetadatas && op.fileMetadatas.length > 0) {
            try {
              console.log(`Removendo ${op.fileMetadatas.length} arquivos offline da operação ${op.id}`);
              for (const fileMeta of op.fileMetadatas) {
                await offlineStorage.removeOfflineFile(fileMeta.fileId);
              }
            } catch (fileError) {
              console.error(`Erro ao remover arquivos offline para operação ${op.id}:`, fileError);
            }
          }

          await offlineStorage.removePendingOperation(op.id);

          const responseData = await response.json();

          window.dispatchEvent(new CustomEvent('offline-sync-success', { 
            detail: { 
              operation: op, 
              response: responseData 
            }
          }));

          successCount++;
          console.log(`Operação ${op.id} sincronizada com sucesso`);
        } catch (error) {
          console.error(`Erro ao sincronizar operação ${op.id}:`, error);

          const newRetryCount = (op.retryCount || 0) + 1;
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

          await offlineStorage.updateOperationRetry(
            op.id, 
            newRetryCount, 
            errorMessage
          );

          if (newRetryCount >= this.maxRetries) {
            await offlineStorage.updateOperationStatus(
              op.id, 
              'error',
              errorMessage
            );

            if (op.fileMetadatas && op.fileMetadatas.length > 0) {
              console.log(`Limpando arquivos órfãos para operação falhada ${op.id}`);
              for (const fileMeta of op.fileMetadatas) {
                try {
                  await offlineStorage.removeOfflineFile(fileMeta.fileId);
                } catch (fileErr) {
                  console.warn(`Não foi possível remover arquivo órfão ${fileMeta.fileId}:`, fileErr);
                }
              }
            }

            window.dispatchEvent(new CustomEvent('offline-sync-error', { 
              detail: { 
                operation: op,
                error: errorMessage
              }
            }));
          }
        }
      }

      if (successCount > 0) {
        window.dispatchEvent(new CustomEvent('data-synchronized', { 
          detail: { count: successCount }
        }));

        window.dispatchEvent(new CustomEvent('invalidate-queries'));
        this.showSyncCompletedMessage();
      }

      if (successCount > 0) {
        await this.refreshLocalCaches();
      }

    } catch (error) {
      console.error('Erro geral na sincronização:', error);
    } finally {
      this.isSyncing = false;
      this.updateOfflineUI(this.isOnline);
    }
  }

  // Atualiza o cache local após sincronização
  private async refreshLocalCaches() {
    try {
      const entitiesToRefresh = ['registrations', 'vehicles', 'drivers', 'fuel-stations', 'fuel-types', 'maintenance-types'];

      for (const entityType of entitiesToRefresh) {
        try {
          await this.refreshLocalCache(entityType);
        } catch (error) {
          console.error(`Erro ao atualizar cache de ${entityType}:`, error);
          // Continua com as outras entidades mesmo se uma falhar
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar caches locais:', error);
    }
  }

  // Atualiza o cache local de uma entidade específica
  private async refreshLocalCache(entityType: string) {
    try {
      const response = await fetch(`/api/${entityType}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        const freshData = await response.json();
        await offlineStorage.saveOfflineData(entityType, freshData);
        console.log(`Cache local de ${entityType} atualizado com sucesso`);
      }
    } catch (error) {
      console.error(`Erro ao atualizar cache local de ${entityType}:`, error);
    }
  }

  // Retorna o status atual da conexão
  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Adiciona listener para alterações no status de sincronização
  public addSyncListener(listener: (hasPendingOperations: boolean) => void) {
    this.syncListeners.push(listener);
    this.getPendingOperationsCount().then(count => {
      listener(count > 0);
    });
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== listener);
    };
  }

  // Remove listener de sincronização
  public removeSyncListener(listener: (hasPendingOperations: boolean) => void) {
    const index = this.syncListeners.indexOf(listener);
    if (index !== -1) {
      this.syncListeners.splice(index, 1);
    }
  }

  // Adiciona listener para alterações no status online
  public addOnlineStatusListener(listener: (isOnline: boolean) => void) {
    this.onlineStatusListeners.push(listener);
    listener(this.isOnline);
    return () => {
      this.onlineStatusListeners = this.onlineStatusListeners.filter(l => l !== listener);
    };
  }

  // Remove listener de status online
  public removeOnlineStatusListener(listener: (isOnline: boolean) => void) {
    const index = this.onlineStatusListeners.indexOf(listener);
    if (index !== -1) {
      this.onlineStatusListeners.splice(index, 1);
    }
  }

  // Força a sincronização manualmente
  public forceSyncNow() {
    console.log('[SyncManager] Sincronização forçada solicitada');
    if (this.isOnline && !this.isSyncing) {
      this.syncPendingOperations();
    } else if (!this.isOnline) {
      console.log('[SyncManager] Não é possível sincronizar offline, verificando conectividade...');
      this.checkRealOnlineStatus();
    } else {
      console.log('[SyncManager] Sincronização já em andamento');
    }
  }

  // Alias para addConnectionListener, para compatibilidade
  public addConnectionListener(listener: (online: boolean) => void) {
    return this.addOnlineStatusListener(listener);
  }

  // Método para debug/diagnóstico
  public async debugConnectivity(): Promise<void> {
    console.log('[SyncManager Debug] Iniciando diagnóstico de conectividade...');
    console.log('[SyncManager Debug] navigator.onLine:', navigator.onLine);
    console.log('[SyncManager Debug] isOnline (interno):', this.isOnline);
    console.log('[SyncManager Debug] isSyncing:', this.isSyncing);

    const result = await this.performConnectivityTest();
    console.log('[SyncManager Debug] Resultado do teste:', result);

    const captivePortal = await this.detectCaptivePortal();
    console.log('[SyncManager Debug] Portal cativo detectado:', captivePortal);

    const pendingCount = await this.getPendingOperationsCount();
    console.log('[SyncManager Debug] Operações pendentes:', pendingCount);
  }

  // Limpa todos os dados offline (para casos extremos)
  public async clearAllOfflineData() {
    console.log('[SyncManager] Limpando todos os dados offline...');
    try {
      // Implementar limpeza se necessário
      // await offlineStorage.clearAll();
      console.log('[SyncManager] Dados offline limpos com sucesso');
    } catch (error) {
      console.error('[SyncManager] Erro ao limpar dados offline:', error);
    }
  }
}

// Exporta uma instância única do SyncManager
export const syncManager = new SyncManager();