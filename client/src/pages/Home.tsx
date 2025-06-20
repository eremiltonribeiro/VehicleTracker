import { useEffect, useState } from "react";
import { RegistrationForm } from "@/components/vehicles/RegistrationForm";
import { SimpleRegistrationForm } from "@/components/vehicles/SimpleRegistrationForm";
import { HistoryView } from "@/components/vehicles/HistoryView";
import { DashboardWithFilters } from "@/components/vehicles/DashboardModern";
import { Header } from "@/components/vehicles/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Wifi, WifiOff, Plus, History, BarChart3, FileText, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { offlineStorage } from "@/services/offlineStorage";
import { brandColors } from "@/lib/colors";

interface HomeProps {
  defaultView?: string;
  editId?: string;
  editType?: string | null;
  mode?: "edit" | "view";
}

export default function Home({ defaultView = "form", editId, editType, mode }: HomeProps) {
  const [location, setLocation] = useLocation();
  
  // Lógica corrigida para determinar a visualização ativa
  let activeView;
  
  console.log("🔍 Home component - Current location:", location);
  
  if (location === "/" || location === "/registros") {
    // Página inicial ou registros - mostra o formulário
    activeView = "form";
  } else if (location === "/registros/history" || location.includes("history")) {
    activeView = "history";
  } else if (location === "/registros/dashboard" || location.includes("dashboard")) {
    activeView = "dashboard";
  } else {
    // Use defaultView se fornecido, senão form
    activeView = defaultView;
  }

  console.log("🎯 Active view determined:", activeView);

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
  const showHistory = activeView === "history";
  const showDashboard = activeView === "dashboard";
  const showForm = activeView === "form";

  console.log("🎯 Home render state:", { showHistory, showDashboard, showForm });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-6">
        
        {/* Network Status Alert */}
        {!navigator.onLine && (
          <Alert className="mb-6 border-yellow-500 bg-yellow-50">
            <WifiOff className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">Modo Offline</AlertTitle>
            <AlertDescription className="text-yellow-700">
              Você está trabalhando offline. Os dados serão sincronizados quando a conexão for restaurada.
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: brandColors.primary[100] }}>
                  <Activity className="h-8 w-8" style={{ color: brandColors.primary[600] }} />
                </div>
                Gestão de Registros
              </h1>
              <p className="text-gray-600 mt-2">
                Registre e monitore abastecimentos, manutenções e viagens da sua frota
              </p>
            </div>
          </div>
        </div>

        {/* Modern Tabs Interface */}
        <Card className="shadow-lg border-0">
          <Tabs value={showForm ? "form" : showHistory ? "history" : "dashboard"} className="w-full">
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-3 bg-gray-100">
                <TabsTrigger 
                  value="form" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600"
                >
                  <Plus className="h-4 w-4" />
                  Novo Registro
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600"
                >
                  <History className="h-4 w-4" />
                  Histórico
                </TabsTrigger>
                <TabsTrigger 
                  value="dashboard" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600"
                >
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="p-0">
              <TabsContent value="form" className="mt-0">
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Novo Registro</h3>
                    <p className="text-gray-600">
                      {editId ? "Edite o registro selecionado" : "Registre um novo abastecimento, manutenção ou viagem"}
                    </p>
                  </div>
                  <RegistrationForm editId={editId} editType={editType} mode={mode} />
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-0">
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Histórico de Registros</h3>
                    <p className="text-gray-600">
                      Visualize e gerencie todos os registros da sua frota
                    </p>
                  </div>
                  <HistoryView />
                </div>
              </TabsContent>

              <TabsContent value="dashboard" className="mt-0">
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Dashboard Analítico</h3>
                    <p className="text-gray-600">
                      Análises e métricas detalhadas da sua frota
                    </p>
                  </div>
                  <DashboardWithFilters />
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}