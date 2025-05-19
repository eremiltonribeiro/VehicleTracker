import { Link, useLocation } from "wouter";
import { Home, BarChart2, History, Settings, Car, Plus, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function Navigation() {
  const [location, setLocation] = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Verificar se o usuário é administrador
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    setIsAdmin(userData.role === "admin");
  }, []);
  
  // Helper function to check if a route is active
  const isActive = (route: string) => {
    if (route === "/" && location === "/") return true;
    if (route === "/registros?view=dashboard" && location.includes("dashboard")) return true;
    if (route === "/registros?view=history" && location.includes("history")) return true;
    if (route === "/registros" && location === "/registros") return true;
    if (route === "/relatorios" && location.includes("relatorios")) return true;
    if (route === "/configuracoes" && location.includes("configuracoes")) return true;
    if (route === "/usuarios" && location.includes("usuarios")) return true;
    return false;
  };
  
  return (
    <div className="bg-gray-100 shadow-sm py-3 mb-6">
      <div className="container mx-auto flex justify-center">
        <div className="flex flex-wrap items-center gap-2 md:gap-6">
          <Button
            variant={isActive("/") ? "default" : "outline"}
            className="flex items-center gap-2 rounded-full"
            onClick={() => setLocation("/")}
          >
            <Home className="h-4 w-4" />
            <span className="hidden md:inline">Início</span>
          </Button>
          
          <Button
            variant={isActive("/registros") ? "default" : "outline"}
            className="flex items-center gap-2 rounded-full"
            onClick={() => setLocation("/registros")}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden md:inline">Novo Registro</span>
          </Button>
          
          <Button
            variant={isActive("/registros?view=history") ? "default" : "outline"}
            className="flex items-center gap-2 rounded-full"
            onClick={() => setLocation("/registros/history")}
          >
            <History className="h-4 w-4" />
            <span className="hidden md:inline">Histórico</span>
          </Button>
          
          <Button
            variant={isActive("/registros?view=dashboard") ? "default" : "outline"}
            className="flex items-center gap-2 rounded-full"
            onClick={() => setLocation("/registros/dashboard")}
          >
            <BarChart2 className="h-4 w-4" />
            <span className="hidden md:inline">Dashboard</span>
          </Button>
          
          <Button
            variant={isActive("/relatorios") ? "default" : "outline"}
            className="flex items-center gap-2 rounded-full"
            onClick={() => setLocation("/relatorios")}
          >
            <FileText className="h-4 w-4" />
            <span className="hidden md:inline">Relatórios</span>
          </Button>
          
          <Button
            variant={isActive("/configuracoes") ? "default" : "outline"}
            className="flex items-center gap-2 rounded-full"
            onClick={() => setLocation("/configuracoes")}
          >
            <Settings className="h-4 w-4" />
            <span className="hidden md:inline">Configurações</span>
          </Button>
          
          {isAdmin && (
            <Button
              variant={isActive("/usuarios") ? "default" : "outline"}
              className="flex items-center gap-2 rounded-full"
              onClick={() => setLocation("/usuarios")}
            >
              <Users className="h-4 w-4" />
              <span className="hidden md:inline">Usuários</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}