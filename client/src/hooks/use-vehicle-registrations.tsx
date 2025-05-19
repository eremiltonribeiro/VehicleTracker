import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useEffect, useState } from "react";
import { offlineStorage } from "@/services/offlineStorage";

// Tipo para os registros de veículos
export interface VehicleRegistration {
  id: number;
  date: string;
  type: "fuel" | "maintenance" | "trip";
  vehicle?: {
    id: number;
    name: string;
  };
  driver?: {
    id: number;
    name: string;
  };
  // Campos específicos para abastecimento
  fuelStation?: string;
  fuelType?: string;
  liters?: number;
  fuelPrice?: number;
  fuelCost?: number;
  // Campos específicos para manutenção
  maintenanceType?: string;
  maintenanceDescription?: string;
  maintenanceCost?: number;
  // Campos específicos para viagem
  origin?: string;
  destination?: string;
  startOdometer?: number;
  endOdometer?: number;
  // Campos comuns
  odometer?: number;
  imageId?: string;
  notes?: string;
}

export function useVehicleRegistrations() {
  const [registrations, setRegistrations] = useState<VehicleRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Buscar dados do servidor quando estiver online
  const { data: onlineRegistrations, isLoading: isOnlineLoading } = useQuery({
    queryKey: ['/api/registrations'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: navigator.onLine,
    staleTime: 60000, // 1 minuto
  });

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      
      try {
        if (navigator.onLine && onlineRegistrations) {
          // Quando online, priorizar dados do servidor
          setRegistrations(onlineRegistrations);
          
          // Sincronizar com armazenamento local para acesso offline
          await offlineStorage.saveRegistrations(onlineRegistrations);
        } else {
          // Quando offline, usar dados armazenados localmente
          const offlineData = await offlineStorage.getRegistrations();
          setRegistrations(offlineData);
        }
      } catch (error) {
        console.error("Erro ao carregar registros:", error);
        
        // Fallback para dados offline em caso de erro
        try {
          const offlineData = await offlineStorage.getRegistrations();
          setRegistrations(offlineData);
        } catch (innerError) {
          console.error("Erro ao carregar backup offline:", innerError);
          setRegistrations([]);
        }
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [onlineRegistrations]);

  // Dados de exemplo para demonstração se não houver dados
  useEffect(() => {
    if (!isLoading && registrations.length === 0) {
      // Dados de exemplo apenas para demonstração inicial
      const demoData: VehicleRegistration[] = [
        {
          id: 1,
          date: "2023-05-15",
          type: "fuel",
          vehicle: { id: 1, name: "Caminhão MER-2344" },
          driver: { id: 1, name: "Carlos Silva" },
          fuelStation: "Posto Ipiranga",
          fuelType: "Diesel S10",
          liters: 150,
          fuelPrice: 4.89,
          fuelCost: 733.5,
          odometer: 45678
        },
        {
          id: 2,
          date: "2023-05-14",
          type: "maintenance",
          vehicle: { id: 2, name: "Carregadeira HD78" },
          driver: { id: 2, name: "Marcos Oliveira" },
          maintenanceType: "Troca de Óleo",
          maintenanceDescription: "Troca de óleo e filtros",
          maintenanceCost: 850,
          odometer: 12500
        },
        {
          id: 3,
          date: "2023-05-13",
          type: "trip",
          vehicle: { id: 1, name: "Caminhão MER-2344" },
          driver: { id: 3, name: "Pedro Santos" },
          origin: "Mina Principal",
          destination: "Porto de Santos",
          startOdometer: 45200,
          endOdometer: 45678
        }
      ];
      
      setRegistrations(demoData);
    }
  }, [isLoading, registrations.length]);

  return {
    registrations,
    isLoading,
    isOnline: navigator.onLine
  };
}