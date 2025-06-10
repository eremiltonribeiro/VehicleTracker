import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

import Dashboard from "@/pages/Dashboard";
import VehicleManagement from "@/pages/VehicleManagement";
import MaintenanceScheduling from "@/pages/MaintenanceScheduling";
import MaintenanceHistory from "@/pages/MaintenanceHistory";
import Reports from "@/pages/Reports";
import UserManagementV2 from "@/pages/UserManagementV2";
import Login from "@/pages/Login";
import { SideNavigation } from "@/components/vehicles/SideNavigation";
import { Toaster } from "@/components/ui/toaster";
import { useAuth, AuthUser } from "@/hooks/useAuth";

// Criar cliente do React Query com configurações otimizadas
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Não retry em erros 401/403
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Componente para loading centralizado
function LoadingScreen({ message = "Carregando...", subtitle }: { message?: string; subtitle?: string }) {
  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">{message}</p>
        {subtitle && <p className="text-gray-500 text-sm mt-2">{subtitle}</p>}
      </div>
    </div>
  );
}

// Componente para rotas protegidas
function PrivateRoute({ 
  children, 
  permission, 
  path 
}: { 
  children: React.ReactNode; 
  permission?: string; 
  path?: string;
}) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) {
      console.log('⏳ PrivateRoute: Aguardando verificação de autenticação...');
      return;
    }

    if (!isAuthenticated) {
      console.log(`🔒 PrivateRoute: Usuário não autenticado. Rota: ${path || 'unknown'}`);
      setLocation("/login");
      return;
    }

    console.log(`✅ PrivateRoute: Usuário autenticado para rota: ${path || 'unknown'}`);
  }, [isAuthenticated, isLoading, setLocation, path]);

  if (isLoading) {
    return <LoadingScreen message="Verificando autenticação..." />;
  }

  if (!isAuthenticated) {
    return null; // Vai redirecionar
  }

  // Verificar permissões se necessário
  if (permission) {
    const typedUser = user as AuthUser | undefined;
    const userPermissions = typedUser?.role?.permissions;

    console.log(`🔐 Verificando permissão '${permission}' para usuário:`, {
      hasRole: !!typedUser?.role,
      permissions: userPermissions,
      hasPermission: userPermissions?.[permission]
    });

    if (!userPermissions || !userPermissions[permission]) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h1>
            <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
            <p className="text-gray-500 text-sm mt-2">Permissão necessária: {permission}</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}

// Componente principal do roteador
function AppRouter() {
  const { isAuthenticated, isLoading, error } = useAuth();
  const [location, setLocation] = useLocation();
  const [hasInitialized, setHasInitialized] = useState(false);

  // Log detalhado para debug
  useEffect(() => {
    console.log('🔍 Router State Update:', {
      isAuthenticated,
      isLoading,
      hasError: !!error,
      location,
      hasInitialized,
      timestamp: new Date().toISOString()
    });
  }, [isAuthenticated, isLoading, location, error, hasInitialized]);

  // Marcar como inicializado após primeira verificação
  useEffect(() => {
    if (!isLoading && !hasInitialized) {
      console.log('🏁 App inicializado');
      setHasInitialized(true);
    }
  }, [isLoading, hasInitialized]);

  // Redirecionamento para login quando não autenticado
  useEffect(() => {
    if (!isLoading && hasInitialized && !isAuthenticated && location !== '/login') {
      console.log('🔄 Redirecionando para /login - usuário não autenticado');
      setLocation('/login');
    }
  }, [isLoading, isAuthenticated, location, setLocation, hasInitialized]);

  // Redirecionamento da página de login quando autenticado
  useEffect(() => {
    if (!isLoading && hasInitialized && isAuthenticated && location === '/login') {
      console.log('🔄 Redirecionando para / - usuário já autenticado');
      setLocation('/');
    }
  }, [isLoading, isAuthenticated, location, setLocation, hasInitialized]);

  // Mostrar loading durante verificação inicial de autenticação
  if (isLoading || !hasInitialized) {
    return <LoadingScreen message="Inicializando aplicação..." subtitle="Verificando autenticação" />;
  }

  // Se não autenticado, mostrar apenas a página de login
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route>
          <Login />
        </Route>
      </Switch>
    );
  }

  // Se autenticado, mostrar a aplicação completa
  return (
    <div className="flex h-screen bg-gray-100">
      <SideNavigation />
      <main className="flex-1 overflow-auto">
        <Switch>
          <Route path="/login">
            <div className="flex justify-center items-center h-full">
              <div className="text-center">
                <p className="text-gray-600">Você já está logado. Redirecionando...</p>
              </div>
            </div>
          </Route>

          <Route path="/">
            <PrivateRoute path="/">
              <Dashboard />
            </PrivateRoute>
          </Route>

          <Route path="/vehicles">
            <PrivateRoute path="/vehicles">
              <VehicleManagement />
            </PrivateRoute>
          </Route>

          <Route path="/maintenance">
            <PrivateRoute path="/maintenance">
              <MaintenanceScheduling />
            </PrivateRoute>
          </Route>

          <Route path="/maintenance-history">
            <PrivateRoute path="/maintenance-history">
              <MaintenanceHistory />
            </PrivateRoute>
          </Route>

          <Route path="/reports">
            <PrivateRoute path="/reports">
              <Reports />
            </PrivateRoute>
          </Route>

          <Route path="/users">
            <PrivateRoute path="/users" permission="userManagement">
              <UserManagementV2 />
            </PrivateRoute>
          </Route>

          <Route>
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Página não encontrada</h1>
                <p className="text-gray-600">A página que você procura não existe.</p>
                <button 
                  onClick={() => setLocation('/')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Voltar ao Dashboard
                </button>
              </div>
            </div>
          </Route>
        </Switch>
      </main>
    </div>
  );
}

// Componente principal da aplicação
function App() {
  useEffect(() => {
    console.log('🚀 Iniciando aplicação...');
    console.log('📍 URL:', window.location.href);
    console.log('🌐 Online:', navigator.onLine);

    // Verificar se há elementos necessários
    const rootElement = document.getElementById('root');
    if (rootElement) {
      console.log('✅ Elemento root encontrado');
    } else {
      console.error('❌ Elemento root não encontrado!');
    }

    console.log('✅ React inicializado com sucesso');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
      <Toaster />
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

export default App;