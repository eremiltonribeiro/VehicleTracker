import localforage from 'localforage';

// Configuração do armazenamento offline
localforage.config({
  name: 'GranduvaleVehicleManager',
  storeName: 'vehicle_manager_data'
});

/**
 * Serviço para gerenciar o armazenamento offline de dados
 * Isso permite que o aplicativo funcione sem conexão com a internet
 */
export const offlineStorage = {
  /**
   * Salva registros de veículos para uso offline
   */
  async saveRegistrations(registrations: any[]): Promise<void> {
    try {
      await localforage.setItem('registrations', registrations);
    } catch (error) {
      console.error('Erro ao salvar registros offline:', error);
    }
  },

  /**
   * Recupera registros de veículos armazenados offline
   */
  async getRegistrations(): Promise<any[]> {
    try {
      const registrations = await localforage.getItem('registrations');
      return registrations as any[] || [];
    } catch (error) {
      console.error('Erro ao recuperar registros offline:', error);
      return [];
    }
  },

  /**
   * Salva um único registro de veículo
   * Se estiver offline, marca o registro para sincronização futura
   */
  async saveRegistration(registration: any): Promise<{success: boolean, offline: boolean, id: number}> {
    try {
      const existingRegistrations = await this.getRegistrations();
      
      // Gerar um ID temporário para novos registros offline
      if (!registration.id) {
        registration.id = Date.now(); // ID temporário baseado em timestamp
      }
      
      // Marcar o registro como offline se não houver conexão
      const isOffline = !navigator.onLine;
      if (isOffline) {
        registration.offlineCreated = true;
        registration.offlinePending = true;
        registration.offlineTimestamp = new Date().toISOString();
      }
      
      // Verificar se o registro já existe
      const existingIndex = existingRegistrations.findIndex(
        (r) => r.id === registration.id
      );
      
      if (existingIndex >= 0) {
        // Atualizar registro existente
        existingRegistrations[existingIndex] = registration;
      } else {
        // Adicionar novo registro
        existingRegistrations.push(registration);
      }
      
      // Salvar todos os registros
      await this.saveRegistrations(existingRegistrations);
      
      // Se tiver offline e service worker estiver disponível, agendar sincronização
      if (isOffline && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
        try {
          // Comunicar com o Service Worker para registrar sincronização
          this.notifyServiceWorkerAboutPendingRegistration(registration);
        } catch (swError) {
          console.error('Erro ao agendar sincronização com Service Worker:', swError);
        }
      }
      
      return {
        success: true,
        offline: isOffline,
        id: registration.id
      };
    } catch (error) {
      console.error('Erro ao salvar registro individual:', error);
      return {
        success: false,
        offline: !navigator.onLine,
        id: registration.id || 0
      };
    }
  },
  
  /**
   * Notifica o Service Worker sobre um registro pendente
   */
  notifyServiceWorkerAboutPendingRegistration(registration: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // Criar canal de mensagem para comunicação bidirecional
      const messageChannel = new MessageChannel();
      
      // Configurar o handler de mensagem de resposta
      messageChannel.port1.onmessage = (event) => {
        if (event.data && event.data.status === 'success') {
          resolve(event.data);
        } else {
          reject(new Error('Falha ao registrar sincronização'));
        }
      };
      
      // Enviar mensagem para o Service Worker (verificando se o controller existe)
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'STORE_OFFLINE_REGISTRATION',
          registration
        }, [messageChannel.port2]);
      } else {
        reject(new Error('Service Worker não está controlando a página'));
      }
      
      // Timeout para evitar bloqueio indefinido
      setTimeout(() => reject(new Error('Timeout ao comunicar com Service Worker')), 3000);
    });
  },
  
  /**
   * Obtém registros pendentes que foram criados offline
   */
  async getPendingRegistrations(): Promise<any[]> {
    try {
      const allRegistrations = await this.getRegistrations();
      return allRegistrations.filter(reg => reg.offlinePending === true);
    } catch (error) {
      console.error('Erro ao obter registros pendentes:', error);
      return [];
    }
  },
  
  /**
   * Remove a marcação de pendente de um registro específico
   */
  async markRegistrationSynced(id: number): Promise<boolean> {
    try {
      const allRegistrations = await this.getRegistrations();
      const index = allRegistrations.findIndex(reg => reg.id === id);
      
      if (index >= 0) {
        allRegistrations[index].offlinePending = false;
        allRegistrations[index].syncedAt = new Date().toISOString();
        await this.saveRegistrations(allRegistrations);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao marcar registro como sincronizado:', error);
      return false;
    }
  },

  /**
   * Salva lista de veículos para uso offline
   */
  async saveVehicles(vehicles: any[]): Promise<void> {
    try {
      await localforage.setItem('vehicles', vehicles);
    } catch (error) {
      console.error('Erro ao salvar veículos offline:', error);
    }
  },

  /**
   * Recupera veículos armazenados offline
   */
  async getVehicles(): Promise<any[]> {
    try {
      const vehicles = await localforage.getItem('vehicles');
      return vehicles as any[] || [];
    } catch (error) {
      console.error('Erro ao recuperar veículos offline:', error);
      return [];
    }
  },

  /**
   * Salva lista de motoristas para uso offline
   */
  async saveDrivers(drivers: any[]): Promise<void> {
    try {
      await localforage.setItem('drivers', drivers);
    } catch (error) {
      console.error('Erro ao salvar motoristas offline:', error);
    }
  },

  /**
   * Recupera motoristas armazenados offline
   */
  async getDrivers(): Promise<any[]> {
    try {
      const drivers = await localforage.getItem('drivers');
      return drivers as any[] || [];
    } catch (error) {
      console.error('Erro ao recuperar motoristas offline:', error);
      return [];
    }
  },

  /**
   * Salva lista de postos de combustível para uso offline
   */
  async saveFuelStations(stations: any[]): Promise<void> {
    try {
      await localforage.setItem('fuelStations', stations);
    } catch (error) {
      console.error('Erro ao salvar postos offline:', error);
    }
  },

  /**
   * Recupera postos de combustível armazenados offline
   */
  async getFuelStations(): Promise<any[]> {
    try {
      const stations = await localforage.getItem('fuelStations');
      return stations as any[] || [];
    } catch (error) {
      console.error('Erro ao recuperar postos offline:', error);
      return [];
    }
  },

  /**
   * Salva lista de tipos de combustível para uso offline
   */
  async saveFuelTypes(types: any[]): Promise<void> {
    try {
      await localforage.setItem('fuelTypes', types);
    } catch (error) {
      console.error('Erro ao salvar tipos de combustível offline:', error);
    }
  },

  /**
   * Recupera tipos de combustível armazenados offline
   */
  async getFuelTypes(): Promise<any[]> {
    try {
      const types = await localforage.getItem('fuelTypes');
      return types as any[] || [];
    } catch (error) {
      console.error('Erro ao recuperar tipos de combustível offline:', error);
      return [];
    }
  },

  /**
   * Salva lista de tipos de manutenção para uso offline
   */
  async saveMaintenanceTypes(types: any[]): Promise<void> {
    try {
      await localforage.setItem('maintenanceTypes', types);
    } catch (error) {
      console.error('Erro ao salvar tipos de manutenção offline:', error);
    }
  },

  /**
   * Recupera tipos de manutenção armazenados offline
   */
  async getMaintenanceTypes(): Promise<any[]> {
    try {
      const types = await localforage.getItem('maintenanceTypes');
      return types as any[] || [];
    } catch (error) {
      console.error('Erro ao recuperar tipos de manutenção offline:', error);
      return [];
    }
  },

  /**
   * Sincroniza os dados do armazenamento local com o servidor quando online
   */
  async syncWithServer(): Promise<{success: boolean, syncedCount: number, errors: any[]}> {
    // Se estiver offline, não podemos sincronizar
    if (!navigator.onLine) {
      return {
        success: false,
        syncedCount: 0,
        errors: [{message: 'Dispositivo está offline. Não é possível sincronizar.'}]
      };
    }
    
    try {
      // Buscar todos os registros pendentes
      const pendingRegistrations = await this.getPendingRegistrations();
      
      if (pendingRegistrations.length === 0) {
        return {
          success: true,
          syncedCount: 0,
          errors: []
        };
      }
      
      console.log(`Iniciando sincronização de ${pendingRegistrations.length} registros pendentes`);
      
      // Sincronizar cada registro pendente
      const syncResults = await Promise.allSettled(pendingRegistrations.map(async (reg) => {
        try {
          // Enviar para API
          const response = await fetch('/api/registrations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...reg,
              // Remover propriedades específicas do modo offline
              offlineCreated: undefined,
              offlinePending: undefined,
              offlineTimestamp: undefined
            })
          });
          
          if (response.ok) {
            // Se a sincronização for bem-sucedida, atualizar status no armazenamento local
            await this.markRegistrationSynced(reg.id);
            return {
              success: true,
              id: reg.id
            };
          } else {
            const errorData = await response.json().catch(() => ({}));
            return {
              success: false,
              id: reg.id,
              error: errorData.message || 'Erro ao sincronizar com o servidor'
            };
          }
        } catch (error) {
          console.error(`Erro ao sincronizar registro ${reg.id}:`, error);
          return {
            success: false,
            id: reg.id,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          };
        }
      }));
      
      // Registrar os sucessos e falhas
      const successfulSyncs = syncResults.filter(r => r.status === 'fulfilled' && (r.value as any).success);
      const failedSyncs = syncResults.filter(r => r.status === 'rejected' || !(r.value as any).success);
      
      const errors = failedSyncs.map(r => {
        if (r.status === 'rejected') {
          return r.reason;
        } else {
          return (r.value as any).error;
        }
      });
      
      return {
        success: errors.length === 0,
        syncedCount: successfulSyncs.length,
        errors
      };
    } catch (error) {
      console.error('Erro ao sincronizar com servidor:', error);
      return {
        success: false,
        syncedCount: 0,
        errors: [error]
      };
    }
  },

  /**
   * Verifica se o dispositivo está online
   */
  isOnline(): boolean {
    return navigator.onLine;
  },

  /**
   * Salva uma imagem no armazenamento local
   */
  async saveImage(id: string, imageData: string): Promise<void> {
    try {
      await localforage.setItem(`image_${id}`, imageData);
    } catch (error) {
      console.error('Erro ao salvar imagem localmente:', error);
    }
  },

  /**
   * Recupera uma imagem do armazenamento local
   */
  async getImage(id: string): Promise<string | null> {
    try {
      const imageData = await localforage.getItem(`image_${id}`);
      return imageData as string;
    } catch (error) {
      console.error('Erro ao recuperar imagem local:', error);
      return null;
    }
  }
};