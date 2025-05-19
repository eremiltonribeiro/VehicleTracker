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
   */
  async saveRegistration(registration: any): Promise<void> {
    try {
      const existingRegistrations = await this.getRegistrations();
      
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
      
      await this.saveRegistrations(existingRegistrations);
    } catch (error) {
      console.error('Erro ao salvar registro individual:', error);
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
  async syncWithServer(): Promise<boolean> {
    // Esta função será implementada para enviar dados armazenados offline
    // ao servidor quando a conexão for restabelecida
    if (!navigator.onLine) {
      return false;
    }
    
    try {
      // Aqui seria implementada a lógica real de sincronização com o servidor
      // Envio de dados armazenados localmente para API
      return true;
    } catch (error) {
      console.error('Erro ao sincronizar com servidor:', error);
      return false;
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