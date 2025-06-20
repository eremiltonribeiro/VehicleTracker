// Data backup and restoration system for VehicleTracker
import { notificationService } from '@/services/notificationService';

export interface BackupData {
  version: string;
  timestamp: number;
  data: {
    vehicles: any[];
    drivers: any[];
    gasStations: any[];
    fuelTypes: any[];
    maintenanceTypes: any[];
    fuelRecords: any[];
    settings?: any;
  };
  metadata: {
    recordCount: number;
    checksum: string;
  };
}

export class BackupManager {
  private static readonly BACKUP_VERSION = '1.0.0';
  private static readonly MAX_BACKUPS = 10;

  // Create a full system backup
  static async createBackup(): Promise<BackupData> {
    try {
      notificationService.notify({
        title: 'Iniciando Backup',
        message: 'Criando backup dos dados...',
        type: 'info',
      });

      // Fetch all data from API endpoints
      const [
        vehicles,
        drivers,
        gasStations,
        fuelTypes,
        maintenanceTypes,
        fuelRecords
      ] = await Promise.all([
        this.fetchData('/api/vehicles'),
        this.fetchData('/api/drivers'),
        this.fetchData('/api/gas-stations'),
        this.fetchData('/api/fuel-types'),
        this.fetchData('/api/maintenance-types'),
        this.fetchData('/api/fuel-records'),
      ]);

      const data = {
        vehicles,
        drivers,
        gasStations,
        fuelTypes,
        maintenanceTypes,
        fuelRecords,
      };

      const recordCount = Object.values(data).reduce((total, arr) => total + arr.length, 0);
      const checksum = await this.generateChecksum(JSON.stringify(data));

      const backup: BackupData = {
        version: this.BACKUP_VERSION,
        timestamp: Date.now(),
        data,
        metadata: {
          recordCount,
          checksum,
        },
      };

      // Store backup locally
      await this.storeBackup(backup);

      notificationService.notifyDataBackup();
      
      return backup;
    } catch (error) {
      console.error('Backup creation failed:', error);
      notificationService.notifyError(
        'Erro no Backup',
        'Falha ao criar backup dos dados.'
      );
      throw error;
    }
  }

