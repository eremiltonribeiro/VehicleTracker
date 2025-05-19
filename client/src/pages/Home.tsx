import { useEffect } from "react";
import { RegistrationForm } from "@/components/vehicles/RegistrationForm";
import { HistoryView } from "@/components/vehicles/HistoryView";
import { Dashboard } from "@/components/vehicles/Dashboard";
import { Header } from "@/components/vehicles/Header";
import { useLocation } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Wifi, WifiOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { offlineStorage } from "@/services/offlineStorage";

export default function Home() {
  const [location, setLocation] = useLocation();
  const params = location.split("/");
  const view = params[params.length - 1] === "registros" ? null : params[params.length - 1];
  
  // Monitor network status for offline functionality
  useEffect(() => {
    const saveDataLocally = async () => {
      // Get data from APIs
      try {
        const vehiclesRes = await fetch("/api/vehicles");
        if (vehiclesRes.ok) {
          const vehicles = await vehiclesRes.json();
          await offlineStorage.saveVehicles(vehicles);
        }
        
        const driversRes = await fetch("/api/drivers");
        if (driversRes.ok) {
          const drivers = await driversRes.json();
          await offlineStorage.saveDrivers(drivers);
        }
        
        const fuelStationsRes = await fetch("/api/fuel-stations");
        if (fuelStationsRes.ok) {
          const stations = await fuelStationsRes.json();
          await offlineStorage.saveFuelStations(stations);
        }
        
        const fuelTypesRes = await fetch("/api/fuel-types");
        if (fuelTypesRes.ok) {
          const types = await fuelTypesRes.json();
          await offlineStorage.saveFuelTypes(types);
        }
        
        const maintenanceTypesRes = await fetch("/api/maintenance-types");
        if (maintenanceTypesRes.ok) {
          const types = await maintenanceTypesRes.json();
          await offlineStorage.saveMaintenanceTypes(types);
        }
        
        const registrationsRes = await fetch("/api/registrations");
        if (registrationsRes.ok) {
          const registrations = await registrationsRes.json();
          await offlineStorage.saveRegistrations(registrations);
        }
      } catch (error) {
        console.error("Erro ao salvar dados localmente:", error);
      }
    };
    
    // On load, save data for offline use
    if (navigator.onLine) {
      saveDataLocally();
    }
    
    // Set up event listeners for online/offline
    const handleOnline = () => {
      saveDataLocally();
    };
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);
  
  // Determine which view to show
  const showHistory = view === "history";
  const showDashboard = view === "dashboard";
  
  // Fetch data, with offline capability
  const { data: vehicles = [] } = useQuery({
    queryKey: ["/api/vehicles"],
    queryFn: async () => {
      try {
        if (navigator.onLine) {
          const res = await fetch("/api/vehicles");
          if (res.ok) {
            const data = await res.json();
            await offlineStorage.saveVehicles(data);
            return data;
          }
        }
        
        // Fallback to offline data
        return await offlineStorage.getVehicles();
      } catch (error) {
        console.error("Erro ao buscar veículos:", error);
        return await offlineStorage.getVehicles();
      }
    }
  });
  
  return (
    <div id="app-container" className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      
      {!navigator.onLine && (
        <div className="bg-yellow-100 px-4 py-1">
          <Alert className="border-yellow-500 bg-yellow-50">
            <WifiOff className="h-4 w-4 text-yellow-600 mr-2" />
            <AlertTitle>Modo Offline</AlertTitle>
            <AlertDescription>
              Você está trabalhando offline. Os dados serão sincronizados quando a conexão for restaurada.
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      <main className="flex-grow container mx-auto px-4 py-6 md:py-8">
        {showHistory ? (
          <HistoryView />
        ) : showDashboard ? (
          <Dashboard />
        ) : (
          <RegistrationForm />
        )}
      </main>
    </div>
  );
}
