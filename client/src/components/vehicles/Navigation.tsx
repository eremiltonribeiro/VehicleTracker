import { Link, useLocation } from "wouter";
import { Home, BarChart2, History, Settings, Car, Plus, FileText, Users, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

// Interface para perfis de usuário
interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: {
    dashboard: boolean;
    registrations: boolean;
    history: boolean;
    reports: boolean;
    checklists: boolean;
    settings: boolean;
    userManagement: boolean;
    vehicleManagement: boolean;
    driverManagement: boolean;
  };
}

export function Navigation() {
  const [location, setLocation] = useLocation();
  const [userPermissions, setUserPermissions] = useState<{[key: string]: boolean}>({
    dashboard: false,
    registrations: false,
    history: false,
    reports: false,
    checklists: false,
    settings: false,
    userManagement: false,
    vehicleManagement: false,
    driverManagement: false
  });
  
  // Carregar permissões do usuário
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const userRole = userData.role;
    
    if (userRole) {
      // Buscar o perfil correspondente no localStorage
      const userRoles: UserRole[] = JSON.parse(localStorage.getItem("userRoles") || "[]");
      const currentRole = userRoles.find(role => role.name.toLowerCase() === userRole.toLowerCase());
      
      if (currentRole) {
        setUserPermissions(currentRole.permissions);
      } else {
        // Perfis padrão caso não encontre
        if (userRole === "admin") {
          setUserPermissions({
            dashboard: true,
            registrations: true,
            history: true,
            reports: true,
            checklists: true,
            settings: true,
            userManagement: true,
            vehicleManagement: true,
            driverManagement: true
          });
        } else if (userRole === "manager") {
          setUserPermissions({
            dashboard: true,
            registrations: true,
            history: true,
            reports: true,
            checklists: true,
            settings: true,
            userManagement: false,
            vehicleManagement: true,
            driverManagement: true
          });
        } else {
          // Usuário comum ou motorista
          setUserPermissions({
            dashboard: false,
            registrations: true,
            history: true,
            reports: false,
            checklists: true,
            settings: false,
            userManagement: false,
            vehicleManagement: false,
            driverManagement: false
          });
        }
      }
    }
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
    if (route === "/checklists" && location.includes("checklists")) return true;
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
          
          {userPermissions.registrations && (
            <Button
              variant={isActive("/registros") ? "default" : "outline"}
              className="flex items-center gap-2 rounded-full"
              onClick={() => setLocation("/registros")}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden md:inline">Novo Registro</span>
            </Button>
          )}
          
          {userPermissions.history && (
            <Button
              variant={isActive("/registros?view=history") ? "default" : "outline"}
              className="flex items-center gap-2 rounded-full"
              onClick={() => setLocation("/registros/history")}
            >
              <History className="h-4 w-4" />
              <span className="hidden md:inline">Histórico</span>
            </Button>
          )}
          
          {userPermissions.dashboard && (
            <Button
              variant={isActive("/registros?view=dashboard") ? "default" : "outline"}
              className="flex items-center gap-2 rounded-full"
              onClick={() => setLocation("/registros/dashboard")}
            >
              <BarChart2 className="h-4 w-4" />
              <span className="hidden md:inline">Dashboard</span>
            </Button>
          )}
          
          {userPermissions.checklists && (
            <Button
              variant={isActive("/checklists") ? "default" : "outline"}
              className="flex items-center gap-2 rounded-full"
              onClick={() => setLocation("/checklists")}
            >
              <CheckSquare className="h-4 w-4" />
              <span className="hidden md:inline">Checklists</span>
            </Button>
          )}

          {userPermissions.reports && (
            <Button
              variant={isActive("/relatorios") ? "default" : "outline"}
              className="flex items-center gap-2 rounded-full"
              onClick={() => setLocation("/relatorios")}
            >
              <FileText className="h-4 w-4" />
              <span className="hidden md:inline">Relatórios</span>
            </Button>
          )}
          
          {userPermissions.settings && (
            <Button
              variant={isActive("/configuracoes") ? "default" : "outline"}
              className="flex items-center gap-2 rounded-full"
              onClick={() => setLocation("/configuracoes")}
            >
              <Settings className="h-4 w-4" />
              <span className="hidden md:inline">Configurações</span>
            </Button>
          )}
          
          {userPermissions.userManagement && (
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