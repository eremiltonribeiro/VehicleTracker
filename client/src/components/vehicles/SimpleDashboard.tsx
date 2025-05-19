import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Fuel, Wrench, MapPin, Droplet, Car, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { offlineStorage } from "@/services/offlineStorage";

export function SimpleDashboard() {
  // Fetch all registrations with offline support
  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ["/api/registrations"],
    queryFn: async () => {
      try {
        if (navigator.onLine) {
          const res = await fetch("/api/registrations");
          if (res.ok) {
            const data = await res.json();
            await offlineStorage.saveRegistrations(data);
            return data;
          }
        }
        
        // Fallback to offline data
        return await offlineStorage.getRegistrations();
      } catch (error) {
        console.error("Erro ao buscar registros:", error);
        return await offlineStorage.getRegistrations();
      }
    }
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for charts
  const fuelRegistrations = registrations.filter((reg: any) => reg.type === "fuel");
  const maintenanceRegistrations = registrations.filter((reg: any) => reg.type === "maintenance");
  const tripRegistrations = registrations.filter((reg: any) => reg.type === "trip");

  // Data for registration type distribution
  const registrationTypeData = [
    { name: "Abastecimentos", value: fuelRegistrations.length, color: "#f59e0b" },
    { name: "Manutenções", value: maintenanceRegistrations.length, color: "#10b981" },
    { name: "Viagens", value: tripRegistrations.length, color: "#3b82f6" },
  ];

  // Calculate totals
  const totalFuelCost = fuelRegistrations.reduce((sum: number, reg: any) => sum + (reg.fuelCost || 0), 0);
  const totalMaintenanceCost = maintenanceRegistrations.reduce((sum: number, reg: any) => sum + (reg.maintenanceCost || 0), 0);
  const totalKm = tripRegistrations.reduce((sum: number, reg: any) => sum + ((reg.finalKm || 0) - (reg.initialKm || 0)), 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard de Frota</CardTitle>
          <CardDescription>Visualização dos dados de movimentação de veículos</CardDescription>
        </CardHeader>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gastos com Combustível</p>
                <h3 className="text-2xl font-bold">{formatCurrency(totalFuelCost)}</h3>
              </div>
              <div className="p-2 bg-amber-100 rounded-full">
                <Fuel className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gastos com Manutenção</p>
                <h3 className="text-2xl font-bold">{formatCurrency(totalMaintenanceCost)}</h3>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <Wrench className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Quilometragem Total</p>
                <h3 className="text-2xl font-bold">{totalKm.toLocaleString('pt-BR')} km</h3>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <MapPin className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Registros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={registrationTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    nameKey="name"
                    label={(entry) => entry.name}
                  >
                    {registrationTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [value, 'Quantidade']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance costs by vehicle */}
        <Card>
          <CardHeader>
            <CardTitle>Gastos com Manutenção por Veículo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={maintenanceRegistrations.reduce((acc: any[], reg: any) => {
                    const vehicleName = reg.vehicle?.name || "Desconhecido";
                    const existingVehicle = acc.find(item => item.name === vehicleName);
                    
                    if (existingVehicle) {
                      existingVehicle.value += reg.maintenanceCost || 0;
                    } else {
                      acc.push({
                        name: vehicleName,
                        value: reg.maintenanceCost || 0
                      });
                    }
                    
                    return acc;
                  }, [])}
                >
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value: any) => [formatCurrency(value), 'Valor']} />
                  <Bar dataKey="value" name="Valor" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Dados do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-medium">Registros</h3>
              <p>Total: {registrations.length}</p>
              <p>Abastecimentos: {fuelRegistrations.length}</p>
              <p>Manutenções: {maintenanceRegistrations.length}</p>
              <p>Viagens: {tripRegistrations.length}</p>
            </div>
            
            <div>
              <h3 className="font-medium">Custos</h3>
              <p>Combustível: {formatCurrency(totalFuelCost)}</p>
              <p>Manutenção: {formatCurrency(totalMaintenanceCost)}</p>
              <p>Total: {formatCurrency(totalFuelCost + totalMaintenanceCost)}</p>
            </div>
            
            <div>
              <h3 className="font-medium">Veículos</h3>
              <p>Quilometragem: {totalKm.toLocaleString('pt-BR')} km</p>
              <p>Média por veículo: {(totalKm / 3).toLocaleString('pt-BR')} km</p>
              <p>Custo por km: {formatCurrency((totalFuelCost + totalMaintenanceCost) / Math.max(1, totalKm))}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}