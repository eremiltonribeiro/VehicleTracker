import { Switch, Route, useLocation, useRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
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
import RegistrationForm from "@/components/vehicles/RegistrationForm"; // <-- Importa aqui
import { SideNavigation } from "@/components/vehicles/SideNavigation";
import { useEffect, useState } from "react";
import { syncManager } from "./services/syncManager";

// Context para gerenciar estado de autenticação
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    localStorage.getItem("authenticated") === "true"
  );
  const [user, setUser] = useState<any>(
    JSON.parse(localStorage.getItem("user") || "null")
  );
  const [, setLocation] = useLocation();

  // A função de login salva os dados no localStorage e atualiza o estado
  const login = (userData: any) => {
    try {
      localStorage.setItem("authenticated", "true");
      localStorage.setItem("user", JSON.stringify(userData));
      setIsAuthenticated(true);
      setUser(userData);
      return true;
    } catch (error) {
      return false;
    }
  };

  // A função de logout limpa os dados do localStorage e atualiza o estado
  const logout = () => {
    try {
      localStorage.removeItem("authenticated");
      localStorage.removeItem("user");
      setIsAuthenticated(false);
      setUser(null);
      setLocation("/login");
      return true;
    } catch (error) {
      return false;
    }
  };

  return { isAuthenticated, user, login, logout };
};

// Componente PrivateRoute para proteger rotas
function PrivateRoute(props: any) {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const [hasAccess, setHasAccess] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }

    // Verificar permissão baseada no perfil do usuário
    const requiredPermission = props.permission;
    if (requiredPermission) {
      const userData = user || JSON.parse(localStorage.getItem("user") || "{}");
      const userRole = userData.role;

      // Obter os perfis de usuário do localStorage
      const userRoles = JSON.parse(localStorage.getItem("userRoles") || "[]");
      const currentRole = userRoles.find((role: any) => 
        role.name.toLowerCase() === userRole.toLowerCase()
      );

      if (currentRole && currentRole.permissions) {
        setHasAccess(currentRole.permissions[requiredPermission]);
      } else {
        if (userRole === "admin") {
          setHasAccess(true);
        } else if (userRole === "manager") {
          setHasAccess(requiredPermission !== "userManagement");
        } else {
          const basicPermissions = ["registrations", "history", "checklists"];
          setHasAccess(basicPermissions.includes(requiredPermission));
        }
      }
    }
  }, [isAuthenticated, user, props.permission, setLocation]);

  if (!isAuthenticated) {
    return null;
  }

  if (!hasAccess) {
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

  return <Route {...props} />;
}

function Router() {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();
  const isLoginPage = location === "/login";

  if (isLoginPage) {
    return (
      <div className="min-h-screen">
        <Switch>
          <Route path="/login" component={Login} />
        </Switch>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {isAuthenticated && <SideNavigation />}
      <main className="flex-grow lg:ml-64 px-4 py-6 pb-12">
        <div className="max-w-6xl mx-auto">
          <Switch>
            <PrivateRoute path="/" component={Welcome} />
            {/* NOVA ROTA DE EDIÇÃO - ANTES DA DE /registros */}
            <PrivateRoute
              path="/registros/edit/:id"
              component={RegistrationForm}
              permission="registrations"
            />
            <PrivateRoute path="/registros" component={Home} permission="registrations" />
            <PrivateRoute path="/registros/dashboard" component={Home} permission="dashboard" />
            <PrivateRoute path="/registros/history" component={Home} permission="history" />
            <PrivateRoute path="/relatorios" component={Reports} permission="reports" />
            <PrivateRoute path="/configuracoes" component={Settings} permission="settings" />
            <PrivateRoute path="/cadastros" component={CentralDeCadastros} permission="settings" />
            <PrivateRoute path="/configuracoes/app" component={AppConfig} permission="settings" />
            <PrivateRoute path="/usuarios" component={UserManagement} permission="userManagement" />
            <PrivateRoute path="/checklists/new" component={NewChecklist} permission="checklists" />
            <PrivateRoute path="/checklists/edit/:id" component={NewChecklist} permission="checklists" />
            <PrivateRoute path="/checklists/:id" component={ChecklistDetails} permission="checklists" />
            <PrivateRoute path="/checklists" component={ChecklistSimple} permission="checklists" />
            <PrivateRoute path="/checklist-templates" component={ChecklistTemplates} permission="settings" />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
    </div>
  );
}

function App() {
  useEffect(() => {
    syncManager.initialize();
    const handleOnlineStatusChange = () => {
      const isOnline = navigator.onLine;
      // Você pode colocar um toast ou log aqui se quiser
    };
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);
    handleOnlineStatusChange();
    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
