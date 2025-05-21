
import { offlineStorage } from './offlineStorage';

// Tipos para as operações pendentes
interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  url: string;
  method: string;
  payload: any;
  files?: any[];
  status: 'pending' | 'syncing' | 'error' | 'completed';
  retryCount: number;
  error?: string;
  timestamp: number;
}

// Classe para gerenciar sincronização
class SyncManager {
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private syncListeners: Array<(status: boolean) => void> = [];
  private onlineStatusListeners: Array<(status: boolean) => void> = [];
  
  constructor() {
    // Inicializa os event listeners para status de conexão
    window.addEventListener('online', this.handleOnlineStatus);
    window.addEventListener('offline', this.handleOnlineStatus);
    
    // Verifica se há operações pendentes periodicamente
    setInterval(() => this.checkPendingOperations(), 30000); // A cada 30 segundos
    
    // Verifica se a conexão está realmente ativa
    this.checkRealOnlineStatus();
  }
  
  // Verifica se a conexão está realmente ativa fazendo um ping ao servidor
  private async checkRealOnlineStatus() {
    if (!navigator.onLine) {
      this.updateOnlineStatus(false);
      return;
    }
    
    try {
      const response = await fetch('/api/ping', { 
        method: 'HEAD',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      this.updateOnlineStatus(response.ok);
    } catch (error) {
      console.log('Erro ao verificar conexão:', error);
      this.updateOnlineStatus(false);
    }
    
    // Reagendar verificação
    setTimeout(() => this.checkRealOnlineStatus(), 60000); // A cada minuto
  }
  
  // Atualiza o status online e notifica listeners
  private updateOnlineStatus(status: boolean) {
    if (this.isOnline !== status) {
      this.isOnline = status;
      console.log(`Status de conexão alterado: ${status ? 'Online' : 'Offline'}`);
      
      // Notifica listeners
      this.onlineStatusListeners.forEach(listener => listener(status));
      
      // Se ficou online, tenta sincronizar
      if (status) {
        this.syncPendingOperations();
      }
    }
  }
  
  // Handler para eventos online/offline
  private handleOnlineStatus = () => {
    console.log(`Evento de navegador: ${navigator.onLine ? 'Online' : 'Offline'}`);
    if (navigator.onLine) {
      // Verificação adicional da conexão real
      this.checkRealOnlineStatus();
    } else {
      this.updateOnlineStatus(false);
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
  public async interceptRequest(url: string, method: string, body: any, files?: any[]): Promise<any> {
    // Se estiver offline, salva a operação para sincronização posterior
    if (!this.isOnline) {
      console.log(`Interceptando requisição offline: ${method} ${url}`);
      
      // Gera um ID único
      const id = Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15) + 
                 Date.now().toString();
      
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
        files: files || [],
        status: 'pending',
        retryCount: 0,
        timestamp: Date.now()
      };
      
      // Salva a operação pendente
      await offlineStorage.savePendingOperation(id, pendingOp);
      
      // Se for uma operação de criação, também salvar os dados localmente
      // para que apareçam na interface mesmo offline
      if (method === 'POST' || method === 'PUT') {
        // Para criação, adicionamos uma fake ID temporária
        if (method === 'POST') {
          body.id = `temp_${id}`;
          body.offlinePending = true;
        }
        
        // Salva os dados localmente para acesso offline
        const currentData = await offlineStorage.getOfflineDataByType(entity) || [];
        
        if (method === 'POST') {
          // Adiciona o novo item
          await offlineStorage.saveOfflineData(entity, [...currentData, body]);
        } else if (method === 'PUT') {
          // Atualiza o item existente
          const updatedData = currentData.map((item: any) => 
            item.id === body.id ? {...item, ...body, offlinePending: true} : item
          );
          await offlineStorage.saveOfflineData(entity, updatedData);
        }
      } else if (method === 'DELETE') {
        // Para exclusão, remove do cache local também
        const itemId = url.split('/').pop();
        const currentData = await offlineStorage.getOfflineDataByType(entity) || [];
        const filteredData = currentData.filter((item: any) => item.id !== Number(itemId));
        await offlineStorage.saveOfflineData(entity, filteredData);
      }
      
      // Se for upload de arquivo, salvar o arquivo no storage
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          await offlineStorage.saveOfflineFile(id, file);
        }
      }
      
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
          offlinePending: true
        })
      };
    }
    
    // Se estiver online, faz a requisição normalmente
    try {
      // Preparar FormData se houver arquivos
      let requestOptions: RequestInit = {
        method,
        headers: {}
      };
      
      if (files && files.length > 0) {
        // Há arquivos, enviar como FormData
        const formData = new FormData();
        
        // Adicionar o payload como um campo data
        formData.append('data', JSON.stringify(body));
        
        // Adicionar os arquivos
        files.forEach((file, index) => {
          formData.append('photo', file);
        });
        
        requestOptions.body = formData;
      } else if (body) {
        // Sem arquivos, enviar como JSON
        requestOptions.headers = {
          'Content-Type': 'application/json'
        };
        requestOptions.body = JSON.stringify(body);
      }
      
      // Fazer a requisição
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      console.error('Erro na requisição:', error);
      throw error;
    }
  }
  
  // Sincroniza operações pendentes
  public async syncPendingOperations() {
    if (this.isSyncing || !this.isOnline) {
      return;
    }
    
    try {
      this.isSyncing = true;
      console.log('Iniciando sincronização de operações pendentes...');
      
      // Obtém todas as operações pendentes
      const pendingOps = await offlineStorage.getPendingOperations();
      
      if (pendingOps.length === 0) {
        console.log('Nenhuma operação pendente para sincronizar');
        this.isSyncing = false;
        return;
      }
      
      console.log(`Encontradas ${pendingOps.length} operações pendentes`);
      
      // Processa cada operação pendente
      for (const op of pendingOps) {
        try {
          console.log(`Sincronizando operação: ${op.id} - ${op.method} ${op.url}`);
          
          // Atualiza status para sincronizando
          await offlineStorage.updateOperationStatus(op.id, 'syncing');
          
          // Prepara os dados para envio
          let requestBody;
          
          // Se houver arquivos, prepara um FormData
          if (op.files && op.files.length > 0) {
            const formData = new FormData();
            
            // Adiciona os dados como campo 'data'
            formData.append('data', JSON.stringify(op.payload));
            
            // Recupera e adiciona os arquivos
            for (let i = 0; i < op.files.length; i++) {
              const fileData = await offlineStorage.getOfflineFile(op.id);
              if (fileData) {
                const file = new File([fileData], `file-${i}.jpg`, { type: 'image/jpeg' });
                formData.append('photo', file);
              }
            }
            
            requestBody = formData;
          } else {
            // Sem arquivos, usa JSON normal
            requestBody = op.payload;
          }
          
          // Faz a requisição
          const response = await fetch(op.url, {
            method: op.method,
            body: op.files && op.files.length > 0 ? requestBody : JSON.stringify(requestBody),
            headers: op.files && op.files.length > 0 ? {} : {
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error(`Erro na sincronização: ${response.status} ${response.statusText}`);
          }
          
          // Se chegou aqui, operação concluída com sucesso
          await offlineStorage.updateOperationStatus(op.id, 'completed');
          
          // Limpa arquivos associados, se houver
          if (op.files && op.files.length > 0) {
            await offlineStorage.removeOfflineFile(op.id);
          }
          
          // Remove a operação da lista de pendentes
          await offlineStorage.removePendingOperation(op.id);
          
          console.log(`Operação ${op.id} sincronizada com sucesso`);
          
          // Atualiza o cache local após sincronização bem-sucedida
          await this.refreshLocalCache(op.entity);
        } catch (error) {
          console.error(`Erro ao sincronizar operação ${op.id}:`, error);
          
          // Incrementa o contador de tentativas
          const newRetryCount = (op.retryCount || 0) + 1;
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          
          await offlineStorage.updateOperationRetry(
            op.id, 
            newRetryCount, 
            errorMessage
          );
          
          // Se ultrapassou limite de tentativas, marcar como erro
          if (newRetryCount >= 5) {
            await offlineStorage.updateOperationStatus(op.id, 'error');
          }
        }
      }
      
      // Verifica se ainda há operações pendentes
      const remainingOps = await offlineStorage.getPendingOperations();
      this.syncListeners.forEach(listener => listener(remainingOps.length > 0));
      
    } catch (error) {
      console.error('Erro geral na sincronização:', error);
    } finally {
      this.isSyncing = false;
    }
  }
  
  // Atualiza o cache local após sincronização
  private async refreshLocalCache(entityType: string) {
    try {
      // Faz uma requisição para obter os dados atualizados do servidor
      const response = await fetch(`/api/${entityType}`);
      
      if (response.ok) {
        const freshData = await response.json();
        
        // Salva os dados atualizados no cache local
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
}

// Exporta uma instância única do SyncManager
export const syncManager = new SyncManager();es
type PendingOperation = {
  id: string;
  url: string;
  method: string;
  body: any;
  timestamp: number;
  files?: File[]; // Para suportar upload de arquivos
  retryCount: number;
  status: 'pending' | 'processing' | 'error';
  errorMessage?: string;
};

class SyncManager {
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private maxRetries: number = 3;
  private syncInterval: number = 30000; // 30 segundos
  private intervalId: number | null = null;
  private listeners: Array<(online: boolean) => void> = [];

  constructor() {
    // Inicializa os event listeners para monitorar o estado da conexão
    window.addEventListener('online', () => this.handleConnectionChange(true));
    window.addEventListener('offline', () => this.handleConnectionChange(false));
    
    // Verificação mais robusta do status online além do navigator.onLine
    this.checkNetworkStatus();
  }

  // Verifica o status real da rede fazendo uma pequena requisição
  private async checkNetworkStatus() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/api/ping', { 
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store'
      });
      
      clearTimeout(timeoutId);
      this.setOnlineStatus(response.ok);
    } catch (error) {
      // Se der erro, estamos offline
      this.setOnlineStatus(false);
    }
    
    // Agenda próxima verificação
    setTimeout(() => this.checkNetworkStatus(), 60000); // A cada minuto
  }

  private setOnlineStatus(online: boolean) {
    const changed = this.isOnline !== online;
    this.isOnline = online;
    
    if (changed) {
      // Notifica os listeners sobre a mudança
      this.listeners.forEach(listener => listener(online));
      
      // Se voltou a ficar online, tenta sincronizar
      if (online) {
        this.syncPendingOperations();
      }
      
      // Atualiza visual para o usuário
      this.updateOfflineUI(online);
    }
  }

  private handleConnectionChange(online: boolean) {
    console.log(`Conexão mudou para: ${online ? 'online' : 'offline'}`);
    this.setOnlineStatus(online);
  }

  // Método para atualizar a UI com status offline/online
  private updateOfflineUI(online: boolean) {
    // Atualiza a interface para mostrar status
    const offlineIndicator = document.getElementById('offline-indicator');
    
    if (!offlineIndicator) {
      // Cria o indicador se não existir
      const indicator = document.createElement('div');
      indicator.id = 'offline-indicator';
      indicator.style.position = 'fixed';
      indicator.style.bottom = '10px';
      indicator.style.right = '10px';
      indicator.style.padding = '8px 16px';
      indicator.style.borderRadius = '4px';
      indicator.style.zIndex = '9999';
      indicator.style.fontWeight = 'bold';
      document.body.appendChild(indicator);
    }
    
    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
      if (!online) {
        indicator.textContent = 'Você está offline. Suas alterações serão salvas localmente.';
        indicator.style.backgroundColor = '#f8d7da';
        indicator.style.color = '#721c24';
        indicator.style.display = 'block';
      } else {
        // Verifica se há operações pendentes
        this.getPendingOperationsCount().then(count => {
          if (count > 0) {
            indicator.textContent = `Sincronizando ${count} operações...`;
            indicator.style.backgroundColor = '#fff3cd';
            indicator.style.color = '#856404';
            indicator.style.display = 'block';
          } else {
            indicator.style.display = 'none';
          }
        });
      }
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
        if (this.isOnline && !this.isSyncing) {
          this.syncPendingOperations();
        }
      }, this.syncInterval);
    }
    
    // Adiciona listener para mudanças de rota para cachear novas páginas
    window.addEventListener('popstate', () => this.cacheCurrentPage());
    
    // Para frameworks SPA como React com routing, podemos usar um MutationObserver
    // para detectar mudanças no DOM que indicam mudança de página
    const observer = new MutationObserver(() => {
      this.cacheCurrentPage();
    });
    
    // Observa mudanças no corpo da página
    observer.observe(document.body, { 
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
  }

  // Intercepta requisições para processar offline se necessário
  public async interceptRequest(url: string, method: string, body?: any, files?: File[]): Promise<any> {
    // Se estiver online, tenta fazer a requisição normalmente
    if (this.isOnline) {
      try {
        // Se tiver arquivos, usa FormData
        if (files && files.length > 0) {
          const formData = new FormData();
          
          if (body) {
            formData.append('data', typeof body === 'string' ? body : JSON.stringify(body));
          }
          
          files.forEach((file, index) => {
            formData.append(`file${index}`, file);
          });
          
          const response = await fetch(url, {
            method,
            body: formData
          });
          
          if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
          }
          
          return await response.json();
        } else {
          // Requisição normal sem arquivos
          const response = await fetch(url, {
            method,
            headers: {
              'Content-Type': 'application/json'
            },
            body: body ? JSON.stringify(body) : undefined
          });
          
          if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
          }
          
          return await response.json();
        }
      } catch (error) {
        console.error('Erro ao fazer requisição:', error);
        
        // Se falhar mesmo online, armazena para tentar depois
        await this.addPendingOperation(url, method, body, files);
        
        // Retorna uma resposta "fake" para não quebrar o fluxo da aplicação
        return this.createMockResponse(url, method, body);
      }
    } else {
      // Estamos offline, armazena a operação para sincronizar depois
      console.log('Armazenando operação offline:', { url, method });
      await this.addPendingOperation(url, method, body, files);
      
      // Retorna uma resposta "fake" para não quebrar o fluxo da aplicação
      return this.createMockResponse(url, method, body);
    }
  }

  // Cria uma resposta mock quando estamos offline
  private createMockResponse(url: string, method: string, body: any): any {
    // IDs temporários negativos para identificar facilmente que são offline
    const tempId = -Math.floor(Math.random() * 1000000);
    
    // Resposta padrão
    const mockResponse = {
      id: tempId,
      createdAt: new Date().toISOString(),
      success: true,
      isOfflineMock: true
    };
    
    // Adiciona os dados originais
    if (body) {
      return { ...mockResponse, ...body };
    }
    
    return mockResponse;
  }

  // Adiciona uma operação à fila de pendências
  private async addPendingOperation(url: string, method: string, body?: any, files?: File[]): Promise<string> {
    const operation: PendingOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      url,
      method,
      body,
      timestamp: Date.now(),
      files,
      retryCount: 0,
      status: 'pending'
    };
    
    await offlineStorage.savePendingOperation(operation);
    
    // Atualiza o contador visual
    this.updateOfflineUI(this.isOnline);
    
    return operation.id;
  }

  // Obtém o número de operações pendentes
  private async getPendingOperationsCount(): Promise<number> {
    const operations = await offlineStorage.getPendingOperations();
    return operations.length;
  }

  // Sincroniza todas as operações pendentes
  private async syncPendingOperations() {
    if (this.isSyncing || !this.isOnline) {
      return;
    }
    
    this.isSyncing = true;
    console.log('Iniciando sincronização de operações pendentes...');
    
    try {
      const operations = await offlineStorage.getPendingOperations();
      
      if (operations.length === 0) {
        console.log('Nenhuma operação pendente para sincronizar');
        this.isSyncing = false;
        this.updateOfflineUI(true);
        return;
      }
      
      console.log(`Encontradas ${operations.length} operações pendentes`);
      this.updateOfflineUI(true);
      
      // Processa as operações em ordem de timestamp (mais antigas primeiro)
      const sortedOperations = operations.sort((a, b) => a.timestamp - b.timestamp);
      let successCount = 0;
      
      for (const operation of sortedOperations) {
        // Atualiza status
        await offlineStorage.updateOperationStatus(operation.id, 'processing');
        
        try {
          let response;
          console.log(`Sincronizando operação: ${operation.url} (${operation.method})`, operation.body);
          
          if (operation.files && operation.files.length > 0) {
            // Processa operação com arquivos usando FormData
            const formData = new FormData();
            
            if (operation.body) {
              formData.append('data', typeof operation.body === 'string' 
                ? operation.body 
                : JSON.stringify(operation.body)
              );
            }
            
            operation.files.forEach((file, index) => {
              formData.append(`file${index}`, file);
            });
            
            response = await fetch(operation.url, {
              method: operation.method,
              body: formData,
              // Evita cache para garantir que o request seja feito
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              }
            });
          } else {
            // Operação sem arquivos
            response = await fetch(operation.url, {
              method: operation.method,
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              },
              body: operation.body ? JSON.stringify(operation.body) : undefined
            });
          }
          
          if (!response.ok) {
            throw new Error(`Erro na sincronização: ${response.status} - ${await response.text()}`);
          }
          
          // Pegue a resposta para atualizar o cache local
          const responseData = await response.json();
          console.log(`Resposta recebida para operação ${operation.id}:`, responseData);
          
          // Operação concluída com sucesso, remove da fila
          await offlineStorage.removePendingOperation(operation.id);
          
          // Notificar o sistema que um item foi sincronizado (isso ajuda a atualizar a UI)
          window.dispatchEvent(new CustomEvent('offline-sync-success', { 
            detail: { 
              operation, 
              response: responseData 
            }
          }));
          
          successCount++;
          console.log(`Operação ${operation.id} sincronizada com sucesso`);
        } catch (error) {
          console.error(`Erro ao sincronizar operação ${operation.id}:`, error);
          
          // Incrementa o contador de tentativas
          if (operation.retryCount < this.maxRetries) {
            await offlineStorage.updateOperationRetry(
              operation.id, 
              operation.retryCount + 1,
              error instanceof Error ? error.message : 'Erro desconhecido'
            );
          } else {
            // Marca como erro permanente após exceder tentativas
            await offlineStorage.updateOperationStatus(
              operation.id, 
              'error', 
              error instanceof Error ? error.message : 'Erro desconhecido'
            );
            
            // Notificar o sistema que um item falhou permanentemente
            window.dispatchEvent(new CustomEvent('offline-sync-error', { 
              detail: { 
                operation,
                error: error instanceof Error ? error.message : 'Erro desconhecido'
              }
            }));
          }
        }
      }
      
      // Conta quantas operações ainda estão pendentes após a sincronização
      const remainingOperations = await offlineStorage.getPendingOperations();
      console.log(`Sincronização concluída. ${successCount}/${operations.length} operações sincronizadas.`);
      
      // Se sincronizamos com sucesso, recarregue os dados das páginas
      if (successCount > 0) {
        // Dispara um evento para que os componentes que usam dados saibam que devem recarregar
        window.dispatchEvent(new CustomEvent('data-synchronized', { 
          detail: { count: successCount }
        }));
        
        // Invalidar caches do React Query para forçar recarga de dados
        window.dispatchEvent(new CustomEvent('invalidate-queries'));
      }
      
      // Atualiza a UI
      this.updateOfflineUI(true);
    } catch (error) {
      console.error('Erro durante a sincronização:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Adiciona um listener para mudanças de status online/offline
  public addConnectionListener(listener: (online: boolean) => void) {
    this.listeners.push(listener);
    // Chama imediatamente com o status atual
    listener(this.isOnline);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Obtém o status atual da conexão
  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Força uma sincronização manual
  public forceSyncNow() {
    if (this.isOnline && !this.isSyncing) {
      this.syncPendingOperations();
    }
  }
}

// Exporta instância única do gerenciador de sincronização
export const syncManager = new SyncManager();
