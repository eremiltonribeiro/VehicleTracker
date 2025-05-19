import { offlineStorage } from './offlineStorage';
import { toast } from "@/hooks/use-toast";

/**
 * Gerenciador de sincronização para dados offline
 * Responsável por monitorar o status de conexão e sincronizar dados
 */
class SyncManager {
  private syncInProgress: boolean = false;
  private initialized: boolean = false;
  
  /**
   * Inicializa o gerenciador de sincronização
   */
  initialize() {
    if (this.initialized) {
      return;
    }
    
    // Monitorar status de conexão
    window.addEventListener('online', this.handleConnectionChange.bind(this));
    window.addEventListener('offline', this.handleConnectionChange.bind(this));
    
    // Inicializar handler de mensagens do Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
    }
    
    // Verificar pendências quando iniciado
    this.checkPendingSyncs();
    
    // Tentar sincronizar a cada 5 minutos (quando online)
    setInterval(() => {
      if (navigator.onLine) {
        this.syncData();
      }
    }, 5 * 60 * 1000);
    
    this.initialized = true;
  }
  
  /**
   * Lidar com mudanças na conexão
   */
  private handleConnectionChange(event: Event) {
    const isOnline = navigator.onLine;
    
    if (isOnline) {
      console.log('Conexão restabelecida. Iniciando sincronização...');
      this.syncData();
    } else {
      console.log('Conexão perdida. Operando em modo offline.');
      // Notificar o usuário que está offline
      toast({
        title: "Você está offline",
        description: "Os dados serão armazenados localmente e sincronizados quando a conexão for restabelecida.",
        variant: "destructive",
      });
    }
  }
  
  /**
   * Lidar com mensagens do Service Worker
   */
  private handleServiceWorkerMessage(event: MessageEvent) {
    if (!event.data) return;
    
    switch (event.data.type) {
      case 'GET_PENDING_ITEMS':
        this.handleGetPendingItemsRequest(event);
        break;
        
      case 'SYNC_STARTED':
        console.log('Sincronização iniciada pelo Service Worker');
        this.syncInProgress = true;
        break;
        
      case 'SYNC_COMPLETED':
        console.log('Sincronização pelo Service Worker concluída', event.data.results);
        this.syncInProgress = false;
        this.handleSyncResults(event.data.results);
        break;
        
      case 'SYNC_SUCCESS':
        console.log(`Item ${event.data.id} sincronizado com sucesso`);
        this.handleItemSynced(event.data.id);
        break;
        
      case 'SYNC_ERROR':
        console.error('Erro na sincronização pelo Service Worker:', event.data.error);
        this.syncInProgress = false;
        break;
    }
  }
  
  /**
   * Responder à solicitação de itens pendentes do Service Worker
   */
  private async handleGetPendingItemsRequest(event: MessageEvent) {
    if (!event.ports || !event.ports[0]) {
      return;
    }
    
    try {
      const pendingItems = await offlineStorage.getPendingRegistrations();
      
      // Responder ao Service Worker com os itens pendentes
      event.ports[0].postMessage({
        pendingItems
      });
    } catch (error) {
      console.error('Erro ao obter itens pendentes para o Service Worker:', error);
      event.ports[0].postMessage({
        pendingItems: []
      });
    }
  }
  
  /**
   * Processar resultados de sincronização
   */
  private handleSyncResults(results: any[]) {
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;
    
    if (successCount > 0) {
      toast({
        title: "Sincronização concluída",
        description: `${successCount} registro(s) sincronizado(s) com sucesso.${failureCount > 0 ? ` ${failureCount} falha(s).` : ''}`,
        variant: "default",
      });
      
      // Atualizar a contagem de pendências
      this.checkPendingSyncs();
    }
  }
  
  /**
   * Marcar um item como sincronizado
   */
  private async handleItemSynced(id: number) {
    await offlineStorage.markRegistrationSynced(id);
  }
  
  /**
   * Sincronizar dados com o servidor
   */
  async syncData(): Promise<boolean> {
    if (this.syncInProgress || !navigator.onLine) {
      return false;
    }
    
    this.syncInProgress = true;
    
    try {
      const result = await offlineStorage.syncWithServer();
      
      this.syncInProgress = false;
      
      if (result.syncedCount > 0) {
        toast({
          title: "Sincronização concluída",
          description: `${result.syncedCount} registro(s) sincronizado(s) com sucesso.${result.errors.length > 0 ? ` ${result.errors.length} falha(s).` : ''}`,
          variant: "default",
        });
      }
      
      // Atualizar a contagem de pendências
      this.checkPendingSyncs();
      
      return result.success;
    } catch (error) {
      console.error('Erro durante sincronização:', error);
      this.syncInProgress = false;
      
      toast({
        title: "Erro na sincronização",
        description: "Ocorreu um erro ao sincronizar os dados. Tente novamente mais tarde.",
        variant: "destructive",
      });
      
      return false;
    }
  }
  
  /**
   * Verificar sincronizações pendentes
   */
  async checkPendingSyncs(): Promise<number> {
    try {
      const pendingItems = await offlineStorage.getPendingRegistrations();
      return pendingItems.length;
    } catch (error) {
      console.error('Erro ao verificar sincronizações pendentes:', error);
      return 0;
    }
  }
  
  /**
   * Registrar novo item para sincronização
   */
  async registerItemForSync(item: any): Promise<boolean> {
    try {
      await offlineStorage.saveRegistration(item);
      
      // Se online, tentar sincronizar imediatamente
      if (navigator.onLine && !this.syncInProgress) {
        this.syncData();
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao registrar item para sincronização:', error);
      return false;
    }
  }
}

// Exportar uma instância singleton
export const syncManager = new SyncManager();