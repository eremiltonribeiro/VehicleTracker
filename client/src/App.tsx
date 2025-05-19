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
import { Navigation } from "@/components/vehicles/Navigation";
import { Header } from "@/components/vehicles/Header";
import { useEffect, useState } from "react";

// Context para gerenciar estado de autenticação
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Verificar autenticação no localStorage
    const authenticated = localStorage.getItem("authenticated");
    const storedUser = localStorage.getItem("user");
    
    if (authenticated === "true" && storedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (userData: any) => {
    localStorage.setItem("authenticated", "true");
    localStorage.setItem("user", JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("authenticated");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUser(null);
    setLocation("/login");
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
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {isAuthenticated && <Header />}
      {isAuthenticated && <Navigation />}
      <main className={`flex-grow ${isAuthenticated ? 'container mx-auto px-4 py-4 pb-12' : ''}`}>
        <Switch>
          <Route path="/login" component={Login} />
          <PrivateRoute path="/" component={Welcome} />
          <PrivateRoute path="/registros" component={Home} />
          <PrivateRoute path="/registros/:view" component={Home} />
          <PrivateRoute path="/relatorios" component={Reports} />
          <PrivateRoute path="/configuracoes" component={Settings} />
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
