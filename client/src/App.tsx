import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect, useState, lazy, Suspense } from "react";

// Lazy load ReactQueryDevtools only in development
const ReactQueryDevtools = lazy(() =>
  process.env.NODE_ENV === 'development'
    ? import("@tanstack/react-query-devtools").then(module => ({
        default: module.ReactQueryDevtools
      }))
    : Promise.resolve({ default: () => null })
);

import Portal from "@/pages/Portal";
import Home from "@/pages/Home";
import VehicleDetail from "@/pages/VehicleDetail";
import DriverDetail from "@/pages/DriverDetail";
import Checklists from "@/pages/Checklists";
import SimpleChecklists from "@/pages/SimpleChecklists";
import Reports from "@/pages/Reports";
import SimpleReports from "@/pages/SimpleReports";
import SimpleCadastros from "@/pages/SimpleCadastros";
import Cadastros from "@/pages/Cadastros";
import SimpleConfiguracoes from "@/pages/SimpleConfiguracoes";
import SimpleUsuarios from "@/pages/SimpleUsuarios";
import UserManagementV2 from "@/pages/UserManagementV2";
import Login from "@/pages/Login";
import CentralDeCadastros from "@/pages/CentralDeCadastros";
import ChecklistDetails from "@/pages/ChecklistDetails";
import ChecklistSimple from "@/pages/ChecklistSimple";
import ChecklistTemplates from "@/pages/ChecklistTemplates";
import NewChecklist from "@/pages/NewChecklist";
import Settings from "@/pages/Settings";
import SettingsNew from "@/pages/SettingsNew";
import ConfiguracoesSimples from "@/pages/ConfiguracoesSimples";
import NovaConfiguracao from "@/pages/NovaConfiguracao";
import AppConfig from "@/pages/AppConfig";
import Welcome from "@/pages/Welcome";
import Debug from "@/pages/Debug";
import { SideNavigation } from "@/components/vehicles/SideNavigation";
import { Toaster } from "@/components/ui/toaster";
import { useAuth, AuthUser } from "@/hooks/useAuth";

// Componente wrapper para extrair parâmetros da URL
function HomeWithParams({ mode }: { mode: "edit" | "view" }) {
  const [location] = useLocation();
  const pathParts = location.split('/');
  const id = pathParts[3] || undefined; // /registros/edit/ID ou /registros/view/ID
  const type = pathParts[4] || undefined; // /registros/edit/ID/TYPE

  return <Home mode={mode} editId={id} editType={type} />;
}

// Criar cliente do React Query com configurações otimizadas
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const url = queryKey[0] as string;
        const response = await fetch(url, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      },
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

