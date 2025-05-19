import { Link, useLocation } from "wouter";
import { Plus, History, Car, BarChart2, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { offlineStorage } from "@/services/offlineStorage";
import { useToast } from "@/hooks/use-toast";

export function Header() {
  const [location, setLocation] = useLocation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncs, setPendingSyncs] = useState(0);
  const { toast } = useToast();

  const isHistory = location.includes("history");
  const isDashboard = location.includes("dashboard");

  // Check for online status changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Conectado",
        description: "Você está online novamente. Clique para sincronizar dados.",
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={syncData}
          >
            Sincronizar
          </Button>
        ),
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Desconectado",
        description: "Você está offline. Os dados serão salvos localmente até que a conexão seja restaurada.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for pending syncs
    const checkPendingSyncs = async () => {
      const registrations = await offlineStorage.getRegistrations();
      const offlineRegs = registrations.filter(reg => reg.isOffline);
      setPendingSyncs(offlineRegs.length);
    };

    checkPendingSyncs();
    const interval = setInterval(checkPendingSyncs, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [toast]);

  const syncData = async () => {
    if (!isOnline) {
      toast({
        title: "Sem conexão",
        description: "Você está offline. Não é possível sincronizar os dados.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sincronizando",
      description: "Aguarde enquanto sincronizamos os dados...",
    });

    try {
      const success = await offlineStorage.syncWithServer();
      if (success) {
        setPendingSyncs(0);
        toast({
          title: "Sincronização concluída",
          description: "Todos os dados foram sincronizados com sucesso.",
        });
      } else {
        toast({
          title: "Erro de sincronização",
          description: "Alguns dados não puderam ser sincronizados. Tente novamente mais tarde.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro de sincronização",
        description: "Ocorreu um erro ao sincronizar os dados.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-primary-800 text-white shadow-lg sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Car className="h-6 w-6" />
          <h1 className="text-xl font-bold">Sistema de Gestão de Frota</h1>
        </div>
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="mr-2">
            {isOnline ? (
              <Badge variant="outline" className="bg-green-800 text-white border-0 flex items-center">
                <Wifi className="h-3 w-3 mr-1" />
                Online
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-800 text-white border-0 flex items-center">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex space-x-2">
            {/* Dashboard Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/?view=dashboard")}
              className={`text-white hover:bg-primary-700 rounded-full ${isDashboard ? 'bg-primary-700' : ''}`}
              title="Dashboard"
            >
              <BarChart2 className="h-5 w-5" />
            </Button>

            {/* History/New Button */}
            {isHistory || isDashboard ? (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setLocation("/")}
                className="text-white hover:bg-primary-700 rounded-full"
                title="Novo Registro"
              >
                <Plus className="h-5 w-5" />
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setLocation("/?view=history")}
                className="text-white hover:bg-primary-700 rounded-full"
                title="Histórico"
              >
                <History className="h-5 w-5" />
              </Button>
            )}

            {/* Sync Button (shown only when there are pending syncs) */}
            {pendingSyncs > 0 && (
              <Button
                variant="outline" 
                size="sm"
                onClick={syncData}
                disabled={!isOnline}
                className="text-white border-white hover:bg-primary-700"
              >
                Sincronizar ({pendingSyncs})
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