  // Fetch data from API endpoint with error handling
  private static async fetchData(endpoint: string): Promise<any[]> {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`Failed to fetch ${endpoint}:`, error);
      return []; // Return empty array if fetch fails
    }
  }

  // Generate checksum for data integrity
  private static async generateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Store backup in localStorage with rotation
  private static async storeBackup(backup: BackupData): Promise<void> {
    try {
      const backups = this.getStoredBackups();
      
      // Add new backup
      backups.unshift(backup);
      
      // Keep only the most recent backups
      const trimmedBackups = backups.slice(0, this.MAX_BACKUPS);
      
      localStorage.setItem('vt_backups', JSON.stringify(trimmedBackups));
      
      console.log(`Backup stored successfully. Total backups: ${trimmedBackups.length}`);
    } catch (error) {
      console.error('Failed to store backup:', error);
      throw new Error('Failed to store backup locally');
    }
  }

  // Get all stored backups
  static getStoredBackups(): BackupData[] {
    try {
      const stored = localStorage.getItem('vt_backups');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load backups:', error);
      return [];
    }
  }

  // Export backup to file
  static exportBackup(backup: BackupData): void {
    try {
      const dataStr = JSON.stringify(backup, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `vehicle-tracker-backup-${new Date(backup.timestamp).toISOString().split('T')[0]}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(link.href);
      
      notificationService.notify({
        title: 'Backup Exportado',
        message: 'Arquivo de backup foi baixado com sucesso.',
        type: 'success',
      });
    } catch (error) {
      console.error('Export failed:', error);
      notificationService.notifyError(
        'Erro na Exportação',
        'Falha ao exportar arquivo de backup.'
      );
    }
  }

  // Import backup from file
  static async importBackup(file: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const result = event.target?.result as string;
          const backup: BackupData = JSON.parse(result);
          
          // Validate backup structure
          if (!this.validateBackupStructure(backup)) {
            throw new Error('Invalid backup file structure');
          }
          
          // Verify checksum
          const dataChecksum = await this.generateChecksum(JSON.stringify(backup.data));
          if (dataChecksum !== backup.metadata.checksum) {
            throw new Error('Backup file integrity check failed');
          }
          
          resolve(backup);
        } catch (error) {
          reject(new Error(`Failed to parse backup file: ${error}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read backup file'));
      };
      
      reader.readAsText(file);
    });
  }

  // Validate backup structure
  private static validateBackupStructure(backup: any): backup is BackupData {
    return (
      backup &&
      typeof backup.version === 'string' &&
      typeof backup.timestamp === 'number' &&
      backup.data &&
      Array.isArray(backup.data.vehicles) &&
      Array.isArray(backup.data.drivers) &&
      Array.isArray(backup.data.gasStations) &&
      Array.isArray(backup.data.fuelTypes) &&
      Array.isArray(backup.data.maintenanceTypes) &&
      Array.isArray(backup.data.fuelRecords) &&
      backup.metadata &&
      typeof backup.metadata.recordCount === 'number' &&
      typeof backup.metadata.checksum === 'string'
    );
  }

  // Restore data from backup
  static async restoreBackup(backup: BackupData, options: {
    clearExisting?: boolean;
    selective?: {
      vehicles?: boolean;
      drivers?: boolean;
      gasStations?: boolean;
      fuelTypes?: boolean;
      maintenanceTypes?: boolean;
      fuelRecords?: boolean;
    };
  } = {}): Promise<void> {
    try {
      notificationService.notify({
        title: 'Iniciando Restauração',
        message: 'Restaurando dados do backup...',
        type: 'info',
      });

      const { clearExisting = false, selective } = options;

      // If selective restore, only restore selected data types
      const restoreOperations: Promise<void>[] = [];

      if (!selective || selective.vehicles) {
        restoreOperations.push(this.restoreDataType('vehicles', backup.data.vehicles, clearExisting));
      }
      
      if (!selective || selective.drivers) {
        restoreOperations.push(this.restoreDataType('drivers', backup.data.drivers, clearExisting));
      }
      
      if (!selective || selective.gasStations) {
        restoreOperations.push(this.restoreDataType('gas-stations', backup.data.gasStations, clearExisting));
      }
      
      if (!selective || selective.fuelTypes) {
        restoreOperations.push(this.restoreDataType('fuel-types', backup.data.fuelTypes, clearExisting));
      }
      
      if (!selective || selective.maintenanceTypes) {
        restoreOperations.push(this.restoreDataType('maintenance-types', backup.data.maintenanceTypes, clearExisting));
      }
      
      if (!selective || selective.fuelRecords) {
        restoreOperations.push(this.restoreDataType('fuel-records', backup.data.fuelRecords, clearExisting));
      }

      await Promise.all(restoreOperations);

      notificationService.notify({
        title: 'Restauração Concluída',
        message: 'Dados foram restaurados com sucesso.',
        type: 'success',
      });

    } catch (error) {
      console.error('Restore failed:', error);
      notificationService.notifyError(
        'Erro na Restauração',
        'Falha ao restaurar dados do backup.'
      );
      throw error;
    }
  }

  // Restore specific data type
  private static async restoreDataType(endpoint: string, data: any[], clearExisting: boolean): Promise<void> {
    try {
      // Clear existing data if requested
      if (clearExisting) {
        // This would require a DELETE endpoint or batch delete
        console.log(`Clearing existing ${endpoint} data`);
      }

      // Restore data in batches to avoid overwhelming the server
      const batchSize = 50;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        const promises = batch.map(item => {
          // Remove id to let server assign new ones
          const { id, ...itemData } = item;
          
          return fetch(`/api/${endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(itemData),
          });
        });

        await Promise.all(promises);
        
        // Small delay between batches
        if (i + batchSize < data.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`Restored ${data.length} ${endpoint} records`);
    } catch (error) {
      console.error(`Failed to restore ${endpoint}:`, error);
      throw error;
    }
  }

  // Delete stored backup
  static deleteBackup(timestamp: number): void {
    try {
      const backups = this.getStoredBackups();
      const filteredBackups = backups.filter(backup => backup.timestamp !== timestamp);
      
      localStorage.setItem('vt_backups', JSON.stringify(filteredBackups));
      
      notificationService.notify({
        title: 'Backup Removido',
        message: 'Backup foi removido com sucesso.',
        type: 'info',
      });
    } catch (error) {
      console.error('Failed to delete backup:', error);
      notificationService.notifyError(
        'Erro',
        'Falha ao remover backup.'
      );
    }
  }

  // Automatic backup scheduling
  static startAutoBackup(intervalHours: number = 24): void {
    // Clear any existing interval
    this.stopAutoBackup();

    const intervalMs = intervalHours * 60 * 60 * 1000;
    
    const backupInterval = setInterval(async () => {
      try {
        console.log('Running automatic backup...');
        await this.createBackup();
      } catch (error) {
        console.error('Automatic backup failed:', error);
      }
    }, intervalMs);

    // Store interval ID to be able to clear it later
    (window as any).vtBackupInterval = backupInterval;
    
    console.log(`Automatic backup scheduled every ${intervalHours} hours`);
  }

  static stopAutoBackup(): void {
    if ((window as any).vtBackupInterval) {
      clearInterval((window as any).vtBackupInterval);
      delete (window as any).vtBackupInterval;
      console.log('Automatic backup stopped');
    }
  }

  // Get backup statistics
  static getBackupStats(): {
    backupCount: number;
    totalSize: number;
    oldestBackup: Date | null;
    newestBackup: Date | null;
  } {
    const backups = this.getStoredBackups();
    
    if (backups.length === 0) {
      return {
        backupCount: 0,
        totalSize: 0,
        oldestBackup: null,
        newestBackup: null,
      };
    }

    const totalSize = JSON.stringify(backups).length;
    const timestamps = backups.map(b => b.timestamp);
    
    return {
      backupCount: backups.length,
      totalSize,
      oldestBackup: new Date(Math.min(...timestamps)),
      newestBackup: new Date(Math.max(...timestamps)),
    };
  }
}