// Component for protected routes - now bypassed since auth is disabled
function PrivateRoute({ 
  children, 
  permission, 
  path 
}: { 
  children: React.ReactNode; 
  permission?: string; 
  path?: string;
}) {
  // Authentication disabled - always allow access
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

  // Authentication disabled - skip all auth-related redirects
  console.log('🔧 Authentication disabled - skipping auth checks');

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
              <Portal />
            </PrivateRoute>
          </Route>
          
          {/* Rotas de registros */}
          <Route path="/registros">
            <PrivateRoute path="/registros">
              <Home />
            </PrivateRoute>
          </Route>
          <Route path="/registros/edit/:id">
            <PrivateRoute path="/registros/edit/:id">
              <HomeWithParams mode="edit" />
            </PrivateRoute>
          </Route>
          <Route path="/registros/edit/:id/:type">
            <PrivateRoute path="/registros/edit/:id/:type">
              <HomeWithParams mode="edit" />
            </PrivateRoute>
          </Route>
          <Route path="/registros/view/:id">
            <PrivateRoute path="/registros/view/:id">
              <HomeWithParams mode="view" />
            </PrivateRoute>
          </Route>
          <Route path="/registros/view/:id/:type">
            <PrivateRoute path="/registros/view/:id/:type">
              <HomeWithParams mode="view" />
            </PrivateRoute>
          </Route>
          <Route path="/registros/history">
            <PrivateRoute path="/registros/history">
              <Home defaultView="history" />
            </PrivateRoute>
          </Route>
          <Route path="/registros/dashboard">
            <PrivateRoute path="/registros/dashboard">
              <Home defaultView="dashboard" />
            </PrivateRoute>
          </Route>
          
          {/* New routes for portal navigation */}
          <Route path="/historico">
            <PrivateRoute path="/historico">
              <Home defaultView="history" />
            </PrivateRoute>
          </Route>
          
          <Route path="/dashboard">
            <PrivateRoute path="/dashboard">
              <Home defaultView="dashboard" />
            </PrivateRoute>
          </Route>
          
          {/* Vehicle and Driver Detail Pages */}
          <Route path="/vehicles/:id">
            <PrivateRoute path="/vehicles/:id">
              <VehicleDetail />
            </PrivateRoute>
          </Route>
          
          <Route path="/drivers/:id">
            <PrivateRoute path="/drivers/:id">
              <DriverDetail />
            </PrivateRoute>
          </Route>

          <Route path="/checklists/templates">
            <PrivateRoute path="/checklists/templates" permission="admin">
              <ChecklistTemplates />
            </PrivateRoute>
          </Route>

          <Route path="/checklists" component={Checklists} />
          <Route path="/checklists/:rest*" component={Checklists} />

          <Route path="/reports">
            <PrivateRoute path="/reports">
              <SimpleReports />
            </PrivateRoute>
          </Route>
          
          <Route path="/relatorios">
            <PrivateRoute path="/relatorios">
              <SimpleReports />
            </PrivateRoute>
          </Route>

          <Route path="/users">
            <PrivateRoute path="/users" permission="userManagement">
              <SimpleUsuarios />
            </PrivateRoute>
          </Route>
          
          <Route path="/usuarios">
            <PrivateRoute path="/usuarios" permission="userManagement">
              <SimpleUsuarios />
            </PrivateRoute>
          </Route>

          <Route path="/cadastros">
            <PrivateRoute path="/cadastros">
              <Cadastros />
            </PrivateRoute>
          </Route>

          <Route path="/configuracoes">
            <PrivateRoute path="/configuracoes">
              <SimpleConfiguracoes />
            </PrivateRoute>
          </Route>

          <Route path="/configuracoes-simples">
            <PrivateRoute path="/configuracoes-simples">
              <ConfiguracoesSimples />
            </PrivateRoute>
          </Route>

          <Route path="/configuracoes-novas">
            <PrivateRoute path="/configuracoes-novas">
              <SettingsNew />
            </PrivateRoute>
          </Route>

          <Route path="/nova-configuracao">
            <PrivateRoute path="/nova-configuracao">
              <NovaConfiguracao />
            </PrivateRoute>
          </Route>

          <Route path="/app-config">
            <PrivateRoute path="/app-config">
              <AppConfig />
            </PrivateRoute>
          </Route>

          <Route path="/new-checklist">
            <PrivateRoute path="/new-checklist">
              <NewChecklist />
            </PrivateRoute>
          </Route>

          <Route path="/checklist-simples">
            <PrivateRoute path="/checklist-simples">
              <ChecklistSimple />
            </PrivateRoute>
          </Route>

          <Route path="/checklist/:id">
            <PrivateRoute path="/checklist/:id">
              <ChecklistDetails />
            </PrivateRoute>
          </Route>

          <Route path="/welcome">
            <PrivateRoute path="/welcome">
              <Welcome />
            </PrivateRoute>
          </Route>

          <Route path="/debug">
            <Debug />
          </Route>

          <Route>
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Página não encontrada</h1>
                <p className="text-gray-600 mb-4">A página que você procura não existe.</p>
                <p className="text-sm text-gray-500 mb-4">URL atual: {location}</p>
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
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} />
        </Suspense>
      )}
    </QueryClientProvider>
  );
}

export default App;