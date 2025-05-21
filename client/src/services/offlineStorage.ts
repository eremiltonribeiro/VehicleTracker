
// Classe para gerenciar o armazenamento offline usando IndexedDB
class OfflineStorage {
  private dbName = 'granduvale_offline_db';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  
  constructor() {
    this.initDatabase();
  }
  
  // Inicializa o banco de dados
  private async initDatabase(): Promise<void> {
    if (this.db) return;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Armazena operações pendentes
        if (!db.objectStoreNames.contains('pendingOperations')) {
          const store = db.createObjectStore('pendingOperations', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }
        
        // Armazena dados offline (cache de entidades)
        if (!db.objectStoreNames.contains('offlineData')) {
          const store = db.createObjectStore('offlineData', { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // Armazena imagens/arquivos
        if (!db.objectStoreNames.contains('offlineFiles')) {
          const store = db.createObjectStore('offlineFiles', { keyPath: 'id' });
          store.createIndex('entityId', 'entityId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
      
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        console.log('IndexedDB inicializado com sucesso');
        resolve();
      };
      
      request.onerror = (event) => {
        console.error('Erro ao inicializar IndexedDB:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }
  
  // Garante que o banco de dados está inicializado
  private async ensureDbReady(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDatabase();
    }
    
    if (!this.db) {
      throw new Error('Não foi possível inicializar o banco de dados offline');
    }
    
    return this.db;
  }
  
  // Armazena uma operação pendente
  public async savePendingOperation(operation: any): Promise<void> {
    const db = await this.ensureDbReady();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingOperations'], 'readwrite');
      const store = transaction.objectStore('pendingOperations');
      
      const request = store.put(operation);
      
      request.onsuccess = () => {
        console.log(`Operação ${operation.id} salva com sucesso para sincronização futura`);
        resolve();
      };
      
      request.onerror = (event) => {
        console.error('Erro ao salvar operação pendente:', (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  }
  
  // Atualiza o status de uma operação
  public async updateOperationStatus(id: string, status: string, errorMessage?: string): Promise<void> {
    const db = await this.ensureDbReady();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingOperations'], 'readwrite');
      const store = transaction.objectStore('pendingOperations');
      
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const operation = getRequest.result;
        if (operation) {
          operation.status = status;
          if (errorMessage) {
            operation.errorMessage = errorMessage;
          }
          
          const updateRequest = store.put(operation);
          
          updateRequest.onsuccess = () => {
            resolve();
          };
          
          updateRequest.onerror = (event) => {
            reject((event.target as IDBRequest).error);
          };
        } else {
          reject(new Error(`Operação ${id} não encontrada`));
        }
      };
      
      getRequest.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  }
  
  // Atualiza o contador de tentativas de uma operação
  public async updateOperationRetry(id: string, retryCount: number, errorMessage?: string): Promise<void> {
    const db = await this.ensureDbReady();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingOperations'], 'readwrite');
      const store = transaction.objectStore('pendingOperations');
      
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const operation = getRequest.result;
        if (operation) {
          operation.retryCount = retryCount;
          operation.status = 'pending'; // Reseta para pendente para tentar novamente
          if (errorMessage) {
            operation.errorMessage = errorMessage;
          }
          
          const updateRequest = store.put(operation);
          
          updateRequest.onsuccess = () => {
            resolve();
          };
          
          updateRequest.onerror = (event) => {
            reject((event.target as IDBRequest).error);
          };
        } else {
          reject(new Error(`Operação ${id} não encontrada`));
        }
      };
      
      getRequest.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  }
  
  // Remove uma operação pendente
  public async removePendingOperation(id: string): Promise<void> {
    const db = await this.ensureDbReady();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingOperations'], 'readwrite');
      const store = transaction.objectStore('pendingOperations');
      
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  }
  
  // Obtém todas as operações pendentes
  public async getPendingOperations(): Promise<any[]> {
    const db = await this.ensureDbReady();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingOperations'], 'readonly');
      const store = transaction.objectStore('pendingOperations');
      
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  }
  
  // Armazena dados offline (cache)
  public async saveOfflineData(type: string, data: any): Promise<void> {
    const db = await this.ensureDbReady();
    
    // Garante que temos um ID único
    if (!data.id) {
      data.id = `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    
    // Adiciona tipo e timestamp
    data.type = type;
    data.timestamp = Date.now();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offlineData'], 'readwrite');
      const store = transaction.objectStore('offlineData');
      
      const request = store.put(data);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  }
  
  // Obtém dados offline por tipo
  public async getOfflineDataByType(type: string): Promise<any[]> {
    const db = await this.ensureDbReady();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offlineData'], 'readonly');
      const store = transaction.objectStore('offlineData');
      const index = store.index('type');
      
      const request = index.getAll(type);
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  }
  
  // Salva um arquivo offline
  public async saveOfflineFile(entityId: string, file: File): Promise<string> {
    const db = await this.ensureDbReady();
    
    return new Promise((resolve, reject) => {
      // Converte o arquivo para um ArrayBuffer
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        if (!event.target || !event.target.result) {
          reject(new Error('Falha ao ler o arquivo'));
          return;
        }
        
        const fileData = {
          id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          entityId,
          name: file.name,
          type: file.type,
          size: file.size,
          data: event.target.result,
          timestamp: Date.now()
        };
        
        const transaction = db.transaction(['offlineFiles'], 'readwrite');
        const store = transaction.objectStore('offlineFiles');
        
        const request = store.put(fileData);
        
        request.onsuccess = () => {
          resolve(fileData.id);
        };
        
        request.onerror = (event) => {
          reject((event.target as IDBRequest).error);
        };
      };
      
      reader.onerror = (event) => {
        reject(new Error('Erro ao ler o arquivo: ' + (event.target?.error?.message || 'Erro desconhecido')));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }
  
  // Obtém um arquivo offline
  public async getOfflineFile(id: string): Promise<{ data: ArrayBuffer, name: string, type: string }> {
    const db = await this.ensureDbReady();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offlineFiles'], 'readonly');
      const store = transaction.objectStore('offlineFiles');
      
      const request = store.get(id);
      
      request.onsuccess = () => {
        if (request.result) {
          resolve({
            data: request.result.data,
            name: request.result.name,
            type: request.result.type
          });
        } else {
          reject(new Error(`Arquivo ${id} não encontrado`));
        }
      };
      
      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  }
  
  // Obtém arquivos por entidade
  public async getOfflineFilesByEntity(entityId: string): Promise<any[]> {
    const db = await this.ensureDbReady();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offlineFiles'], 'readonly');
      const store = transaction.objectStore('offlineFiles');
      const index = store.index('entityId');
      
      const request = index.getAll(entityId);
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  }
  
  // Remove um arquivo offline
  public async removeOfflineFile(id: string): Promise<void> {
    const db = await this.ensureDbReady();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offlineFiles'], 'readwrite');
      const store = transaction.objectStore('offlineFiles');
      
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  }
}

export const offlineStorage = new OfflineStorage();
