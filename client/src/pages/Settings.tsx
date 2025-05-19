import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VehicleForm } from "@/components/vehicles/VehicleForm";
import { DriverForm } from "@/components/vehicles/DriverForm";
import { FuelStationForm } from "@/components/vehicles/FuelStationForm";
import { FuelTypeForm } from "@/components/vehicles/FuelTypeForm";
import { MaintenanceTypeForm } from "@/components/vehicles/MaintenanceTypeForm";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Car, UserCircle, Fuel, Droplet, Wrench, ClipboardCheck, Palette, Edit, Trash, Plus, FileText } from "lucide-react";
import { offlineStorage } from "@/services/offlineStorage";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("vehicles");
  const [, setLocation] = useLocation();
  
  return (
    <div className="space-y-6 pb-8">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Configurações</CardTitle>
          <CardDescription>Cadastre e gerencie os dados do sistema</CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        <ConfigButton 
          icon={<Car />} 
          label="Veículos" 
          isActive={activeTab === "vehicles"} 
          onClick={() => setActiveTab("vehicles")} 
        />
        <ConfigButton 
          icon={<UserCircle />} 
          label="Motoristas" 
          isActive={activeTab === "drivers"} 
          onClick={() => setActiveTab("drivers")} 
        />
        <ConfigButton 
          icon={<Fuel />} 
          label="Postos" 
          isActive={activeTab === "fuel-stations"} 
          onClick={() => setActiveTab("fuel-stations")} 
        />
        <ConfigButton 
          icon={<Droplet />} 
          label="Combustíveis" 
          isActive={activeTab === "fuel-types"} 
          onClick={() => setActiveTab("fuel-types")} 
        />
        <ConfigButton 
          icon={<Wrench />} 
          label="Manutenções" 
          isActive={activeTab === "maintenance-types"} 
          onClick={() => setActiveTab("maintenance-types")} 
        />
        <ConfigButton 
          icon={<ClipboardCheck />} 
          label="Templates" 
          isActive={false}
          onClick={() => setLocation("/checklist-templates")} 
          accent={true}
        />
        <ConfigButton 
          icon={<Palette />} 
          label="Aparência" 
          isActive={false}
          onClick={() => setLocation("/configuracoes/app")} 
          accent={true}
        />
        <ConfigButton 
          icon={<FileText />} 
          label="Relatórios" 
          isActive={false}
          onClick={() => setLocation("/relatorios")} 
          accent={true}
        />
      </div>
      
      <div className="space-y-6">
        {activeTab === "vehicles" && (
          <>
            <VehicleForm />
            <VehiclesList />
          </>
        )}
        
        {activeTab === "drivers" && (
          <>
            <DriverForm />
            <DriversList />
          </>
        )}
        
        {activeTab === "fuel-stations" && (
          <>
            <FuelStationForm />
            <FuelStationsList />
          </>
        )}
        
        {activeTab === "fuel-types" && (
          <>
            <FuelTypeForm />
            <FuelTypesList />
          </>
        )}
        
        {activeTab === "maintenance-types" && (
          <>
            <MaintenanceTypeForm />
            <MaintenanceTypesList />
          </>
        )}
      </div>
    </div>
  );
}

function ConfigButton({ icon, label, isActive, onClick, accent = false }) {
  return (
    <Button 
      variant={isActive ? "default" : accent ? "default" : "outline"}
      className={`h-20 w-full flex flex-col items-center justify-center gap-1 p-2 ${
        accent ? "bg-blue-600 hover:bg-blue-700 text-white" : ""
      }`}
      onClick={onClick}
    >
      <div className="h-5 w-5">{icon}</div>
      <span className="text-xs font-medium">{label}</span>
    </Button>
  );
}

function handleCreateDriver(driverData, fetchData) {
  return fetch('/api/drivers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(driverData),
  })
  .then((response) => {
    if (!response.ok) {
      throw new Error('Erro ao criar motorista');
    }
    return response.json();
  })
  .then(fetchData)
  .catch((error) => {
    console.error('Erro:', error);
    return Promise.reject('Ocorreu um erro no servidor.');
  });
}

// Current Implementation for DriverForm component
function DriverForm({ editingDriver, onSuccess }) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: editingDriver || {},
  });

  const { toast } = useToast();
  const fetchData = useQuery('/api/drivers');
  const mutation = useMutation((driverData) => handleCreateDriver(driverData, fetchData.refetch), {
    onSuccess: () => {
      toast({
        title: 'Motorista salvo com sucesso',
        description: 'O motorista foi salvo com sucesso',
      });
      reset();
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: error || 'Erro ao salvar o motorista',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data) => {
    if (editingDriver) {
      alert('Editar motorista não implementado ainda!');
    } else {
      mutation.mutate(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields here */}
      <button type="submit" disabled={mutation.isLoading}>Salve</button>
    </form>
  );
}