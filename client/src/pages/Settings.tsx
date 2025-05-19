import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VehicleForm } from "@/components/vehicles/VehicleForm";
import { DriverForm } from "@/components/vehicles/DriverForm";
import { FuelStationForm } from "@/components/vehicles/FuelStationForm";
import { FuelTypeForm } from "@/components/vehicles/FuelTypeForm";
import { MaintenanceTypeForm } from "@/components/vehicles/MaintenanceTypeForm";
import { Loader2, Car, UserCircle, Fuel, Droplet, Wrench, ClipboardCheck, ArrowRight } from "lucide-react";
import { offlineStorage } from "@/services/offlineStorage";
import { useLocation } from "wouter";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("vehicles");
  const [, setLocation] = useLocation();
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Configurações</CardTitle>
          <CardDescription>Cadastre e gerencie os dados do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => setLocation("/checklist-templates")}
            className="bg-blue-700 hover:bg-blue-800 w-full flex items-center justify-center gap-2 py-6"
          >
            <ClipboardCheck className="h-5 w-5" />
            <span className="font-medium">Gerenciar Templates de Checklist</span>
          </Button>
        </CardContent>
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 gap-1">
          <TabsTrigger value="vehicles" className="text-xs md:text-sm">Veículos</TabsTrigger>
          <TabsTrigger value="drivers" className="text-xs md:text-sm">Motoristas</TabsTrigger>
          <TabsTrigger value="fuel-stations" className="text-xs md:text-sm">Postos</TabsTrigger>
          <TabsTrigger value="fuel-types" className="text-xs md:text-sm">Combustíveis</TabsTrigger>
          <TabsTrigger value="maintenance-types" className="text-xs md:text-sm">Manutenções</TabsTrigger>
        </TabsList>
        
        <TabsContent value="vehicles" className="space-y-4">
          <VehicleForm />
          <VehiclesList />
        </TabsContent>
        
        <TabsContent value="drivers" className="space-y-4">
          <DriverForm />
          <DriversList />
        </TabsContent>
        
        <TabsContent value="fuel-stations" className="space-y-4">
          <FuelStationForm />
          <FuelStationsList />
        </TabsContent>
        
        <TabsContent value="fuel-types" className="space-y-4">
          <FuelTypeForm />
          <FuelTypesList />
        </TabsContent>
        
        <TabsContent value="maintenance-types" className="space-y-4">
          <MaintenanceTypeForm />
          <MaintenanceTypesList />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componente para listar veículos
