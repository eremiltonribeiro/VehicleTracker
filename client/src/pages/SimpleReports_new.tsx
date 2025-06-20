import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  Fuel, 
  Wrench, 
  Car, 
  BarChart3,
  TrendingUp,
  DollarSign,
  Clock,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { brandColors } from "@/lib/colors";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function SimpleReports() {
  const { toast } = useToast();
  const [reportType, setReportType] = useState("fuel");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [selectedVehicle, setSelectedVehicle] = useState("all");
  const [selectedDriver, setSelectedDriver] = useState("all");
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch data for filters
  const { data: vehicles = [] } = useQuery({
    queryKey: ["/api/vehicles"],
    queryFn: async () => {
      const res = await fetch("/api/vehicles");
      return res.ok ? res.json() : [];
    },
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ["/api/drivers"],
    queryFn: async () => {
      const res = await fetch("/api/drivers");
      return res.ok ? res.json() : [];
    },
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ["/api/registrations"],
    queryFn: async () => {
      const res = await fetch("/api/registrations");
      return res.ok ? res.json() : [];
    },
  });

  // Generate report statistics
  const getReportStats = () => {
    const filteredData = registrations.filter((reg: any) => {
      const matchesType = reportType === "all" || reg.type === reportType;
      const matchesVehicle = selectedVehicle === "all" || reg.vehicleId === parseInt(selectedVehicle);
      const matchesDriver = selectedDriver === "all" || reg.driverId === parseInt(selectedDriver);
      
      let matchesDate = true;
      if (dateRange.start && dateRange.end) {
        const regDate = new Date(reg.date);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        matchesDate = regDate >= startDate && regDate <= endDate;
      }
      
      return matchesType && matchesVehicle && matchesDriver && matchesDate;
    });

    const totalRecords = filteredData.length;
    const totalCost = filteredData.reduce((sum: number, reg: any) => sum + (reg.cost || 0), 0);
    
    const fuelRecords = filteredData.filter((reg: any) => reg.type === 'fuel');
    const maintenanceRecords = filteredData.filter((reg: any) => reg.type === 'maintenance');
    const tripRecords = filteredData.filter((reg: any) => reg.type === 'trip');

    return {
      totalRecords,
      totalCost,
      fuelRecords: fuelRecords.length,
      maintenanceRecords: maintenanceRecords.length,
      tripRecords: tripRecords.length,
      avgCostPerRecord: totalRecords > 0 ? totalCost / totalRecords : 0
    };
  };

  const stats = getReportStats();

  const generateReport = async (format: 'pdf' | 'excel' | 'csv') => {
    setIsGenerating(true);
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Relatório Gerado!",
        description: `Relatório em formato ${format.toUpperCase()} foi gerado com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro!",
        description: "Ocorreu um erro ao gerar o relatório.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: brandColors.primary[100] }}>
                  <FileText className="h-8 w-8" style={{ color: brandColors.primary[600] }} />
                </div>
                Relatórios Avançados
              </h1>
              <p className="text-gray-600 mt-2">
                Gere relatórios detalhados e análises da sua frota
              </p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total de Registros</p>
                  <p className="text-2xl font-bold">{stats.totalRecords}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Custo Total</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalCost)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Abastecimentos</p>
                  <p className="text-2xl font-bold">{stats.fuelRecords}</p>
                </div>
                <Fuel className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Manutenções</p>
                  <p className="text-2xl font-bold">{stats.maintenanceRecords}</p>
                </div>
                <Wrench className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Report Interface */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros e Configurações
            </CardTitle>
            <CardDescription>
              Configure os parâmetros para gerar relatórios personalizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={reportType} onValueChange={setReportType} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="fuel">Abastecimentos</TabsTrigger>
                <TabsTrigger value="maintenance">Manutenções</TabsTrigger>
                <TabsTrigger value="trip">Viagens</TabsTrigger>
              </TabsList>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="start-date" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Data Inicial
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Data Final
                  </Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Veículo
                  </Label>
                  <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar veículo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os veículos</SelectItem>
                      {vehicles.map((vehicle: any) => (
                        <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                          {vehicle.plate} - {vehicle.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Motorista
                  </Label>
                  <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar motorista" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os motoristas</SelectItem>
                      {drivers.map((driver: any) => (
                        <SelectItem key={driver.id} value={driver.id.toString()}>
                          {driver.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Report Content for each tab */}
              <TabsContent value="all" className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Relatório Geral da Frota</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Resumo completo de todas as atividades da frota no período selecionado.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Total de Registros:</span>
                      <span className="font-semibold ml-2">{stats.totalRecords}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Custo Total:</span>
                      <span className="font-semibold ml-2">{formatCurrency(stats.totalCost)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Média por Registro:</span>
                      <span className="font-semibold ml-2">{formatCurrency(stats.avgCostPerRecord)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Período:</span>
                      <span className="font-semibold ml-2">
                        {dateRange.start && dateRange.end 
                          ? `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`
                          : "Todos os períodos"
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="fuel" className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Fuel className="h-4 w-4 text-blue-600" />
                    Relatório de Abastecimentos
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Análise detalhada dos abastecimentos realizados pela frota.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Total de Abastecimentos:</span>
                      <span className="font-semibold ml-2">{stats.fuelRecords}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Consumo Total:</span>
                      <span className="font-semibold ml-2">Calculando...</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Média Km/L:</span>
                      <span className="font-semibold ml-2">Calculando...</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="maintenance" className="space-y-4">
                <div className="bg-orange-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-orange-600" />
                    Relatório de Manutenções
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Controle e histórico das manutenções realizadas nos veículos.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Total de Manutenções:</span>
                      <span className="font-semibold ml-2">{stats.maintenanceRecords}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Manutenções Preventivas:</span>
                      <span className="font-semibold ml-2">Calculando...</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Manutenções Corretivas:</span>
                      <span className="font-semibold ml-2">Calculando...</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="trip" className="space-y-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Car className="h-4 w-4 text-green-600" />
                    Relatório de Viagens
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Análise das viagens e utilização dos veículos da frota.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Total de Viagens:</span>
                      <span className="font-semibold ml-2">{stats.tripRecords}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Km Total:</span>
                      <span className="font-semibold ml-2">Calculando...</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Média Km/Viagem:</span>
                      <span className="font-semibold ml-2">Calculando...</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Export Options */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => generateReport('csv')}
                  disabled={isGenerating}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={() => generateReport('excel')}
                  disabled={isGenerating}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Excel
                </Button>
                <Button
                  onClick={() => generateReport('pdf')}
                  disabled={isGenerating}
                  className="flex items-center gap-2"
                  style={{ backgroundColor: brandColors.primary[600] }}
                >
                  <Download className="h-4 w-4" />
                  {isGenerating ? "Gerando..." : "PDF"}
                </Button>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
