import { useEffect, useState } from 'react';
import { notificationService } from '@/services/notificationService';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isOnline: boolean;
  updateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isOnline: navigator.onLine,
    updateAvailable: false,
    registration: null,
  });

  useEffect(() => {
    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.log('Service Workers not supported');
      return;
    }

    setState(prev => ({ ...prev, isSupported: true }));

    // Register service worker
    registerServiceWorker();

    // Listen for online/offline events
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      notificationService.notifyOnlineMode();
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
      notificationService.notifyOfflineMode();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for service worker messages
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      setState(prev => ({ ...prev, isRegistered: true, registration }));

      console.log('Service Worker registered successfully:', registration);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is available
              setState(prev => ({ ...prev, updateAvailable: true }));
              notificationService.notify({
                title: 'Atualização Disponível',
                message: 'Uma nova versão do aplicativo está disponível.',
                type: 'info',
                actionLabel: 'Atualizar',
              });
            }
          });
        }
      });

      // Auto-update check every 60 minutes
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  };

  const handleServiceWorkerMessage = (event: MessageEvent) => {
    const { data } = event;
    
    switch (data.type) {
      case 'NETWORK_SUCCESS':
        console.log('Service Worker: Network request successful', data.url);
        break;
        
      case 'CACHE_USED':
        console.log('Service Worker: Using cached data', data.url);
        // Could show a subtle indicator that cached data is being used
        break;
        
      case 'OFFLINE_ERROR':
        console.log('Service Worker: Offline error', data.url);
        notificationService.notifyError(
          'Conexão Indisponível',
          'Alguns dados podem não estar atualizados.'
        );
        break;
        
      case 'SYNC_COMPLETED':
        console.log('Service Worker: Background sync completed');
        notificationService.notify({
          title: 'Dados Sincronizados',
          message: 'Seus dados offline foram sincronizados com sucesso.',
          type: 'success',
        });
        break;
        
      default:
        console.log('Service Worker: Unknown message type', data.type);
    }
  };

  const updateServiceWorker = async () => {
    if (state.registration) {
      const newWorker = state.registration.waiting;
      
      if (newWorker) {
        newWorker.postMessage({ type: 'SKIP_WAITING' });
        
        // Reload the page to activate the new service worker
        window.location.reload();
      }
    }
  };

  const syncData = async () => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (registration && 'sync' in registration) {
        // Register background sync
        await (registration as any).sync.register('fuel-record-sync');
        console.log('Background sync registered');
      }
    }
  };

  // PWA install functionality
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPWAInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsPWAInstalled(true);
      setInstallPrompt(null);
      notificationService.notify({
        title: 'App Instalado',
        message: 'Vehicle Tracker foi instalado com sucesso!',
        type: 'success',
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPWA = async () => {
    if (installPrompt) {
      const result = await installPrompt.prompt();
      console.log('PWA install prompt result:', result);
      setInstallPrompt(null);
    }
  };

  return {
    ...state,
    updateServiceWorker,
    syncData,
    installPWA,
    canInstall: !!installPrompt && !isPWAInstalled,
    isPWAInstalled,
  };
}

// Utility function to check if the app is running as PWA
export function isPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
}

// Utility function to check if the device supports PWA features
export function supportsPWA(): boolean {
  return 'serviceWorker' in navigator && 
         'manifest' in document.documentElement &&
         'PushManager' in window;
}
