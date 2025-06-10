import React, { useEffect, useState } from 'react';
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/hooks/use-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Settings from "@/pages/SettingsNew";
import CentralDeCadastros from "@/pages/CentralDeCadastros";
import Welcome from "@/pages/Welcome";
import Reports from "@/pages/Reports";
import Login from "@/pages/Login";
import UserManagement from "@/pages/UserManagementV2";
import Checklists from "@/pages/Checklists";
import NewChecklist from "@/pages/NewChecklist";
import ChecklistDetails from "@/pages/ChecklistDetails";
import ChecklistTemplates from "@/pages/ChecklistTemplates";
import ChecklistSimple from "@/pages/ChecklistSimple";
import AppConfig from "@/pages/AppConfig";
import RegistrationForm from "@/components/vehicles/RegistrationForm";
import { SideNavigation } from "@/components/vehicles/SideNavigation";
import { syncManager } from './services/syncManager';
import { useAuth, AuthUser } from './hooks/useAuth';

// Componente PrivateRoute para proteger rotas
interface PrivateRouteProps {
  component: React.ComponentType<any>;
  path: string;
  permission?: string;
  exact?: boolean;
}

function PrivateRoute({ component: Component, permission, ...rest }: PrivateRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      if (rest.path && !rest.path.startsWith('/api') && rest.path !== '/login') {
        console.log(`PrivateRoute: Not authenticated, redirecting to /login. Attempted path: ${rest.path}`);
      }
      setLocation("/login");
    }
  }, [isAuthenticated, isLoading, setLocation, rest.path]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><p>Loading authentication...</p></div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (permission) {
    const typedUser = user as AuthUser | undefined;
    const userPermissions = typedUser?.role?.permissions;

    if (!userPermissions || !userPermissions[permission]) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-4">
            Você não tem permissão para acessar esta página.
          </p>
          <Button
            onClick={() => setLocation("/")}
            className="bg-blue-700 hover:bg-blue-800"
          >
            Voltar para a página inicial
          </Button>
        </div>
      );
    }
  }

  return <Route {...rest} component={Component} />;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  // Log para debug
  useEffect(() => {
    console.log('Router State:', {
      isAuthenticated,
      isLoading,
      location
    });
  }, [isAuthenticated, isLoading, location]);

  // CORREÇÃO PRINCIPAL: Redirecionamento imediato para login quando não autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticated && location !== '/login') {
      console.log('🔄 Redirecionando para /login...');
      setLocation('/login');
    }
  }, [isLoading, isAuthenticated, location, setLocation]);

  // Mostra loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado, mostra apenas as rotas públicas
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/:rest*" component={Login} /> {/* Qualquer outra rota vai para login */}
        </Switch>
      </div>
    );
  }

  // Se está autenticado, mostra a aplicação principal
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <SideNavigation />
      <main className="flex-grow lg:ml-64 px-4 py-6 pb-12">
        <div className="max-w-6xl mx-auto">
          <Switch>
            <PrivateRoute path="/" component={Welcome} />
            <PrivateRoute path="/registros/edit/:id" component={RegistrationForm} permission="registrations" />
            <PrivateRoute path="/registros/dashboard" component={Home} permission="dashboard" />
            <PrivateRoute path="/registros/history" component={Home} permission="history" />
            <PrivateRoute path="/registros" component={Home} permission="registrations" />
            <PrivateRoute path="/relatorios" component={Reports} permission="reports" />
            <PrivateRoute path="/configuracoes" component={Settings} permission="settings" />
            <PrivateRoute path="/cadastros" component={CentralDeCadastros} permission="settings" />
            <PrivateRoute path="/configuracoes/app" component={AppConfig} permission="settings" />
            <PrivateRoute path="/usuarios" component={UserManagement} permission="userManagement" />
            <PrivateRoute path="/checklists" component={ChecklistSimple} permission="checklists" />
            <PrivateRoute path="/checklists/new" component={NewChecklist} permission="checklists" />
            <PrivateRoute path="/checklists/edit/:id" component={NewChecklist} permission="checklists" />
            <PrivateRoute path="/checklists/:id" component={ChecklistDetails} permission="checklists" />
            <PrivateRoute path="/checklist-templates" component={ChecklistTemplates} permission="settings" />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
    </div>
  );
}

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);

  useEffect(() => {
    // Inicializa o gerenciador de sincronização
    syncManager.start();

    // Monitora mudanças no status online/offline
    const unsubscribe = syncManager.addConnectionListener((online) => {
      setIsOnline(online);
      console.log(`Status da conexão alterado: ${online ? 'online' : 'offline'}`);
    });

    // Função para verificar operações pendentes
    const checkPendingOps = async () => {
      if (window.indexedDB) {
        try {
          const db = await window.indexedDB.open('granduvale_offline_db', 1);
          db.onsuccess = () => {
            const transaction = db.result.transaction(['pendingOperations'], 'readonly');
            const store = transaction.objectStore('pendingOperations');
            const countRequest = store.count();

            countRequest.onsuccess = () => {
              setPendingSync(countRequest.result);
            };
          };
        } catch (err) {
          console.error('Erro ao verificar operações pendentes:', err);
        }
      }
    };

    // Verificar operações pendentes inicialmente e a cada 30 segundos
    checkPendingOps();
    const intervalId = setInterval(checkPendingOps, 30000);

    // Adicionar listener para mensagens do service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && (event.data.type === 'SYNC_COMPLETED' || event.data.type === 'SYNC_SUCCESS')) {
          checkPendingOps();
        }
      });
    }

    // Limpa listeners e intervalos quando o componente é desmontado
    return () => {
      unsubscribe();
      syncManager.stop();
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    // Configurar listener para mensagens do Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'START_SYNC') {
          // Iniciar sincronização quando solicitado pelo service worker
          syncManager.syncPendingOperations();
        }
      });
    }

    // Verificar dados pendentes na inicialização
    syncManager.checkPendingOperations();

    // Registrar ouvintes para mudanças de status de conexão
    const handleOnlineStatus = (online: boolean) => {
      setIsOnline(online);

      // Notificar o usuário sobre o status da conexão
      if (online) {
        console.log("Application came online. Refetching user authentication status.");
        queryClient.refetchQueries({ queryKey: ['/api/auth/user'] })
          .then(() => console.log("User authentication status refetched."))
          .catch(err => console.error("Error refetching user authentication status:", err));

        toast({
          title: "Você está online",
          description: "Sincronizando e verificando status da sessão.",
          duration: 3000,
        });
      } else {
        toast({
          title: "Você está offline",
          description: "Seus dados serão salvos localmente e sincronizados quando a conexão for restaurada.",
          duration: 5000,
          variant: "destructive"
        });
      }
    };

    // Registrar listener para notificações de sincronização
    const handleSyncStatus = (hasPendingOperations: boolean) => {
      if (hasPendingOperations && isOnline) {
        toast({
          title: "Sincronizando dados",
          description: "Estamos enviando suas alterações para o servidor...",
          duration: 3000,
        });
      }
    };

    // Adicionar listeners ao syncManager
    syncManager.addOnlineStatusListener(handleOnlineStatus);
    syncManager.addSyncListener(handleSyncStatus);

    // Definir status inicial
    setIsOnline(syncManager.getOnlineStatus());

    // Limpar event listeners ao desmontar o componente
    return () => {
      syncManager.removeOnlineStatusListener(handleOnlineStatus);
      syncManager.removeSyncListener(handleSyncStatus);
    };
  }, [isOnline]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        {!isOnline && (
          <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-2 text-center z-50">
            Você está offline. Os dados serão sincronizados quando a conexão for restabelecida.
          </div>
        )}
        {isOnline && pendingSync > 0 && (
          <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white p-2 text-center z-50">
            Sincronizando {pendingSync} operações pendentes...
          </div>
        )}
        <div className={`${(!isOnline || (isOnline && pendingSync > 0)) ? 'pt-10' : ''}`}>
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;