function VehiclesList() {
  const { data: vehicles = [], isLoading } = useQuery({
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
        return await offlineStorage.getVehicles();
      } catch (error) {
        console.error("Erro ao buscar veículos:", error);
        return await offlineStorage.getVehicles();
      }
    }
  });
  
  if (isLoading) {
    return <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Veículos Cadastrados</CardTitle>
        <CardDescription>Lista de veículos disponíveis no sistema</CardDescription>
      </CardHeader>
      <CardContent>
        {vehicles.length === 0 ? (
          <div className="text-center p-4 text-muted-foreground">
            Nenhum veículo cadastrado.
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle: any) => (
              <Card key={vehicle.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4">
                    <h3 className="font-bold flex items-center">
                      <Car className="h-4 w-4 mr-2" />
                      {vehicle.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{vehicle.plate}</p>
                    <div className="text-xs mt-2">
                      <p><span className="font-medium">Modelo:</span> {vehicle.model}</p>
                      <p><span className="font-medium">Ano:</span> {vehicle.year}</p>
                      <p><span className="font-medium">Km Inicial:</span> {vehicle.initialKm?.toLocaleString('pt-BR')} km</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente para listar motoristas
function DriversList() {
  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ["/api/drivers"],
    queryFn: async () => {
      try {
        if (navigator.onLine) {
          const res = await fetch("/api/drivers");
          if (res.ok) {
            const data = await res.json();
            await offlineStorage.saveDrivers(data);
            return data;
          }
        }
        return await offlineStorage.getDrivers();
      } catch (error) {
        console.error("Erro ao buscar motoristas:", error);
        return await offlineStorage.getDrivers();
      }
    }
  });
  
  if (isLoading) {
    return <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Motoristas Cadastrados</CardTitle>
        <CardDescription>Lista de motoristas disponíveis no sistema</CardDescription>
      </CardHeader>
      <CardContent>
        {drivers.length === 0 ? (
          <div className="text-center p-4 text-muted-foreground">
            Nenhum motorista cadastrado.
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {drivers.map((driver: any) => (
              <Card key={driver.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4">
                    <h3 className="font-bold flex items-center">
                      <UserCircle className="h-4 w-4 mr-2" />
                      {driver.name}
                    </h3>
                    <div className="text-xs mt-2">
                      <p><span className="font-medium">CNH:</span> {driver.license}</p>
                      <p><span className="font-medium">Telefone:</span> {driver.phone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente para listar postos de combustível
function FuelStationsList() {
  const { data: stations = [], isLoading } = useQuery({
    queryKey: ["/api/fuel-stations"],
    queryFn: async () => {
      try {
        if (navigator.onLine) {
          const res = await fetch("/api/fuel-stations");
          if (res.ok) {
            const data = await res.json();
            await offlineStorage.saveFuelStations(data);
            return data;
          }
        }
        return await offlineStorage.getFuelStations();
      } catch (error) {
        console.error("Erro ao buscar postos:", error);
        return await offlineStorage.getFuelStations();
      }
    }
  });
  
  if (isLoading) {
    return <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Postos Cadastrados</CardTitle>
        <CardDescription>Lista de postos de combustível disponíveis</CardDescription>
      </CardHeader>
      <CardContent>
        {stations.length === 0 ? (
          <div className="text-center p-4 text-muted-foreground">
            Nenhum posto cadastrado.
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {stations.map((station: any) => (
              <Card key={station.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4">
                    <h3 className="font-bold flex items-center">
                      <Fuel className="h-4 w-4 mr-2" />
                      {station.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{station.address}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente para listar tipos de combustível
function FuelTypesList() {
  const { data: types = [], isLoading } = useQuery({
    queryKey: ["/api/fuel-types"],
    queryFn: async () => {
      try {
        if (navigator.onLine) {
          const res = await fetch("/api/fuel-types");
          if (res.ok) {
            const data = await res.json();
            await offlineStorage.saveFuelTypes(data);
            return data;
          }
        }
        return await offlineStorage.getFuelTypes();
      } catch (error) {
        console.error("Erro ao buscar tipos de combustível:", error);
        return await offlineStorage.getFuelTypes();
      }
    }
  });
  
  if (isLoading) {
    return <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tipos de Combustível</CardTitle>
        <CardDescription>Lista de tipos de combustível disponíveis</CardDescription>
      </CardHeader>
      <CardContent>
        {types.length === 0 ? (
          <div className="text-center p-4 text-muted-foreground">
            Nenhum tipo de combustível cadastrado.
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {types.map((type: any) => (
              <Card key={type.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4">
                    <h3 className="font-bold flex items-center">
                      <Droplet className="h-4 w-4 mr-2" />
                      {type.name}
                    </h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente para listar tipos de manutenção
function MaintenanceTypesList() {
  const { data: types = [], isLoading } = useQuery({
    queryKey: ["/api/maintenance-types"],
    queryFn: async () => {
      try {
        if (navigator.onLine) {
          const res = await fetch("/api/maintenance-types");
          if (res.ok) {
            const data = await res.json();
            await offlineStorage.saveMaintenanceTypes(data);
            return data;
          }
        }
        return await offlineStorage.getMaintenanceTypes();
      } catch (error) {
        console.error("Erro ao buscar tipos de manutenção:", error);
        return await offlineStorage.getMaintenanceTypes();
      }
    }
  });
  
  if (isLoading) {
    return <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tipos de Manutenção</CardTitle>
        <CardDescription>Lista de tipos de manutenção disponíveis</CardDescription>
      </CardHeader>
      <CardContent>
        {types.length === 0 ? (
          <div className="text-center p-4 text-muted-foreground">
            Nenhum tipo de manutenção cadastrado.
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {types.map((type: any) => (
              <Card key={type.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4">
                    <h3 className="font-bold flex items-center">
                      <Wrench className="h-4 w-4 mr-2" />
                      {type.name}
                    </h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}