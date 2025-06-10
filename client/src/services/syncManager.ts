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

  constructor() {
    // Inicializa os event listeners para status de conexão
    window.addEventListener('online', this.handleOnlineStatus);
    window.addEventListener('offline', this.handleOnlineStatus);

    // Verificação mais robusta do status online além do navigator.onLine
    this.checkRealOnlineStatus();
  }

  // Verifica se a conexão está realmente ativa fazendo um ping ao servidor
  private async checkRealOnlineStatus() {
    console.log('[SyncManager] Verificando status de conectividade...');

    if (!navigator.onLine) {
      console.log('[SyncManager] Navigator.onLine = false');
      this.updateOnlineStatus(false);
      return;
    }

    console.log('[SyncManager] Navigator.onLine = true, testando conectividade real...');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('[SyncManager] Timeout na verificação de conectividade');
        controller.abort();
      }, 5000);

      // Primeiro teste: endpoint da aplicação
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

      if (response.ok) {
        console.log('[SyncManager] Ping bem-sucedido ao servidor da aplicação');
        this.updateOnlineStatus(true);
      } else {
        console.log(`[SyncManager] Ping falhou com status: ${response.status}`);
        // Tentar teste secundário para verificar se é um problema do servidor vs conectividade
        await this.performSecondaryConnectivityTest();
      }
    } catch (error) {
      console.log('[SyncManager] Erro no ping primário:', error);
      // Se o ping primário falhou, tentar teste secundário
      await this.performSecondaryConnectivityTest();
    }

    // Reagendar verificação com intervalo maior
    if (this.connectivityCheckTimeout) {
      clearTimeout(this.connectivityCheckTimeout);
    }
    this.connectivityCheckTimeout = window.setTimeout(() => this.checkRealOnlineStatus(), 300000); // A cada 5 minutos
  }

  // Teste secundário de conectividade usando recursos externos
  private async performSecondaryConnectivityTest() {
    console.log('[SyncManager] Executando teste secundário de conectividade...');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      // Teste com recurso externo pequeno
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('[SyncManager] Teste secundário: conectividade externa confirmada');
      this.updateOnlineStatus(true);
    } catch (error) {
      console.log('[SyncManager] Teste secundário falhou:', error);
      this.updateOnlineStatus(false);
    }
  }

  // Atualiza o status online e notifica listeners
  private updateOnlineStatus(status: boolean) {
    if (this.isOnline !== status) {
      this.isOnline = status;
      console.log(`[SyncManager] Status de conexão alterado: ${status ? 'Online' : 'Offline'}`);

      // Notifica listeners
      this.onlineStatusListeners.forEach(listener => listener(status));

      // Se ficou online, tenta sincronizar
      if (status) {
        this.syncPendingOperations();
      }

      // Atualiza visual para o usuário
      this.updateOfflineUI(status);
    }
  }

  private showSyncCompletedMessage() {
    let indicator = document.getElementById('offline-indicator');
    if (!indicator) {
      // Se por algum motivo o indicador não existir, cria-o.
      const indicatorElement = document.createElement('div');
      indicatorElement.id = 'offline-indicator';
      indicatorElement.style.position = 'fixed';
      indicatorElement.style.bottom = '10px';
      indicatorElement.style.right = '10px';
      indicatorElement.style.padding = '8px 16px';
      indicatorElement.style.borderRadius = '4px';
      indicatorElement.style.zIndex = '9999';
      indicatorElement.style.fontWeight = 'bold';
      document.body.appendChild(indicatorElement);
      indicator = indicatorElement;
    }

    if (indicator) {
      indicator.textContent = "Sincronização concluída!";
      indicator.style.backgroundColor = '#d1e7dd'; // Verde sucesso
      indicator.style.color = '#0f5132';
      indicator.style.display = 'block';

      setTimeout(() => {
        if (indicator && indicator.textContent === "Sincronização concluída!") {
           this.updateOfflineUI(this.isOnline);
        }
      }, 5000);
    }
  }

  // Método para atualizar a UI com status offline/online
  private async updateOfflineUI(online: boolean) {
    // Atualiza a interface para mostrar status
    let offlineIndicator = document.getElementById('offline-indicator');

    if (!offlineIndicator) {
      // Cria o indicador se não existir
      const indicatorElement = document.createElement('div');
      indicatorElement.id = 'offline-indicator';
      indicatorElement.style.position = 'fixed';
      indicatorElement.style.bottom = '10px';
      indicatorElement.style.right = '10px';
      indicatorElement.style.padding = '8px 16px';
      indicatorElement.style.borderRadius = '4px';
      indicatorElement.style.zIndex = '9999';
      indicatorElement.style.fontWeight = 'bold';
      document.body.appendChild(indicatorElement);
      offlineIndicator = indicatorElement;
    }

    if (!offlineIndicator) return;

    const indicator = offlineIndicator;

    if (!online) {
      indicator.textContent = 'Você está offline. Suas alterações serão salvas localmente.';
      indicator.style.backgroundColor = '#f8d7da';
      indicator.style.color = '#721c24';
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
          indicator.style.display = 'block';
        } else if (pendingToSyncOpsCount > 0) {
          indicator.textContent = `${pendingToSyncOpsCount} alterações pendentes para sincronizar.`;
          indicator.style.backgroundColor = '#cfe2ff';
          indicator.style.color = '#084298';
          indicator.style.display = 'block';
        } else if (errorOpsCount > 0) {
          indicator.textContent = `Falha ao sincronizar ${errorOpsCount} alterações. Verifique os detalhes.`;
          indicator.style.backgroundColor = '#f8d7da';
          indicator.style.color = '#721c24';
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
        indicator.style.display = 'block';
      }
    }
  }

  // Handler para eventos online/offline
  private handleOnlineStatus = () => {
    console.log(`[SyncManager] Evento do navegador: ${navigator.onLine ? 'Online' : 'Offline'}`);
    if (navigator.onLine) {
      // Verificação adicional da conexão real
      this.checkRealOnlineStatus();
    } else {
      this.updateOnlineStatus(false);
    }
  }

  // Inicia o gerenciador de sincronização
  public start() {
    console.log('SyncManager iniciado');

    // Se estiver online, sincroniza imediatamente
    if (this.isOnline) {
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

  // Função para cachear a página atual
  private cacheCurrentPage() {
    if (this.isOnline && navigator.serviceWorker.controller) {
      // Envia mensagem para o service worker cachear esta página
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_PAGE',
        url: window.location.pathname
      });

      console.log(`Solicitando cache da página: ${window.location.pathname}`);
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
  }

  // Verifica se há operações pendentes e tenta sincronizar se estiver online
  public async checkPendingOperations() {
    const pendingOps = await offlineStorage.getPendingOperations();

    if (pendingOps.length > 0) {
      console.log(`Existem ${pendingOps.length} operações pendentes de sincronização`);

      // Notifica os listeners
      this.syncListeners.forEach(listener => listener(true));

      // Se estiver online, tenta sincronizar
      if (this.isOnline && !this.isSyncing) {
        this.syncPendingOperations();
      }
    } else {
      // Notifica que não há operações pendentes
      this.syncListeners.forEach(listener => listener(false));
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
      this.syncListeners.forEach(listener => listener(true));

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
    const operations = await offlineStorage.getPendingOperations();
    return operations.length;
  }

  // Sincroniza operações pendentes
  public async syncPendingOperations() {
    if (this.isSyncing || !this.isOnline) {
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
      await this.refreshLocalCache('registrations');
      await this.refreshLocalCache('vehicles');
      await this.refreshLocalCache('drivers');
      await this.refreshLocalCache('fuel-stations');
      await this.refreshLocalCache('fuel-types');
      await this.refreshLocalCache('maintenance-types');
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
    if (this.isOnline && !this.isSyncing) {
      this.syncPendingOperations();
    }
  }

  // Alias para addConnectionListener, para compatibilidade
  public addConnectionListener(listener: (online: boolean) => void) {
    return this.addOnlineStatusListener(listener);
  }
}

// Exporta uma instância única do SyncManager
export const syncManager = new SyncManager();