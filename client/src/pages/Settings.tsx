import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { VehicleForm } from "@/components/vehicles/VehicleForm";
import { DriverForm } from "@/components/vehicles/DriverForm";
import { FuelStationForm } from "@/components/vehicles/FuelStationForm";
import { FuelTypeForm } from "@/components/vehicles/FuelTypeForm";
import { MaintenanceTypeForm } from "@/components/vehicles/MaintenanceTypeForm";
import { Loader2, Car, UserCircle, Fuel, Droplet, Wrench, ClipboardCheck, ArrowRight, Palette } from "lucide-react";
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
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            <Button 
              variant={activeTab === "vehicles" ? "default" : "outline"}
              className="h-16 w-full flex flex-col items-center justify-center gap-1 p-2"
              onClick={() => setActiveTab("vehicles")}
            >
              <Car className="h-5 w-5" />
              <span className="text-xs font-medium">Veículos</span>
            </Button>
            
            <Button 
              variant={activeTab === "drivers" ? "default" : "outline"}
              className="h-16 w-full flex flex-col items-center justify-center gap-1 p-2"
              onClick={() => setActiveTab("drivers")}
            >
              <UserCircle className="h-5 w-5" />
              <span className="text-xs font-medium">Motoristas</span>
            </Button>
            
            <Button 
              variant={activeTab === "fuel-stations" ? "default" : "outline"}
              className="h-16 w-full flex flex-col items-center justify-center gap-1 p-2"
              onClick={() => setActiveTab("fuel-stations")}
            >
              <Fuel className="h-5 w-5" />
              <span className="text-xs font-medium">Postos</span>
            </Button>
            
            <Button 
              variant={activeTab === "fuel-types" ? "default" : "outline"}
              className="h-16 w-full flex flex-col items-center justify-center gap-1 p-2"
              onClick={() => setActiveTab("fuel-types")}
            >
              <Droplet className="h-5 w-5" />
              <span className="text-xs font-medium">Combustíveis</span>
            </Button>
            
            <Button 
              variant={activeTab === "maintenance-types" ? "default" : "outline"}
              className="h-16 w-full flex flex-col items-center justify-center gap-1 p-2"
              onClick={() => setActiveTab("maintenance-types")}
            >
              <Wrench className="h-5 w-5" />
              <span className="text-xs font-medium">Manutenções</span>
            </Button>
            
            <Button 
              className="h-16 w-full flex flex-col items-center justify-center gap-1 p-2 bg-blue-700 hover:bg-blue-800 text-white"
              onClick={() => setLocation("/checklist-templates")}
            >
              <ClipboardCheck className="h-5 w-5" />
              <span className="text-xs font-medium">Templates</span>
            </Button>
            
            <Button 
              className="h-16 w-full flex flex-col items-center justify-center gap-1 p-2 bg-blue-700 hover:bg-blue-800 text-white"
              onClick={() => setLocation("/configuracoes/app")}
            >
              <Palette className="h-5 w-5" />
              <span className="text-xs font-medium">Aparência</span>
            </Button>
          </div>
        </div>
        
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
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const { data: vehicles = [], isLoading, refetch } = useQuery({
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
  
  const handleEdit = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setIsEditing(true);
  };
  
  const handleDelete = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    try {
      if (selectedVehicle) {
        const response = await fetch(`/api/vehicles/${selectedVehicle.id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          // Atualizar o armazenamento offline após a exclusão
          const updatedVehicles = vehicles.filter((v: any) => v.id !== selectedVehicle.id);
          await offlineStorage.saveVehicles(updatedVehicles);
          
          // Fechar diálogo e recarregar dados
          setIsDeleteDialogOpen(false);
          refetch();
        } else {
          console.error('Erro ao excluir veículo');
        }
      }
    } catch (error) {
      console.error('Erro ao excluir veículo:', error);
    }
  };
  
  const cancelEdit = () => {
    setSelectedVehicle(null);
    setIsEditing(false);
  };
  
  if (isLoading) {
    return <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  if (isEditing && selectedVehicle) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Editar Veículo</h2>
          <Button variant="outline" onClick={cancelEdit}>Cancelar</Button>
        </div>
        <VehicleForm editingVehicle={selectedVehicle} onSuccess={() => {
          setIsEditing(false);
          setSelectedVehicle(null);
          refetch();
        }} />
      </div>
    );
  }
  
  return (
    <>
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
                      
                      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => handleEdit(vehicle)}
                        >
                          Editar
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => handleDelete(vehicle)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Diálogo de confirmação para exclusão */}
      {isDeleteDialogOpen && selectedVehicle && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={() => setIsDeleteDialogOpen(false)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o veículo <strong>{selectedVehicle.name}</strong> ({selectedVehicle.plate})? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}

// Componente para listar motoristas
function DriversList() {
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const { data: drivers = [], isLoading, refetch } = useQuery({
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
  
  const handleEdit = (driver: any) => {
    setSelectedDriver(driver);
    setIsEditing(true);
  };
  
  const handleDelete = (driver: any) => {
    setSelectedDriver(driver);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    try {
      if (selectedDriver) {
        const response = await fetch(`/api/drivers/${selectedDriver.id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          // Atualizar o armazenamento offline após a exclusão
          const updatedDrivers = drivers.filter((d: any) => d.id !== selectedDriver.id);
          await offlineStorage.saveDrivers(updatedDrivers);
          
          // Fechar diálogo e recarregar dados
          setIsDeleteDialogOpen(false);
          refetch();
        } else {
          console.error('Erro ao excluir motorista');
        }
      }
    } catch (error) {
      console.error('Erro ao excluir motorista:', error);
    }
  };
  
  const cancelEdit = () => {
    setSelectedDriver(null);
    setIsEditing(false);
  };
  
  if (isLoading) {
    return <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  if (isEditing && selectedDriver) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Editar Motorista</h2>
          <Button variant="outline" onClick={cancelEdit}>Cancelar</Button>
        </div>
        <DriverForm editingDriver={selectedDriver} onSuccess={() => {
          setIsEditing(false);
          setSelectedDriver(null);
          refetch();
        }} />
      </div>
    );
  }
  
  return (
    <>
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
                      
                      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => handleEdit(driver)}
                        >
                          Editar
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => handleDelete(driver)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Diálogo de confirmação para exclusão */}
      {isDeleteDialogOpen && selectedDriver && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={() => setIsDeleteDialogOpen(false)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o motorista <strong>{selectedDriver.name}</strong>? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
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