import { useState, useEffect, useMemo } from "react";
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
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts";
import { 
  Fuel, 
  Wrench, 
  MapPin, 
  Calendar, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { addDays, subDays, startOfMonth, endOfMonth, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { brandColors } from "@/lib/colors";

export function DashboardWithFilters() {
  const [selectedPeriod, setSelectedPeriod] = useState("30days");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");
  
  // Calculate date range based on selected period
  const dateRange = useMemo(() => {
    const today = new Date();
    switch (selectedPeriod) {
      case "7days":
        return { from: subDays(today, 7), to: today };
      case "30days":
        return { from: subDays(today, 30), to: today };
      case "90days":
        return { from: subDays(today, 90), to: today };
      case "thisMonth":
        return { from: startOfMonth(today), to: endOfMonth(today) };
      default:
        return { from: subDays(today, 30), to: today };
    }
  }, [selectedPeriod]);

  // Fetch data
  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
    queryKey: ["/api/vehicles"],
    queryFn: async () => {
      const res = await fetch("/api/vehicles");
      return res.ok ? res.json() : [];
    },
  });

  const { data: registrations = [], isLoading: registrationsLoading } = useQuery({
    queryKey: ["/api/registrations", selectedVehicle, selectedPeriod],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedVehicle !== "all") {
        params.append("vehicleId", selectedVehicle);
      }
      params.append("startDate", dateRange.from.toISOString());
      params.append("endDate", dateRange.to.toISOString());
      
      const res = await fetch(`/api/registrations?${params}`);
      return res.ok ? res.json() : [];
    },
  });

  // Process data for charts
  const dashboardData = useMemo(() => {
    const fuelRegistrations = registrations.filter((r: any) => r.type === 'fuel');
    const maintenanceRegistrations = registrations.filter((r: any) => r.type === 'maintenance');
    const tripRegistrations = registrations.filter((r: any) => r.type === 'trip');

    // Calculate totals
    const totalFuelCost = fuelRegistrations.reduce((sum: number, r: any) => sum + (r.fuelCost || 0), 0);
    const totalMaintenanceCost = maintenanceRegistrations.reduce((sum: number, r: any) => sum + (r.maintenanceCost || 0), 0);
    const totalLiters = fuelRegistrations.reduce((sum: number, r: any) => sum + (r.liters || 0), 0);
    
    const totalCost = totalFuelCost + totalMaintenanceCost;
    
    // Calculate kilometers traveled
    const totalKm = tripRegistrations.reduce((sum: number, r: any) => {
      const km = (r.finalKm || 0) - (r.initialKm || 0);
      return sum + Math.max(0, km);
    }, 0);

    // Calculate average consumption
    const averageConsumption = totalKm > 0 && totalLiters > 0 ? totalKm / totalLiters : 0;

    // Cost breakdown for pie chart
    const costBreakdown = [
      { name: 'Combustível', value: totalFuelCost, color: brandColors.success[500] },
      { name: 'Manutenção', value: totalMaintenanceCost, color: brandColors.error[500] },
    ].filter(item => item.value > 0);

    // Monthly trend data
    const monthlyData: { [key: string]: { fuel: number, maintenance: number, trips: number, month: string } } = {};
    
    registrations.forEach((r: any) => {
      const month = format(new Date(r.date), 'MM/yyyy');
      if (!monthlyData[month]) {
        monthlyData[month] = { fuel: 0, maintenance: 0, trips: 0, month };
      }
      
      if (r.type === 'fuel') {
        monthlyData[month].fuel += (r.fuelCost || 0);
      } else if (r.type === 'maintenance') {
        monthlyData[month].maintenance += (r.maintenanceCost || 0);
      } else if (r.type === 'trip') {
        monthlyData[month].trips += 1;
      }
    });

    const trendData = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

    // Vehicle performance comparison
    const vehicleStats: { [key: string]: any } = {};
    
    vehicles.forEach((vehicle: any) => {
      const vehicleRegistrations = registrations.filter((r: any) => r.vehicleId === vehicle.id);
      const vehicleFuel = vehicleRegistrations.filter((r: any) => r.type === 'fuel');
      const vehicleMaintenance = vehicleRegistrations.filter((r: any) => r.type === 'maintenance');
      
      vehicleStats[vehicle.id] = {
        name: vehicle.name,
        fuelCost: vehicleFuel.reduce((sum: number, r: any) => sum + (r.fuelCost || 0), 0),
        maintenanceCost: vehicleMaintenance.reduce((sum: number, r: any) => sum + (r.maintenanceCost || 0), 0),
        totalRegistrations: vehicleRegistrations.length,
      };
    });

    const vehiclePerformance = Object.values(vehicleStats);

    return {
      totals: {
        totalCost,
        totalFuelCost,
        totalMaintenanceCost,
        totalLiters,
        totalKm,
        averageConsumption,
        totalRegistrations: registrations.length
      },
      costBreakdown,
      trendData,
      vehiclePerformance
    };
  }, [registrations, vehicles]);

  if (vehiclesLoading || registrationsLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Carregando dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard de Gestão</h2>
          <p className="text-gray-600">Análise de desempenho e custos da frota</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Últimos 7 dias</SelectItem>
              <SelectItem value="30days">Últimos 30 dias</SelectItem>
              <SelectItem value="90days">Últimos 90 dias</SelectItem>
              <SelectItem value="thisMonth">Este mês</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Todos os veículos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os veículos</SelectItem>
              {vehicles.map((vehicle: any) => (
                <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                  {vehicle.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Custo Total</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(dashboardData.totals.totalCost)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Combustível</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(dashboardData.totals.totalFuelCost)}
                </p>
              </div>
              <Fuel className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Manutenção</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(dashboardData.totals.totalMaintenanceCost)}
                </p>
              </div>
              <Wrench className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Quilometragem</p>
                <p className="text-2xl font-bold">
                  {dashboardData.totals.totalKm.toLocaleString()} km
                </p>
              </div>
              <MapPin className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="vehicles">Veículos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cost Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Distribuição de Custos
                </CardTitle>
                <CardDescription>
                  Breakdown dos gastos por categoria
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardData.costBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dashboardData.costBreakdown}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {dashboardData.costBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    Sem dados para exibir
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Efficiency Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Métricas de Eficiência
                </CardTitle>
                <CardDescription>
                  Indicadores de performance da frota
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Consumo Médio</span>
                  <Badge variant="secondary">
                    {dashboardData.totals.averageConsumption > 0 
                      ? `${dashboardData.totals.averageConsumption.toFixed(1)} km/L`
                      : 'N/A'
                    }
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Total de Litros</span>
                  <Badge variant="secondary">
                    {dashboardData.totals.totalLiters.toLocaleString()} L
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Registros no Período</span>
                  <Badge variant="secondary">
                    {dashboardData.totals.totalRegistrations}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Custo por KM</span>
                  <Badge variant="secondary">
                    {dashboardData.totals.totalKm > 0 
                      ? formatCurrency(dashboardData.totals.totalCost / dashboardData.totals.totalKm)
                      : 'N/A'
                    }
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Tendência de Custos Mensais
              </CardTitle>
              <CardDescription>
                Evolução dos gastos ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData.trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={dashboardData.trendData}>
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip 
                      formatter={(value: any) => formatCurrency(value)}
                      labelStyle={{ color: '#374151' }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="fuel"
                      stackId="1"
                      stroke={brandColors.success[600]}
                      fill={brandColors.success[500]}
                      name="Combustível"
                    />
                    <Area
                      type="monotone"
                      dataKey="maintenance"
                      stackId="1"
                      stroke={brandColors.error[600]}
                      fill={brandColors.error[500]}
                      name="Manutenção"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  Sem dados suficientes para exibir tendências
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehicles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance por Veículo
              </CardTitle>
              <CardDescription>
                Comparação de custos entre veículos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData.vehiclePerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={dashboardData.vehiclePerformance}>
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip 
                      formatter={(value: any) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar 
                      dataKey="fuelCost" 
                      fill={brandColors.success[500]} 
                      name="Combustível"
                    />
                    <Bar 
                      dataKey="maintenanceCost" 
                      fill={brandColors.error[500]} 
                      name="Manutenção"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  Sem dados de veículos para exibir
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
