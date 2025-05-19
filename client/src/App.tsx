import { Switch, Route, useLocation, useRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Settings from "@/pages/Settings";
import Welcome from "@/pages/Welcome";
import Reports from "@/pages/Reports";
import Login from "@/pages/Login";
import UserManagement from "@/pages/UserManagementV2";
import Checklists from "@/pages/Checklists";
import NewChecklist from "@/pages/NewChecklist";
import ChecklistDetails from "@/pages/ChecklistDetails";
import ChecklistTemplates from "@/pages/ChecklistTemplates";
import { Navigation } from "@/components/vehicles/Navigation";
import { Header } from "@/components/vehicles/Header";
import { useEffect, useState } from "react";

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
    console.log("Login chamado com:", userData);
    try {
      localStorage.setItem("authenticated", "true");
      localStorage.setItem("user", JSON.stringify(userData));
      setIsAuthenticated(true);
      setUser(userData);
      console.log("Estado de autenticação atualizado:", true);
      return true;
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      return false;
    }
  };

  // A função de logout limpa os dados do localStorage e atualiza o estado
  const logout = () => {
    console.log("Logout chamado");
    try {
      localStorage.removeItem("authenticated");
      localStorage.removeItem("user");
      setIsAuthenticated(false);
      setUser(null);
      setLocation("/login");
      console.log("Estado de autenticação atualizado:", false);
      return true;
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
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
        // Verificar se o usuário tem a permissão necessária
        setHasAccess(currentRole.permissions[requiredPermission]);
      } else {
        // Permissões padrão baseadas no papel do usuário
        if (userRole === "admin") {
          setHasAccess(true); // Admin tem acesso a tudo
        } else if (userRole === "manager") {
          // Gerente tem acesso a tudo exceto gerenciamento de usuários
          setHasAccess(requiredPermission !== "userManagement");
        } else {
          // Usuário padrão tem acesso limitado
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
  
  // Se estiver na página de login, não mostra cabeçalho nem navegação
  if (isLoginPage) {
    return (
      <div className="min-h-screen">
        <Switch>
          <Route path="/login" component={Login} />
        </Switch>
      </div>
    );
  }
  
  // Renderização normal para páginas autenticadas
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {isAuthenticated && <Header />}
      {isAuthenticated && <Navigation />}
      <main className="flex-grow container mx-auto px-4 py-4 pb-12">
        <Switch>
          <PrivateRoute path="/" component={Welcome} />
          <PrivateRoute path="/registros" component={Home} permission="registrations" />
          <PrivateRoute path="/registros/dashboard" component={Home} permission="dashboard" />
          <PrivateRoute path="/registros/history" component={Home} permission="history" />
          <PrivateRoute path="/relatorios" component={Reports} permission="reports" />
          <PrivateRoute path="/configuracoes" component={Settings} permission="settings" />
          <PrivateRoute path="/usuarios" component={UserManagement} permission="userManagement" />
          <PrivateRoute path="/checklists" component={Checklists} permission="checklists" />
          <PrivateRoute path="/checklists/new" component={NewChecklist} permission="checklists" />
          <PrivateRoute path="/checklists/:id" component={ChecklistDetails} permission="checklists" />
          <PrivateRoute path="/checklist-templates" component={ChecklistTemplates} permission="settings" />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
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
