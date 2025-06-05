import { offlineStorage } from './offlineStorage';

// Tipos para as operações pendentes
interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  url: string;
  method: string;
  payload: any;
  fileMetadatas?: { fileId: string, name: string, type: string, operationId: string }[]; // Changed from files?: File[]
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

  constructor() {
    // Inicializa os event listeners para status de conexão
    window.addEventListener('online', this.handleOnlineStatus);
    window.addEventListener('offline', this.handleOnlineStatus);

    // Verificação mais robusta do status online além do navigator.onLine
    this.checkRealOnlineStatus();
  }

  // Verifica se a conexão está realmente ativa fazendo um ping ao servidor
  private async checkRealOnlineStatus() {
    if (!navigator.onLine) {
      this.updateOnlineStatus(false);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/ping', { 
        method: 'HEAD',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.toLowerCase().includes('text/html')) {
          // Likely a captive portal redirect
          console.log('Conexão detectada, mas parece ser um portal cativo (HTML recebido). Tratando como offline.');
          this.updateOnlineStatus(false);
        } else {
          // Ping bem-sucedido e não parece ser um portal cativo
          this.updateOnlineStatus(true);
        }
      } else {
        // Resposta não OK (ex: 404, 500)
        this.updateOnlineStatus(false);
      }
    } catch (error) {
      // Erro de rede (fetch falhou, abortado por timeout, etc.)
      console.log('Erro ao verificar conexão (ex: timeout, falha de rede):', error);
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

      // Atualiza visual para o usuário
      this.updateOfflineUI(status);
    }
  }

  private showSyncCompletedMessage() {
    let indicator = document.getElementById('offline-indicator');
    if (!indicator) {
      // Se por algum motivo o indicador não existir, cria-o.
      // Esta lógica é similar à de updateOfflineUI, mas simplificada para este caso.
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
        // Verifica se a mensagem ainda é "Sincronização concluída!" antes de potencialmente escondê-la.
        // updateOfflineUI será chamado e decidirá se deve realmente esconder ou mostrar outro estado.
        if (indicator && indicator.textContent === "Sincronização concluída!") {
           this.updateOfflineUI(this.isOnline); // Reavalia o estado da UI
        }
      }, 5000); // Mensagem de sucesso visível por 5 segundos
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

    // Certifique-se de que offlineIndicator não é null aqui antes de prosseguir
    if (!offlineIndicator) return;

    const indicator = offlineIndicator; // Renomear para 'indicator' para consistência com o código abaixo

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
          indicator.style.backgroundColor = '#fff3cd'; // Amarelo para sincronizando
          indicator.style.color = '#856404';
          indicator.style.display = 'block';
        } else if (pendingToSyncOpsCount > 0) {
          indicator.textContent = `${pendingToSyncOpsCount} alterações pendentes para sincronizar.`;
          indicator.style.backgroundColor = '#cfe2ff'; // Azul para pendente
          indicator.style.color = '#084298';
          indicator.style.display = 'block';
        } else if (errorOpsCount > 0) {
          indicator.textContent = `Falha ao sincronizar ${errorOpsCount} alterações. Verifique os detalhes.`;
          indicator.style.backgroundColor = '#f8d7da'; // Vermelho para erro
          indicator.style.color = '#721c24';
          indicator.style.display = 'block';
        } else {
          // Se não estiver mostrando "Sincronização concluída!", esconde.
          // Isso evita que a mensagem de "concluído" seja imediatamente escondida
          // se o updateOfflineUI for chamado logo após showSyncCompletedMessage.
          if (indicator.textContent !== "Sincronização concluída!") {
             indicator.style.display = 'none';
          }
        }
      } catch (error) {
        console.error("Erro ao atualizar UI offline:", error);
        // Fallback em caso de erro ao buscar operações
        indicator.textContent = 'Verificando status...';
        indicator.style.backgroundColor = '#e0e0e0'; // Cinza neutro
        indicator.style.color = '#333';
        indicator.style.display = 'block';
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
    // para detectar mudanças no DOM que indicam mudança de página
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
        // files: files || [], // Will be replaced by fileMetadatas
        status: 'pending',
        retryCount: 0,
        timestamp: Date.now()
      };

      // Salva a operação pendente
      await offlineStorage.savePendingOperation(pendingOp);

      // Se for uma operação de criação, também salvar os dados localmente
      // para que apareçam na interface mesmo offline
      if (method === 'POST' || method === 'PUT') {
        // Para criação, adicionamos uma fake ID temporária
        const tempBody = { ...body };
        if (method === 'POST') {
          tempBody.id = `temp_${id}`;
          tempBody.offlinePending = true;
        }

        // Salva os dados localmente para acesso offline
        const currentData = await offlineStorage.getOfflineDataByType(entity) || [];

        if (method === 'POST') {
          // Adiciona o novo item
          await offlineStorage.saveOfflineData(entity, [...currentData, tempBody]);
          // Dispatch event
          window.dispatchEvent(new CustomEvent('local-data-changed', {
            detail: { entityType: entity, operationType: 'create', data: tempBody }
          }));
        } else if (method === 'PUT') {
          // Atualiza o item existente
          const updatedData = currentData.map((item: any) => 
            item.id === body.id ? {...item, ...body, offlinePending: true} : item
          );
          await offlineStorage.saveOfflineData(entity, updatedData);
          // Dispatch event
          window.dispatchEvent(new CustomEvent('local-data-changed', {
            detail: { entityType: entity, operationType: 'update', data: body }
          }));
        }
      } else if (method === 'DELETE') {
        // Para exclusão, remove do cache local também
        const itemId = url.split('/').pop();
        const currentData = await offlineStorage.getOfflineDataByType(entity) || [];
        // Usa comparação não estrita (!=) para lidar com IDs de string e número
        const filteredData = currentData.filter((item: any) => 
          item.id != itemId // Comparação não estrita para lidar com diferenças de tipo
        );
        await offlineStorage.saveOfflineData(entity, filteredData);
        // Dispatch event
        window.dispatchEvent(new CustomEvent('local-data-changed', {
          detail: { entityType: entity, operationType: 'delete', id: itemId }
        }));
      }

      // Se for upload de arquivo, salvar o arquivo no storage e guardar metadados
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
            // Opcional: decidir se a operação inteira deve falhar ou continuar sem o arquivo
          }
        }
      }

      // Salva a operação pendente (agora com fileMetadatas, se houver)
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
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        };
        requestOptions.body = JSON.stringify(body);
      }

      // Fazer a requisição
      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      console.error('Erro na requisição:', error);

      // Mesmo estando online, salvamos a operação para tentativa posterior
      // se a requisição falhar
      if (method !== 'GET') {
        await this.addPendingOperation(url, method, body, files);
      }

      throw error;
    }
  }

  // Adiciona uma operação à fila de pendências
  private async addPendingOperation(url: string, method: string, body?: any, files?: File[]): Promise<string> {
    // Gera um ID único
    const id = `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Extrai a entidade da URL (ex: /api/registrations -> registrations)
    const entity = url.replace(/^\/api\//, '').split('/')[0];

    // Garantir que files sempre seja uma matriz de tipo File ou undefined
    // const validatedFiles = files && Array.isArray(files)
    //   ? files.filter(file => file instanceof File)
    //   : undefined; // Replaced by fileMetadatas logic

    const operation: PendingOperation = {
      id,
      type: method === 'POST' ? 'create' : method === 'PUT' ? 'update' : 'delete',
      entity,
      url,
      method,
      payload: body,
      timestamp: Date.now(),
      // files: validatedFiles, // Replaced by fileMetadatas
      retryCount: 0,
      status: 'pending'
      // fileMetadatas will be added here if files are present and saved successfully
    };

    // Se houver arquivos, salvá-los e adicionar metadados à operação
    // Esta lógica é similar à de interceptRequest, mas adaptada para addPendingOperation
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
          // Considerar como lidar com falha no salvamento do arquivo aqui
        }
      }
    }

    await offlineStorage.savePendingOperation(operation);

    // Atualiza o contador visual e o status da UI
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
      this.updateOfflineUI(true); // Atualiza UI no início da sincronização
      console.log('Iniciando sincronização de operações pendentes...');

      // Obtém todas as operações pendentes
      const pendingOps = await offlineStorage.getPendingOperations();

      if (pendingOps.length === 0) {
        console.log('Nenhuma operação pendente para sincronizar');
        // this.isSyncing = false; // Moved to finally
        // this.updateOfflineUI(true); // Moved to finally
        return; // isSyncing and updateOfflineUI will be handled by finally
      }

      console.log(`Encontradas ${pendingOps.length} operações pendentes`);
      // this.updateOfflineUI(true); // Chamado no início do try

      // Processa as operações em ordem de timestamp (mais antigas primeiro)
      const sortedOperations = pendingOps.sort((a, b) => a.timestamp - b.timestamp);
      let successCount = 0;

      for (const op of sortedOperations) {
        try {
          console.log(`Sincronizando operação: ${op.id} - ${op.method} ${op.url}`);

          // Atualiza status para sincronizando
          await offlineStorage.updateOperationStatus(op.id, 'syncing');
          this.updateOfflineUI(true); // Reflete que uma operação específica está sincronizando

          // Prepara os dados para envio
          let requestBody;
          let requestOptions: RequestInit = {
            method: op.method,
            headers: {}
          };

          // Se houver metadados de arquivos, prepara um FormData
          if (op.fileMetadatas && op.fileMetadatas.length > 0) {
            const formData = new FormData();

            // Adiciona os dados do payload como campo 'data'
            // Garantir que op.payload não seja undefined ou null antes de stringify
            if (op.payload !== undefined && op.payload !== null) {
                formData.append('data', JSON.stringify(op.payload));
            } else {
                // Se o payload for nulo ou indefinido, pode ser necessário enviar um objeto JSON vazio
                // ou ajustar conforme a expectativa do backend.
                formData.append('data', JSON.stringify({}));
            }

            // Recupera e adiciona os arquivos
            for (const fileMeta of op.fileMetadatas) {
              try {
                const fileData = await offlineStorage.getOfflineFile(fileMeta.fileId);
                if (fileData) {
                  const file = new File([fileData.data], fileMeta.name, { type: fileMeta.type });
                  formData.append('photo', file); // O backend espera 'photo' ou um nome de campo dinâmico?
                } else {
                  console.warn(`Arquivo ${fileMeta.fileId} (nome: ${fileMeta.name}) não encontrado no offlineStorage para a operação ${op.id}`);
                  // Decidir se a operação deve prosseguir sem o arquivo ou falhar
                }
              } catch (error) {
                console.error(`Erro ao recuperar arquivo ${fileMeta.fileId} (nome: ${fileMeta.name}) para operação ${op.id}:`, error);
                // Decidir se a operação deve prosseguir ou falhar
                // Poderia lançar um erro aqui para fazer a operação falhar e ser retentada/marcada como erro
                throw new Error(`Falha ao recuperar arquivo ${fileMeta.name} para sincronização.`);
              }
            }
            requestOptions.body = formData;
          } else {
            // Sem arquivos, usa JSON normal
            // Garantir que op.payload não seja undefined ou null antes de stringify
            if (op.payload !== undefined && op.payload !== null) {
                requestOptions.headers = {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                };
                requestOptions.body = JSON.stringify(op.payload);
            } else {
                // Se o payload for nulo, não defina o corpo ou defina como JSON vazio,
                // dependendo do que o servidor espera.
                // Para métodos como DELETE, o corpo pode não ser necessário.
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

          // Faz a requisição com timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            console.log(`Timeout para operação ${op.id} (${op.url})`);
            controller.abort();
          }, this.syncOperationTimeout);

          let response;
          try {
            response = await fetch(op.url, { ...requestOptions, signal: controller.signal });
            clearTimeout(timeoutId); // Limpa o timeout se a requisição completar/falhar antes

            if (!response.ok) {
              const errorBody = await response.text();
              throw new Error(`Erro na sincronização: ${response.status} ${response.statusText}. Resposta: ${errorBody}`);
            }
          } catch (error) {
            clearTimeout(timeoutId); // Garante limpeza do timeout em caso de erro de fetch (incluindo abort)
            if (error instanceof Error && error.name === 'AbortError') {
              throw new Error(`Timeout na operação de sincronização para ${op.url} após ${this.syncOperationTimeout / 1000}s`);
            }
            throw error; // Re-throw outros erros de fetch
          }

          // Se chegou aqui, operação concluída com sucesso
          await offlineStorage.updateOperationStatus(op.id, 'completed');

          // Limpa arquivos associados, se houver
          if (op.fileMetadatas && op.fileMetadatas.length > 0) {
            try {
              console.log(`Removendo ${op.fileMetadatas.length} arquivos offline associados à operação ${op.id}`);
              for (const fileMeta of op.fileMetadatas) {
                await offlineStorage.removeOfflineFile(fileMeta.fileId);
                console.log(`Arquivo offline ${fileMeta.fileId} (nome: ${fileMeta.name}) removido com sucesso.`);
              }
            } catch (fileError) {
              console.error(`Erro ao remover arquivos offline para operação ${op.id}:`, fileError);
              // Não interrompe o processo, apenas registra o erro.
              // A operação principal já foi bem-sucedida.
            }
          }

          // Remove a operação da lista de pendentes
          await offlineStorage.removePendingOperation(op.id);

          // Capturar resposta para atualização de UI
          // Ensure response is read only once
          const responseData = await response.json();

          // Notificar o sistema que um item foi sincronizado (isso ajuda a atualizar a UI)
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

          // Incrementa o contador de tentativas
          const newRetryCount = (op.retryCount || 0) + 1;
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

          await offlineStorage.updateOperationRetry(
            op.id, 
            newRetryCount, 
            errorMessage
          );

          // Se ultrapassou limite de tentativas, marcar como erro
          if (newRetryCount >= this.maxRetries) {
            await offlineStorage.updateOperationStatus(
              op.id, 
              'error',
              errorMessage
            );

            // Limpar arquivos offline associados a esta operação falhada
            if (op.fileMetadatas && op.fileMetadatas.length > 0) {
              console.log(`Limpando ${op.fileMetadatas.length} arquivos órfãos para a operação falhada ${op.id}`);
              for (const fileMeta of op.fileMetadatas) {
                try {
                  await offlineStorage.removeOfflineFile(fileMeta.fileId);
                  console.log(`Arquivo órfão ${fileMeta.fileId} (nome: ${fileMeta.name}) removido.`);
                } catch (fileErr) {
                  console.warn(`Não foi possível remover o arquivo órfão ${fileMeta.fileId} para a operação falhada ${op.id}: `, fileErr);
                }
              }
            }

            // Notificar o sistema que um item falhou permanentemente
            window.dispatchEvent(new CustomEvent('offline-sync-error', { 
              detail: { 
                operation: op,
                error: errorMessage
              }
            }));
          }
        }
      }

      // Se sincronizamos com sucesso, recarregue os dados das páginas
      if (successCount > 0) {
        // Dispara um evento para que os componentes que usam dados saibam que devem recarregar
        window.dispatchEvent(new CustomEvent('data-synchronized', { 
          detail: { count: successCount }
        }));

        // Invalidar caches do React Query para forçar recarga de dados
        window.dispatchEvent(new CustomEvent('invalidate-queries'));
        this.showSyncCompletedMessage(); // Mostra mensagem de sucesso
      }

      // Verifica se ainda há operações pendentes
      // const remainingOps = await offlineStorage.getPendingOperations(); // updateOfflineUI no finally vai pegar isso
      // this.syncListeners.forEach(listener => listener(remainingOps.length > 0)); // updateOfflineUI fará a notificação visual

      // Atualiza o cache local após sincronização bem-sucedida
      if (successCount > 0) {
        await this.refreshLocalCaches();
      }

      // Atualiza a UI - movido para o finally
      // this.updateOfflineUI(true);
    } catch (error) {
      console.error('Erro geral na sincronização:', error);
      // this.updateOfflineUI(this.isOnline); // Garante que a UI reflita o estado após um erro geral
    } finally {
      this.isSyncing = false;
      this.updateOfflineUI(this.isOnline); // Chamada crucial no finally
    }
  }

  // Atualiza o cache local após sincronização
  private async refreshLocalCaches() {
    try {
      // Atualiza entidades comuns
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
      // Faz uma requisição para obter os dados atualizados do servidor
      const response = await fetch(`/api/${entityType}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

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
    // Chama imediatamente para atualizar o estado atual
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
    // Chama imediatamente com o status atual
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