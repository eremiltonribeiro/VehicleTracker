import { Switch, Route, useLocation, useRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Settings from "@/pages/Settings";
import Welcome from "@/pages/Welcome";
import Reports from "@/pages/Reports";
import Login from "@/pages/Login";
import UserManagement from "@/pages/UserManagement";
import Checklists from "@/pages/Checklists";
import NewChecklist from "@/pages/NewChecklist";
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
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) {
    return null;
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
          <PrivateRoute path="/registros" component={Home} />
          <PrivateRoute path="/registros/:view" component={Home} />
          <PrivateRoute path="/relatorios" component={Reports} />
          <PrivateRoute path="/configuracoes" component={Settings} />
          <PrivateRoute path="/usuarios" component={UserManagement} />
          <PrivateRoute path="/checklists" component={Checklists} />
          <PrivateRoute path="/checklists/new" component={NewChecklist} />
          <PrivateRoute path="/checklists/:id" component={Checklists} />
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
