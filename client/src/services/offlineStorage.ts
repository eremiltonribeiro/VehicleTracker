import localforage from 'localforage';

// Configure localforage
localforage.config({
  name: 'fleet-management-system',
  storeName: 'registrations'
});

// Services for offline data management
export const offlineStorage = {
  // Save registrations to local storage
  async saveRegistrations(registrations: any[]): Promise<void> {
    try {
      await localforage.setItem('registrations', registrations);
      console.log('Registros salvos localmente');
    } catch (error) {
      console.error('Erro ao salvar registros localmente:', error);
    }
  },

  // Get registrations from local storage
  async getRegistrations(): Promise<any[]> {
    try {
      const registrations = await localforage.getItem<any[]>('registrations');
      return registrations || [];
    } catch (error) {
      console.error('Erro ao recuperar registros locais:', error);
      return [];
    }
  },

  // Save a new registration locally
  async saveRegistration(registration: any): Promise<void> {
    try {
      const registrations = await this.getRegistrations();
      
      // Set a temporary ID if it doesn't have one
      if (!registration.id) {
        registration.id = `local_${Date.now()}`;
        registration.isOffline = true;
      }
      
      registrations.push(registration);
      await this.saveRegistrations(registrations);
    } catch (error) {
      console.error('Erro ao salvar registro localmente:', error);
    }
  },

  // Save vehicles data for offline use
  async saveVehicles(vehicles: any[]): Promise<void> {
    try {
      await localforage.setItem('vehicles', vehicles);
    } catch (error) {
      console.error('Erro ao salvar veículos localmente:', error);
    }
  },

  // Get vehicles from local storage
  async getVehicles(): Promise<any[]> {
    try {
      const vehicles = await localforage.getItem<any[]>('vehicles');
      return vehicles || [];
    } catch (error) {
      console.error('Erro ao recuperar veículos locais:', error);
      return [];
    }
  },

  // Save drivers data for offline use
  async saveDrivers(drivers: any[]): Promise<void> {
    try {
      await localforage.setItem('drivers', drivers);
    } catch (error) {
      console.error('Erro ao salvar motoristas localmente:', error);
    }
  },

  // Get drivers from local storage
  async getDrivers(): Promise<any[]> {
    try {
      const drivers = await localforage.getItem<any[]>('drivers');
      return drivers || [];
    } catch (error) {
      console.error('Erro ao recuperar motoristas locais:', error);
      return [];
    }
  },

  // Save fuel stations data for offline use
  async saveFuelStations(stations: any[]): Promise<void> {
    try {
      await localforage.setItem('fuelStations', stations);
    } catch (error) {
      console.error('Erro ao salvar postos localmente:', error);
    }
  },

  // Get fuel stations from local storage
  async getFuelStations(): Promise<any[]> {
    try {
      const stations = await localforage.getItem<any[]>('fuelStations');
      return stations || [];
    } catch (error) {
      console.error('Erro ao recuperar postos locais:', error);
      return [];
    }
  },

  // Save fuel types data for offline use
  async saveFuelTypes(types: any[]): Promise<void> {
    try {
      await localforage.setItem('fuelTypes', types);
    } catch (error) {
      console.error('Erro ao salvar tipos de combustível localmente:', error);
    }
  },

  // Get fuel types from local storage
  async getFuelTypes(): Promise<any[]> {
    try {
      const types = await localforage.getItem<any[]>('fuelTypes');
      return types || [];
    } catch (error) {
      console.error('Erro ao recuperar tipos de combustível locais:', error);
      return [];
    }
  },

  // Save maintenance types data for offline use
  async saveMaintenanceTypes(types: any[]): Promise<void> {
    try {
      await localforage.setItem('maintenanceTypes', types);
    } catch (error) {
      console.error('Erro ao salvar tipos de manutenção localmente:', error);
    }
  },

  // Get maintenance types from local storage
  async getMaintenanceTypes(): Promise<any[]> {
    try {
      const types = await localforage.getItem<any[]>('maintenanceTypes');
      return types || [];
    } catch (error) {
      console.error('Erro ao recuperar tipos de manutenção locais:', error);
      return [];
    }
  },

  // Synchronize offline data with server
  async syncWithServer(): Promise<boolean> {
    try {
      const registrations = await this.getRegistrations();
      const offlineRegistrations = registrations.filter(reg => reg.isOffline);
      
      if (offlineRegistrations.length === 0) {
        return true;
      }
      
      // For each offline registration, try to send to server
      for (const registration of offlineRegistrations) {
        try {
          // Create a copy without the offline flags
          const { isOffline, ...registrationData } = registration;
          
          // Try to upload any photos if present
          if (registration.photoData) {
            // Logic to upload image data would go here
          }
          
          // Send to server
          const res = await fetch('/api/registrations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(registrationData),
            credentials: 'include'
          });
          
          if (res.ok) {
            // Remove the synced registration
            const updatedRegistrations = registrations.filter(
              r => r.id !== registration.id
            );
            await this.saveRegistrations(updatedRegistrations);
          }
        } catch (error) {
          console.error('Erro ao sincronizar registro:', error);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Erro na sincronização:', error);
      return false;
    }
  },

  // Check online status
  isOnline(): boolean {
    return navigator.onLine;
  },

  // Save images for offline use
  async saveImage(id: string, imageData: string): Promise<void> {
    try {
      await localforage.setItem(`image_${id}`, imageData);
    } catch (error) {
      console.error('Erro ao salvar imagem localmente:', error);
    }
  },

  // Get image from local storage
  async getImage(id: string): Promise<string | null> {
    try {
      return await localforage.getItem<string>(`image_${id}`);
    } catch (error) {
      console.error('Erro ao recuperar imagem local:', error);
      return null;
    }
  }
};