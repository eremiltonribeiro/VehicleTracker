// Utilitários para gerenciamento de conectividade

export interface ConnectivityTestResult {
  isOnline: boolean;
  latency?: number;
  error?: string;
  timestamp: number;
}

export class ConnectivityManager {
  private static instance: ConnectivityManager;
  private lastTest: ConnectivityTestResult | null = null;
  private testTimeout: number = 5000;

  private constructor() {}

  public static getInstance(): ConnectivityManager {
    if (!ConnectivityManager.instance) {
      ConnectivityManager.instance = new ConnectivityManager();
    }
    return ConnectivityManager.instance;
  }

  /**
   * Testa conectividade com múltiplos métodos para maior precisão
   */
  public async testConnectivity(): Promise<ConnectivityTestResult> {
    const timestamp = Date.now();

    // Se navigator.onLine é false, nem tenta testar
    if (!navigator.onLine) {
      const result: ConnectivityTestResult = {
        isOnline: false,
        error: 'navigator.onLine is false',
        timestamp
      };
      this.lastTest = result;
      return result;
    }

    try {
      // Teste primário: endpoint da aplicação
      const primaryResult = await this.testPrimaryEndpoint();

      if (primaryResult.isOnline) {
        this.lastTest = primaryResult;
        return primaryResult;
      }

      // Se o teste primário falhou, tentar teste secundário
      console.log('[Connectivity] Teste primário falhou, tentando teste secundário...');
      const secondaryResult = await this.testSecondaryEndpoint();
      this.lastTest = secondaryResult;
      return secondaryResult;

    } catch (error) {
      const result: ConnectivityTestResult = {
        isOnline: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp
      };
      this.lastTest = result;
      return result;
    }
  }

  /**
   * Teste primário: endpoint da própria aplicação
   */
  private async testPrimaryEndpoint(): Promise<ConnectivityTestResult> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.testTimeout);

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

  /**
   * Teste secundário: recurso externo pequeno
   */
  private async testSecondaryEndpoint(): Promise<ConnectivityTestResult> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // Timeout menor para teste secundário

      // Usar múltiplos endpoints para maior confiabilidade
      const endpoints = [
        'https://www.google.com/favicon.ico',
        'https://httpbin.org/status/200',
        'https://jsonplaceholder.typicode.com/posts/1'
      ];

      // Tentar o primeiro endpoint disponível
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
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

  /**
   * Retorna o último resultado de teste
   */
  public getLastTestResult(): ConnectivityTestResult | null {
    return this.lastTest;
  }

  /**
   * Verifica se o último teste é recente (menos de 30 segundos)
   */
  public isLastTestRecent(): boolean {
    if (!this.lastTest) return false;
    return Date.now() - this.lastTest.timestamp < 30000;
  }

  /**
   * Detecta se estamos em um portal cativo
   * Portal cativo geralmente retorna HTML em vez de JSON para requisições de API
   */
  public async detectCaptivePortal(): Promise<boolean> {
    try {
      const response = await fetch('/api/ping', {
        method: 'GET', // GET para verificar conteúdo
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
          console.log('[Connectivity] Portal cativo detectado: resposta HTML em endpoint JSON');
          return true;
        }

        // Tentar ler como JSON
        try {
          await response.json();
          return false; // JSON válido, não é portal cativo
        } catch {
          console.log('[Connectivity] Portal cativo detectado: resposta não é JSON válido');
          return true;
        }
      }

      return false;
    } catch (error) {
      // Se não conseguimos fazer a requisição, não é portal cativo
      return false;
    }
  }

  /**
   * Teste de conectividade específico para desenvolvimento/debug
   */
  public async debugConnectivity(): Promise<void> {
    console.log('[Connectivity Debug] Iniciando testes de diagnóstico...');

    console.log('[Connectivity Debug] navigator.onLine:', navigator.onLine);

    const result = await this.testConnectivity();
    console.log('[Connectivity Debug] Resultado do teste:', result);

    const captivePortal = await this.detectCaptivePortal();
    console.log('[Connectivity Debug] Portal cativo detectado:', captivePortal);

    // Teste de latência para diferentes endpoints
    const endpoints = [
      '/api/ping',
      'https://www.google.com/favicon.ico',
      'https://httpbin.org/status/200'
    ];

    for (const endpoint of endpoints) {
      const startTime = Date.now();
      try {
        await fetch(endpoint, { 
          method: 'HEAD', 
          cache: 'no-store',
          mode: endpoint.startsWith('http') ? 'no-cors' : 'cors'
        });
        const latency = Date.now() - startTime;
        console.log(`[Connectivity Debug] ${endpoint}: ${latency}ms`);
      } catch (error) {
        console.log(`[Connectivity Debug] ${endpoint}: FAILED -`, error);
      }
    }
  }
}

// Instância singleton
export const connectivityManager = ConnectivityManager.getInstance();

// Utilitário para criar debounce de testes de conectividade
export function createConnectivityDebouncer(delay: number = 1000) {
  let timeoutId: number | null = null;

  return (callback: () => void) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = window.setTimeout(callback, delay);
  };
}

// Tipos para eventos de conectividade
export interface ConnectivityEvent {
  type: 'online' | 'offline' | 'poor' | 'good';
  details: ConnectivityTestResult;
}

// Event emitter simples para conectividade
export class ConnectivityEventEmitter {
  private listeners: Array<(event: ConnectivityEvent) => void> = [];

  public addEventListener(listener: (event: ConnectivityEvent) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public emit(event: ConnectivityEvent) {
    this.listeners.forEach(listener => listener(event));
  }
}

export const connectivityEmitter = new ConnectivityEventEmitter();