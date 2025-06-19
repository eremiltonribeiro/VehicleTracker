import { Link, useLocation } from "wouter";
import { Home, BarChart2, History, Settings, Car, Plus, FileText, Users, CheckSquare, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth"; // Changed import

// Interface para perfis de usuário (pode ser removida se não usada em outro lugar após refatoração)
// interface UserRole {
//   id: string;
//   name: string;
//   description: string;
//   permissions: {
//     dashboard: boolean;
//     registrations: boolean;
//     history: boolean;
//     reports: boolean;
//     checklists: boolean;
//     settings: boolean;
//     userManagement: boolean;
//     vehicleManagement: boolean;
//     driverManagement: boolean;
//   };
// }

const defaultPermissions = {
  dashboard: false,
  registrations: false,
  history: false,
  reports: false,
  checklists: false,
  settings: false,
  userManagement: false,
  vehicleManagement: false, // Assuming this might be a permission
  driverManagement: false,  // Assuming this might be a permission
};

export function SideNavigation() {
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { user, isLoading, isAuthenticated } = useAuth(); // Use new useAuth hook
  
  // Authentication disabled - grant all permissions
  const userPermissions = useMemo(() => {
    return {
      dashboard: true,
      registrations: true,
      history: true,
      reports: true,
      checklists: true,
      settings: true,
      userManagement: true,
      vehicleManagement: true,
      driverManagement: true,
    };
  }, []);
  
  // Helper function to check if a route is active
  const isActive = (route: string) => { // No change needed here, but ensure location is valid.
    if (route === "/" && location === "/") return true;
    if (route === "/registros" && location === "/registros") return true; // Example, adjust as per your routes
    if (route === "/registros/history" && location.includes("/registros/history")) return true;
    if (route === "/registros/dashboard" && location.includes("/registros/dashboard")) return true;
    if (route === "/relatorios" && location.includes("/relatorios")) return true;
    if (route === "/configuracoes" && location.includes("/configuracoes")) return true;
    // Add new /cadastros route check if it's a separate link
    if (route === "/cadastros" && location.includes("/cadastros")) return true;
    if (route === "/usuarios" && location.includes("/usuarios")) return true;
    if (route === "/checklists" && location.includes("/checklists")) return true;
    return false;
  };
  
  // Função para fazer logout
  const handleLogout = () => {
    window.location.href = "/api/logout"; // Redirect to server-side OIDC logout
  };
  
  // Carregar configurações do app (this useEffect seems unrelated to auth, can remain if needed)
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem("appConfig");
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        
        // Atualizar nome da empresa se disponível
        if (config.companyName) {
          document.querySelectorAll('.company-name').forEach(el => {
            (el as HTMLElement).innerText = config.companyName;
          });
        }
        
        // Aplicar logo personalizado se disponível
        if (config.logoUrl) {
          document.querySelectorAll('.company-logo').forEach(el => {
            (el as HTMLImageElement).src = config.logoUrl;
          });
        }
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
  }, []);

  // If auth is loading, show a loading state
  if (isLoading) {
    return (
      <div className="hidden lg:flex h-screen fixed left-0 top-0 bg-blue-800 text-white w-64 shadow-lg flex-col">
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  // Always show navigation since auth is disabled

  return (
    <>
      {/* Header for mobile */}
      <div className="lg:hidden bg-blue-800 text-white shadow-md w-full side-navigation">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-10 h-10 mr-3 bg-blue-600 rounded-lg flex items-center justify-center">
              <Car className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-lg font-bold company-name">Sistema de Gestão de Frota</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-blue-700"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
        
        {/* Mobile menu dropdown */}
        {isMobileMenuOpen && (
          <div className="bg-blue-900 text-white">
            <div className="container mx-auto px-4 py-2">
              <nav className="flex flex-col space-y-2">
                <Button
                  variant="ghost"
                  className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
                    isActive("/") ? "bg-blue-700 text-white" : "text-white hover:bg-blue-700"
                  }`}
                  onClick={() => {
                    setLocation("/");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Home className="h-5 w-5" />
                  <span className="text-sm font-medium">Início</span>
                </Button>
                
                {userPermissions.registrations && (
                  <Button
                    variant="ghost"
                    className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
                      isActive("/registros") ? "bg-blue-700 text-white" : "text-white hover:bg-blue-700"
                    }`}
                    onClick={() => {
                      setLocation("/registros");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Plus className="h-5 w-5" />
                    <span className="text-sm font-medium">Registros</span>
                  </Button>
                )}
                
                {userPermissions.history && (
                  <Button
                    variant="ghost"
                    className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
                      isActive("/registros/history") ? "bg-blue-700 text-white" : "text-white hover:bg-blue-700"
                    }`}
                    onClick={() => {
                      setLocation("/registros/history");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <History className="h-5 w-5" />
                    <span className="text-sm font-medium">Histórico</span>
                  </Button>
                )}
                
                {userPermissions.dashboard && (
                  <Button
                    variant="ghost"
                    className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
                      isActive("/registros/dashboard") ? "bg-blue-700 text-white" : "text-white hover:bg-blue-700"
                    }`}
                    onClick={() => {
                      setLocation("/registros/dashboard");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <BarChart2 className="h-5 w-5" />
                    <span className="text-sm font-medium">Dashboard</span>
                  </Button>
                )}
                
                {userPermissions.checklists && (
                  <Button
                    variant="ghost"
                    className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
                      isActive("/checklists") ? "bg-blue-700 text-white" : "text-white hover:bg-blue-700"
                    }`}
                    onClick={() => {
                      setLocation("/checklists");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <CheckSquare className="h-5 w-5" />
                    <span className="text-sm font-medium">Checklists</span>
                  </Button>
                )}
                
                {userPermissions.reports && (
                  <Button
                    variant="ghost"
                    className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
                      isActive("/relatorios") ? "bg-blue-700 text-white" : "text-white hover:bg-blue-700"
                    }`}
                    onClick={() => {
                      setLocation("/relatorios");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <FileText className="h-5 w-5" />
                    <span className="text-sm font-medium">Relatórios</span>
                  </Button>
                )}
                
                {userPermissions.settings && ( // This single 'settings' permission now controls both links
                  <>
                    <Button
                      variant="ghost"
                      className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
                        isActive("/configuracoes") ? "bg-blue-700 text-white" : "text-white hover:bg-blue-700"
                      }`}
                      onClick={() => {
                        setLocation("/configuracoes");
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <Settings className="h-5 w-5" />
                      <span className="text-sm font-medium">Configurações</span>
                    </Button>
                    
                    {/* Assuming "Cadastros" is also part of "settings" or has its own permission if needed */}
                    <Button
                      variant="ghost"
                      className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
                        isActive("/cadastros") ? "bg-blue-700 text-white" : "text-white hover:bg-blue-700"
                      }`}
                      onClick={() => {
                        setLocation("/cadastros");
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <Car className="h-5 w-5" /> {/* Icon might need review for "Cadastros" */}
                      <span className="text-sm font-medium">Cadastros</span>
                    </Button>
                  </>
                )}
                
                {userPermissions.userManagement && (
                  <Button
                    variant="ghost"
                    className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
                      isActive("/usuarios") ? "bg-blue-700 text-white" : "text-white hover:bg-blue-700"
                    }`}
                    onClick={() => {
                      setLocation("/usuarios");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Users className="h-5 w-5" />
                    <span className="text-sm font-medium">Usuários</span>
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  className="flex items-center justify-start gap-3 rounded-md w-full p-3 text-white hover:bg-blue-700"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-sm font-medium">Sair</span>
                </Button>
              </nav>
            </div>
          </div>
        )}
      </div>
      
      {/* Sidebar for desktop */}
      <div className="hidden lg:flex h-screen fixed left-0 top-0 bg-blue-800 text-white w-64 shadow-lg flex-col side-navigation">
        <div className="p-4 flex items-center border-b border-blue-700">
          <div className="w-10 h-10 mr-3 bg-blue-600 rounded-lg flex items-center justify-center">
            <Car className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold company-name">Sistema de Gestão de Frota</h1>
        </div>
        
        <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
          <Button
            variant="ghost"
            className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
              isActive("/") ? "bg-blue-700 text-white" : "text-white hover:bg-blue-700"
            }`}
            onClick={() => setLocation("/")}
          >
            <Home className="h-5 w-5" />
            <span className="text-sm font-medium">Início</span>
          </Button>
          
          {userPermissions.registrations && (
            <Button
              variant="ghost"
              className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
                isActive("/registros") ? "bg-blue-700 text-white" : "text-white hover:bg-blue-700"
              }`}
              onClick={() => setLocation("/registros")}
            >
              <Plus className="h-5 w-5" />
              <span className="text-sm font-medium">Registros</span>
            </Button>
          )}
          
          {userPermissions.history && (
            <Button
              variant="ghost"
              className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
                isActive("/registros/history") ? "bg-blue-700 text-white" : "text-white hover:bg-blue-700"
              }`}
              onClick={() => setLocation("/registros/history")}
            >
              <History className="h-5 w-5" />
              <span className="text-sm font-medium">Histórico</span>
            </Button>
          )}
          
          {userPermissions.dashboard && (
            <Button
              variant="ghost"
              className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
                isActive("/registros/dashboard") ? "bg-blue-700 text-white" : "text-white hover:bg-blue-700"
              }`}
              onClick={() => setLocation("/registros/dashboard")}
            >
              <BarChart2 className="h-5 w-5" />
              <span className="text-sm font-medium">Dashboard</span>
            </Button>
          )}
          
          {userPermissions.checklists && (
            <Button
              variant="ghost"
              className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
                isActive("/checklists") ? "bg-blue-700 text-white" : "text-white hover:bg-blue-700"
              }`}
              onClick={() => setLocation("/checklists")}
            >
              <CheckSquare className="h-5 w-5" />
              <span className="text-sm font-medium">Checklists</span>
            </Button>
          )}
          
          {userPermissions.reports && (
            <Button
              variant="ghost"
              className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
                isActive("/relatorios") ? "bg-blue-700 text-white" : "text-white hover:bg-blue-700"
              }`}
              onClick={() => setLocation("/relatorios")}
            >
              <FileText className="h-5 w-5" />
              <span className="text-sm font-medium">Relatórios</span>
            </Button>
          )}
          
          {userPermissions.settings && ( // This single 'settings' permission now controls both links
             <>
            <Button
              variant="ghost"
              className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
                isActive("/configuracoes") ? "bg-blue-700 text-white" : "text-white hover:bg-blue-700"
              }`}
              onClick={() => setLocation("/configuracoes")}
            >
              <Settings className="h-5 w-5" />
              <span className="text-sm font-medium">Configurações</span>
            </Button>

            {/* Assuming "Cadastros" is also part of "settings" or has its own permission if needed */}
            <Button
              variant="ghost"
              className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
                isActive("/cadastros") ? "bg-blue-700 text-white" : "text-white hover:bg-blue-700"
              }`}
              onClick={() => {
                setLocation("/cadastros");
              }}
            >
              <Car className="h-5 w-5" /> {/* Icon might need review for "Cadastros" */}
              <span className="text-sm font-medium">Cadastros</span>
            </Button>
            </>
          )}
          
          {userPermissions.userManagement && (
            <Button
              variant="ghost"
              className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
                isActive("/usuarios") ? "bg-blue-700 text-white" : "text-white hover:bg-blue-700"
              }`}
              onClick={() => setLocation("/usuarios")}
            >
              <Users className="h-5 w-5" />
              <span className="text-sm font-medium">Usuários</span>
            </Button>
          )}
        </nav>
        
        <div className="p-4 border-t border-blue-700">
          {/* Debug link - only in development */}
          {process.env.NODE_ENV === 'development' && (
            <Button
              variant="ghost"
              className="flex items-center justify-start gap-3 rounded-md w-full p-3 text-gray-300 hover:bg-blue-700 mb-2"
              onClick={() => setLocation("/debug")}
            >
              <Settings className="h-4 w-4" />
              <span className="text-xs font-medium">Debug</span>
            </Button>
          )}
          
          <Button
            variant="ghost"
            className="flex items-center justify-start gap-3 rounded-md w-full p-3 text-white hover:bg-blue-700"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">Sair</span>
          </Button>
        </div>
      </div>
      
      {/* Empty space to prevent content from being hidden behind sidebar on desktop */}
      <div className="hidden lg:block w-64"></div>
    </>
  );
}