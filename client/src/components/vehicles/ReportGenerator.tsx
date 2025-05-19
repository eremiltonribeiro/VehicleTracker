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
  FileDown,
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

  // Gerar relatório em PDF usando jsPDF
  const generatePDFReport = () => {
    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const filteredData = prepareReportData();
    
    // Cores Granduvale Mineração
    const navyBlue = [18, 30, 61]; // rgb(18, 30, 61) em [r,g,b]
    const gold = [184, 155, 28];   // rgb(184, 155, 28) em [r,g,b]
    
    // Adicionar cabeçalho com logo da empresa
    doc.setFillColor(navyBlue[0], navyBlue[1], navyBlue[2]);
    doc.rect(0, 0, pageWidth, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('GRANDUVALE MINERAÇÃO', margin + 25, 12);
    
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.setFontSize(12);
    doc.text('Sistema de Gestão de Frota', margin + 25, 20);
    
    // Título do relatório
    doc.setTextColor(navyBlue[0], navyBlue[1], navyBlue[2]);
    doc.setFontSize(14);
    doc.text(`Relatório de ${getReportTypeName(reportType)}`, margin, 40);
    
    // Data de geração
    doc.setFontSize(10);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, margin, 48);
    
    // Informações dos filtros aplicados
    doc.setFontSize(10);
    doc.text(`Período: ${dateRange.from 
      ? `${format(dateRange.from, "dd/MM/yyyy")}${dateRange.to ? ` a ${format(dateRange.to, "dd/MM/yyyy")}` : ""}` 
      : "Todo o período"}`, margin, 54);
    
    // Adicionar linha divisória
    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, 58, pageWidth - margin, 58);
    
    // Configurar para tabela de dados
    doc.setFontSize(9);
    doc.setTextColor(navyBlue[0], navyBlue[1], navyBlue[2]);
    
    // Cabeçalhos da tabela de acordo com o tipo de relatório
    let headers = [];
    let startY = 65;
    const lineHeight = 8;
    
    switch (reportType) {
      case "fuel":
        headers = ["Data", "Veículo", "Motorista", "Posto", "Combustível", "Litros", "Preço", "Total", "Km"];
        break;
      case "maintenance":
        headers = ["Data", "Veículo", "Motorista", "Tipo", "Descrição", "Valor", "Km"];
        break;
      case "trip":
        headers = ["Data", "Veículo", "Motorista", "Origem", "Destino", "Km Inicial", "Km Final", "Distância"];
        break;
      default:
        headers = ["Data", "Veículo", "Motorista", "Tipo", "Descrição", "Valor"];
    }
    
    // Desenhar cabeçalhos da tabela
    const colWidth = (pageWidth - 2 * margin) / headers.length;
    
    // Fundo dos cabeçalhos
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, startY - 6, pageWidth - 2 * margin, 6, 'F');
    
    // Texto dos cabeçalhos
    doc.setFont('helvetica', 'bold');
    headers.forEach((header, i) => {
      doc.text(header, margin + i * colWidth, startY - 2);
    });
    
    // Dados das linhas
    doc.setFont('helvetica', 'normal');
    
    let currentY = startY;
    filteredData.forEach((reg, index) => {
      // Adicionar nova página se necessário
      if (currentY > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
      }
      
      // Fundo zebrado para facilitar leitura
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, currentY - 6, pageWidth - 2 * margin, lineHeight, 'F');
      }
      
      // Dados específicos para cada tipo de registro
      let rowData = [];
      
      switch (reg.type) {
        case "fuel":
          rowData = [
            reg.formattedDate,
            reg.vehicleName.substring(0, 12),
            reg.driverName.substring(0, 12),
            (reg.fuelStation || "N/A").substring(0, 10),
            (reg.fuelType || "N/A").substring(0, 8),
            (reg.fuelQuantity || "0").toString(),
            formatCurrency((reg.fuelCost / Math.max(1, reg.fuelQuantity)) || 0),
            formatCurrency(reg.fuelCost || 0),
            (reg.currentKm || "0").toString()
          ];
          break;
          
        case "maintenance":
          rowData = [
            reg.formattedDate,
            reg.vehicleName.substring(0, 12),
            reg.driverName.substring(0, 12),
            (reg.maintenanceType || "N/A").substring(0, 12),
            (reg.description || "").substring(0, 15),
            formatCurrency(reg.maintenanceCost || 0),
            (reg.currentKm || "0").toString()
          ];
          break;
          
        case "trip":
          const distance = (reg.finalKm || 0) - (reg.initialKm || 0);
          rowData = [
            reg.formattedDate,
            reg.vehicleName.substring(0, 12),
            reg.driverName.substring(0, 12),
            (reg.origin || "N/A").substring(0, 12),
            (reg.destination || "N/A").substring(0, 12),
            (reg.initialKm || "0").toString(),
            (reg.finalKm || "0").toString(),
            distance.toString()
          ];
          break;
          
        default:
          rowData = [
            reg.formattedDate,
            reg.vehicleName.substring(0, 12),
            reg.driverName.substring(0, 12),
            reg.type || "N/A",
            (reg.description || "").substring(0, 15),
            formatCurrency(reg.cost || 0)
          ];
      }
      
      rowData.forEach((cell, i) => {
        doc.text(cell.toString(), margin + i * colWidth, currentY);
      });
      
      currentY += lineHeight;
    });
    
    // Rodapé
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Linha do rodapé
      doc.setDrawColor(gold[0], gold[1], gold[2]);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
      
      // Texto do rodapé
      doc.setTextColor(navyBlue[0], navyBlue[1], navyBlue[2]);
      doc.setFontSize(8);
      doc.text('Granduvale Mineração - Sistema de Gestão de Frota', margin, pageHeight - 10);
      
      // Número da página
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 25, pageHeight - 10);
    }
    
    // Salvar o PDF
    doc.save(`relatorio_${reportType}_${new Date().toISOString().slice(0, 10)}.pdf`);
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
      <CardHeader style={{ backgroundColor: brandColors.navyBlue, color: 'white' }}>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Gerador de Relatórios
        </CardTitle>
        <CardDescription style={{ color: brandColors.lightGold }}>
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
      
      <CardFooter className="flex justify-between" style={{ backgroundColor: '#f9f9f9', borderTop: `1px solid ${brandColors.mediumGray}` }}>
        <Button 
          variant="outline" 
          onClick={resetFilters}
          className="flex items-center gap-1"
          style={{ borderColor: brandColors.navyBlue, color: brandColors.navyBlue }}
        >
          <Filter className="h-4 w-4" />
          Limpar filtros
        </Button>
        <div className="flex gap-2">
          <Button
            onClick={handleGenerateReport}
            disabled={isGenerating || getFilteredRegistrations().length === 0}
            className="flex items-center gap-1"
            style={{ 
              backgroundColor: fileFormat === 'pdf' ? brandColors.gold : brandColors.navyBlue, 
              color: 'white' 
            }}
          >
            {isGenerating ? (
              <>
                <span className="animate-spin">⏳</span>
                Gerando...
              </>
            ) : (
              <>
                {fileFormat === 'pdf' ? (
                  <FileDown className="h-4 w-4" />
                ) : (
                  <ArrowDownToLine className="h-4 w-4" />
                )}
                Gerar Relatório
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}