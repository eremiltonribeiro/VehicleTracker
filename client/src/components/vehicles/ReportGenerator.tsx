import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Download,
  Calendar,
  Car,
  User,
  Filter,
  ArrowDownToLine,
  FilePdf,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { offlineStorage } from "@/services/offlineStorage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { jsPDF } from "jspdf";
import { Logo } from "@/components/ui/logo";
import { brandColors } from "@/lib/colors";

export function ReportGenerator() {
  // Estado para filtros e configurações do relatório
  const [reportType, setReportType] = useState("fuel");
  const [fileFormat, setFileFormat] = useState("csv");
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<number[]>([]);
  const [selectedDriverIds, setSelectedDriverIds] = useState<number[]>([]);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // Buscar registros com suporte offline
  const { data: registrations = [] } = useQuery({
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
        
        // Fallback para dados offline
        return await offlineStorage.getRegistrations();
      } catch (error) {
        console.error("Erro ao buscar registros:", error);
        return await offlineStorage.getRegistrations();
      }
    }
  });

  // Buscar veículos
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
        
        return await offlineStorage.getVehicles();
      } catch (error) {
        console.error("Erro ao buscar veículos:", error);
        return await offlineStorage.getVehicles();
      }
    }
  });
  
  // Buscar motoristas
  const { data: drivers = [] } = useQuery({
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

  // Verificar se um veículo está selecionado
  const isVehicleSelected = (id: number) => {
    return selectedVehicleIds.length === 0 || selectedVehicleIds.includes(id);
  };

  // Verificar se um motorista está selecionado
  const isDriverSelected = (id: number) => {
    return selectedDriverIds.length === 0 || selectedDriverIds.includes(id);
  };

  // Alternar seleção de veículo
  const toggleVehicleSelection = (id: number) => {
    if (selectedVehicleIds.includes(id)) {
      setSelectedVehicleIds(selectedVehicleIds.filter(vehicleId => vehicleId !== id));
    } else {
      setSelectedVehicleIds([...selectedVehicleIds, id]);
    }
  };

  // Alternar seleção de motorista
  const toggleDriverSelection = (id: number) => {
    if (selectedDriverIds.includes(id)) {
      setSelectedDriverIds(selectedDriverIds.filter(driverId => driverId !== id));
    } else {
      setSelectedDriverIds([...selectedDriverIds, id]);
    }
  };

  // Limpar filtros
  const resetFilters = () => {
    setSelectedVehicleIds([]);
    setSelectedDriverIds([]);
    setDateRange({ from: undefined, to: undefined });
  };

  // Filtrar registros
  const getFilteredRegistrations = () => {
    let filteredRegs = [...registrations];
    
    // Filtrar por tipo de relatório
    if (reportType !== "all") {
      filteredRegs = filteredRegs.filter((reg: any) => reg.type === reportType);
    }
    
    // Filtrar por veículo
    if (selectedVehicleIds.length > 0) {
      filteredRegs = filteredRegs.filter((reg: any) => 
        selectedVehicleIds.includes(reg.vehicleId)
      );
    }
    
    // Filtrar por motorista
    if (selectedDriverIds.length > 0) {
      filteredRegs = filteredRegs.filter((reg: any) => 
        selectedDriverIds.includes(reg.driverId)
      );
    }
    
    // Filtrar por período de data
    if (dateRange.from) {
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      
      filteredRegs = filteredRegs.filter((reg: any) => {
        const regDate = new Date(reg.date);
        return regDate >= fromDate;
      });
      
      if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        
        filteredRegs = filteredRegs.filter((reg: any) => {
          const regDate = new Date(reg.date);
          return regDate <= toDate;
        });
      }
    }
    
    return filteredRegs;
  };

  // Função para preparar dados para o relatório
  const prepareReportData = () => {
    const filteredData = getFilteredRegistrations();
    
    // Encontrar objetos relacionados
    const enrichedData = filteredData.map((reg: any) => {
      const vehicle = vehicles.find((v: any) => v.id === reg.vehicleId) || {};
      const driver = drivers.find((d: any) => d.id === reg.driverId) || {};
      
      return {
        ...reg,
        vehicleName: vehicle.name || "Desconhecido",
        vehiclePlate: vehicle.plate || "N/A",
        driverName: driver.name || "Desconhecido",
        formattedDate: formatDate(reg.date),
      };
    });
    
    return enrichedData;
  };

  // Função para gerar o cabeçalho do CSV de acordo com o tipo de relatório
  const getCSVHeaders = () => {
    const commonHeaders = ["ID", "Data", "Veículo", "Placa", "Motorista"];
    
    switch (reportType) {
      case "fuel":
        return [...commonHeaders, "Posto", "Combustível", "Litros", "Preço/L", "Valor Total", "Km Atual"].join(",");
      case "maintenance":
        return [...commonHeaders, "Tipo", "Descrição", "Valor", "Km Atual"].join(",");
      case "trip":
        return [...commonHeaders, "Origem", "Destino", "Km Inicial", "Km Final", "Distância", "Propósito"].join(",");
      default:
        return [...commonHeaders, "Tipo", "Descrição", "Valor"].join(",");
    }
  };

  // Função para gerar uma linha do CSV de acordo com o tipo de relatório
  const getCSVRow = (reg: any) => {
    const commonFields = [
      reg.id,
      reg.formattedDate,
      reg.vehicleName,
      reg.vehiclePlate,
      reg.driverName
    ];
    
    switch (reg.type) {
      case "fuel":
        return [...commonFields, 
          reg.fuelStation || "N/A",
          reg.fuelType || "N/A",
          reg.fuelQuantity || "0",
          (reg.fuelCost / Math.max(1, reg.fuelQuantity)).toFixed(2),
          formatCurrency(reg.fuelCost || 0).replace(",", ""),
          reg.currentKm || "0"
        ].join(",");
      
      case "maintenance":
        return [...commonFields, 
          reg.maintenanceType || "N/A",
          reg.description || "",
          formatCurrency(reg.maintenanceCost || 0).replace(",", ""),
          reg.currentKm || "0"
        ].join(",");
      
      case "trip":
        const distance = (reg.finalKm || 0) - (reg.initialKm || 0);
        return [...commonFields, 
          reg.origin || "N/A",
          reg.destination || "N/A",
          reg.initialKm || "0",
          reg.finalKm || "0",
          distance,
          reg.purpose || ""
        ].join(",");
      
      default:
        return [...commonFields, 
          reg.type || "N/A",
          reg.description || "",
          formatCurrency(reg.cost || 0).replace(",", "")
        ].join(",");
    }
  };

  // Gerar e baixar o relatório em CSV
  const generateCSVReport = () => {
    const data = prepareReportData();
    const headers = getCSVHeaders();
    const rows = data.map((reg: any) => getCSVRow(reg));
    
    const csvContent = [headers, ...rows].join("\n");
    
    // Criar um Blob e fazer download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Gerar relatório em PDF (simplificado - na prática usaríamos uma biblioteca como jsPDF)
  const generatePDFReport = () => {
    alert("Geração de PDF não implementada nesta versão. Por favor, escolha o formato CSV.");
  };

  // Manipular geração de relatório
  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    try {
      if (fileFormat === "csv") {
        generateCSVReport();
      } else if (fileFormat === "pdf") {
        generatePDFReport();
      }
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      alert("Ocorreu um erro ao gerar o relatório. Por favor, tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Tradução dos tipos de relatório
  const getReportTypeName = (type: string) => {
    switch (type) {
      case "fuel": return "Abastecimentos";
      case "maintenance": return "Manutenções";
      case "trip": return "Viagens";
      case "all": return "Todos os tipos";
      default: return type;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Gerador de Relatórios
        </CardTitle>
        <CardDescription>
          Configure e exporte relatórios personalizados para análise de dados
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tipo de relatório */}
          <div className="space-y-2">
            <Label htmlFor="report-type">Tipo de Relatório</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger id="report-type">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="fuel">Abastecimentos</SelectItem>
                <SelectItem value="maintenance">Manutenções</SelectItem>
                <SelectItem value="trip">Viagens</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Formato de arquivo */}
          <div className="space-y-2">
            <Label htmlFor="file-format">Formato do Arquivo</Label>
            <Select value={fileFormat} onValueChange={setFileFormat}>
              <SelectTrigger id="file-format">
                <SelectValue placeholder="Selecione o formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Excel)</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Período */}
          <div className="space-y-2">
            <Label>Período</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                        {format(dateRange.to, "dd/MM/yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy")
                    )
                  ) : (
                    "Selecione o período"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange as any}
                  locale={pt}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        {/* Seleção de veículos e motoristas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Veículos */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Car className="h-4 w-4" />
              <span>Veículos</span>
            </Label>
            <div className="h-48 overflow-y-auto border rounded-md p-2">
              {vehicles.map((vehicle: any) => (
                <div key={vehicle.id} className="flex items-center gap-2 mb-1">
                  <Checkbox 
                    id={`vehicle-${vehicle.id}`} 
                    checked={isVehicleSelected(vehicle.id)}
                    onCheckedChange={() => toggleVehicleSelection(vehicle.id)}
                  />
                  <Label htmlFor={`vehicle-${vehicle.id}`} className="text-sm">
                    {vehicle.name} ({vehicle.plate})
                  </Label>
                </div>
              ))}
              {vehicles.length === 0 && (
                <p className="text-sm text-muted-foreground p-2">
                  Nenhum veículo cadastrado.
                </p>
              )}
            </div>
          </div>
          
          {/* Motoristas */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>Motoristas</span>
            </Label>
            <div className="h-48 overflow-y-auto border rounded-md p-2">
              {drivers.map((driver: any) => (
                <div key={driver.id} className="flex items-center gap-2 mb-1">
                  <Checkbox 
                    id={`driver-${driver.id}`} 
                    checked={isDriverSelected(driver.id)}
                    onCheckedChange={() => toggleDriverSelection(driver.id)}
                  />
                  <Label htmlFor={`driver-${driver.id}`} className="text-sm">
                    {driver.name}
                  </Label>
                </div>
              ))}
              {drivers.length === 0 && (
                <p className="text-sm text-muted-foreground p-2">
                  Nenhum motorista cadastrado.
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Visualização prévia */}
        <div>
          <h3 className="text-lg font-medium mb-2">Resumo do Relatório</h3>
          <div className="bg-gray-50 p-4 rounded-md border">
            <p><strong>Tipo:</strong> {getReportTypeName(reportType)}</p>
            <p><strong>Formato:</strong> {fileFormat.toUpperCase()}</p>
            <p>
              <strong>Período:</strong>{' '}
              {dateRange.from
                ? `${format(dateRange.from, "dd/MM/yyyy")}${
                    dateRange.to ? ` a ${format(dateRange.to, "dd/MM/yyyy")}` : ""
                  }`
                : "Todo o período"}
            </p>
            <p>
              <strong>Veículos:</strong>{' '}
              {selectedVehicleIds.length === 0
                ? "Todos"
                : selectedVehicleIds.length}
            </p>
            <p>
              <strong>Motoristas:</strong>{' '}
              {selectedDriverIds.length === 0
                ? "Todos"
                : selectedDriverIds.length}
            </p>
            <p>
              <strong>Total de registros:</strong>{' '}
              {getFilteredRegistrations().length}
            </p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={resetFilters}
          className="flex items-center gap-1"
        >
          <Filter className="h-4 w-4" />
          Limpar filtros
        </Button>
        <Button
          onClick={handleGenerateReport}
          disabled={isGenerating || getFilteredRegistrations().length === 0}
          className="flex items-center gap-1"
        >
          {isGenerating ? (
            <>
              <span className="animate-spin">⏳</span>
              Gerando...
            </>
          ) : (
            <>
              <ArrowDownToLine className="h-4 w-4" />
              Gerar Relatório
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}