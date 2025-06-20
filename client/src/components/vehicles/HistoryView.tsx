import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { offlineStorage } from "@/services/offlineStorage";
import { syncManager } from "@/services/syncManager";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  CalendarIcon, 
  Fuel, 
  Wrench, 
  MapPin, 
  Calendar, 
  User, 
  Route,
  ChevronLeft,
  ChevronRight,
  Edit,
  TrendingUp,
  Trash2,
  Eye,
  Download,
  Maximize2,
  X
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { 
  formatCurrency, 
  formatDate, 
  getRegistrationTypeText,
  getRegistrationTypeColor
} from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export function HistoryView() {
  // Debug: log para verificar se o componente está sendo montado
  console.log("🔍 HistoryView montado");
  
  // Estado para filtros
  const [filters, setFilters] = useState({
    type: "all",
    vehicleId: "all",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  });

  // Estado para visualização de detalhes
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  
  // Estado para visualização de foto
  const [photoViewOpen, setPhotoViewOpen] = useState(false);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
  
  // Estado para diálogo de confirmação de exclusão
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] = useState<number | null>(null);

  // Hook para toast
  const { toast } = useToast();
  
  // Hook para navegação
  const [, setLocation] = useLocation();
  
  // Query client para atualização de dados
  const queryClient = useQueryClient();

  // Query para buscar registros com filtros
  const { data: registrations = [], isLoading, refetch } = useQuery({
    queryKey: [
      "/api/registrations", 
      filters.type, 
      filters.vehicleId, 
      filters.startDate, 
      filters.endDate
    ],
    queryFn: async ({ queryKey }) => {
      const [_, type, vehicleId, startDate, endDate] = queryKey;

      let url = "/api/registrations";
      const params = new URLSearchParams();

      if (type && type !== "all") params.append("type", type as string);
      if (vehicleId && vehicleId !== "all") params.append("vehicleId", vehicleId as string);
      if (startDate) params.append("startDate", (startDate as Date).toISOString());
      if (endDate) params.append("endDate", (endDate as Date).toISOString());

      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      console.log("🌐 Fazendo requisição para:", url);

      try {
        const res = await fetch(url, {
          credentials: "include",
          cache: "no-cache", // Força buscar dados frescos
          headers: {
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
          }
        });

        if (!res.ok) {
          throw new Error("Failed to fetch registrations");
        }

        const data = await res.json();
        console.log("🔍 HistoryView - Dados carregados:", data);
        return data;
      } catch (error) {
        console.error("Erro ao buscar registros:", error);
        return [];
      }
    },
    // Configurações para sempre buscar dados frescos
    staleTime: 0, // Considerar dados sempre como obsoletos
    gcTime: 0, // Não manter cache
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Listener para atualização automática após sincronização
  useEffect(() => {
    function handleDataSync() {
      console.log("Evento de sincronização detectado, atualizando dados");
      queryClient.invalidateQueries({ queryKey: ["/api/registrations"] });
      refetch();
    }
    
    function handleDriverUpdate() {
      console.log("Motorista atualizado, invalidando cache de registros");
      queryClient.invalidateQueries({ queryKey: ["/api/registrations"] });
      refetch();
    }
    
    function handleVehicleUpdate() {
      console.log("Veículo atualizado, invalidando cache de registros");
      queryClient.invalidateQueries({ queryKey: ["/api/registrations"] });
      refetch();
    }
    
    function handleRegistrationUpdate() {
      console.log("🔄 Registro atualizado, invalidando cache e recarregando dados");
      // Invalidar todas as queries relacionadas a registrations
      queryClient.invalidateQueries({ queryKey: ["/api/registrations"] });
      queryClient.removeQueries({ queryKey: ["/api/registrations"] });
      
      // Forçar refetch imediato
      refetch();
      
      console.log("� Cache invalidado e dados sendo recarregados");
    }
    
    // Adicionar listeners para atualizações de motoristas, veículos e registros
    window.addEventListener("data-synchronized", handleDataSync);
    window.addEventListener("driver-updated", handleDriverUpdate);
    window.addEventListener("vehicle-updated", handleVehicleUpdate);
    window.addEventListener("registration-updated", handleRegistrationUpdate);
    
    return () => {
      window.removeEventListener("data-synchronized", handleDataSync);
      window.removeEventListener("driver-updated", handleDriverUpdate);
      window.removeEventListener("vehicle-updated", handleVehicleUpdate);
      window.removeEventListener("registration-updated", handleRegistrationUpdate);
    };
  }, [queryClient, refetch]);

  // Query para buscar veículos para filtro
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
    },
  });

  // Handler para resetar filtros
  const resetFilters = () => {
    setFilters({
      type: "all",
      vehicleId: "all",
      startDate: undefined,
      endDate: undefined,
    });
  };

  // Abrir visualização de detalhes
  const openDetailView = (registration: any) => {
    setSelectedRegistration(registration);
  };

  // Abrir visualização de foto
  const openPhotoView = (photoUrl: string) => {
    setCurrentPhotoUrl(photoUrl);
    setPhotoViewOpen(true);
  };

  // Editar registro
  const handleEditRegistration = (id: number) => {
    console.log(`Editando registro com ID: ${id}`);
    try {
      setLocation(`/registros/edit/${id}`);
      console.log(`Navegação para edição realizada com sucesso`);
    } catch (error) {
      console.error("Erro ao navegar para edição:", error);
    }
  };

  // Abrir confirmação de exclusão
  const openDeleteConfirmation = (id: number) => {
    setRegistrationToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Excluir registro
  const handleDeleteRegistration = async () => {
    if (!registrationToDelete) return;
    
    console.log("Iniciando exclusão do registro ID:", registrationToDelete);

    // Encontrar o registro completo pelo ID
    const registrationToDeleteObj = registrations.find((r: any) => r.id === registrationToDelete);
    
    // Verificar se é um registro offline pendente
    if (registrationToDeleteObj?.offlinePending) {
      try {
        // Remover operação pendente do IndexedDB
        await offlineStorage.removePendingOperation(`temp_${registrationToDelete}`);
        
        // Remover dos dados locais
        const currentData = await offlineStorage.getOfflineDataByType("registrations") || [];
        const updatedData = currentData.filter((r: any) => r.id !== registrationToDelete);
        await offlineStorage.saveOfflineData("registrations", updatedData);
        
        toast({
          title: "Registro excluído",
          description: "O registro pendente foi removido localmente.",
        });
        
        // Refresh data
        queryClient.invalidateQueries({ queryKey: ["/api/registrations"] });
        
        // Close dialog
        setDeleteDialogOpen(false);
        setRegistrationToDelete(null);
        
      } catch (error) {
        console.error("Erro ao excluir registro offline:", error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir o registro offline. Tente novamente.",
          variant: "destructive",
        });
      }
      return;
    }
    
    // Se é um registro normal (não offline)
    try {
      console.log(`Tentando excluir registro com ID: ${registrationToDelete}`);
      
      // Usar fetch para enviar uma requisição DELETE para o endpoint
      const response = await fetch(`/api/registrations/${registrationToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });

      // Log da resposta para debug
      console.log(`Resposta do servidor:`, response.status, response.statusText);
      
      let responseText;
      try {
        responseText = await response.text();
        console.log(`Texto da resposta:`, responseText);
      } catch (e) {
        console.error("Erro ao ler resposta como texto:", e);
      }
      
      if (!response.ok) {
        throw new Error(`Falha ao excluir o registro: ${response.status} ${response.statusText}`);
      }

      // Exibir mensagem de sucesso
      toast({
        title: "Registro excluído",
        description: "O registro foi excluído com sucesso!",
      });

      // Atualizar dados na interface
      refetch();

      // Fechar diálogo de confirmação
      setDeleteDialogOpen(false);
      setRegistrationToDelete(null);

    } catch (error) {
      console.error("Erro completo:", error);
      
      // Se estiver offline, tenta enfileirar a exclusão
      if (!navigator.onLine) {
        try {
          await syncManager.interceptRequest(
            `/api/registrations/${registrationToDelete}`, 
            'DELETE', 
            null
          );
          
          toast({
            title: "Operação enfileirada",
            description: "A exclusão será processada quando estiver online.",
          });
          
          // Refresh data
          refetch();
          
          // Close dialog
          setDeleteDialogOpen(false);
          setRegistrationToDelete(null);
          
        } catch (offlineError) {
          console.error("Erro ao enfileirar operação offline:", offlineError);
          toast({
            title: "Erro",
            description: "Não foi possível enfileirar a exclusão. Tente novamente.",
            variant: "destructive",
          });
        }
        return;
      }
      
      toast({
        title: "Erro",
        description: "Não foi possível excluir o registro. Verifique o console para mais detalhes.",
        variant: "destructive",
      });
    }
  };

  // Download da foto
  const handleDownloadPhoto = (photoUrl: string, registrationType: string) => {
    const link = document.createElement('a');
    link.href = photoUrl;
    link.download = `comprovante_${registrationType}_${new Date().getTime()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalItems = registrations?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const paginatedRegistrations = registrations
    ? registrations.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      )
    : [];

  // Debug: log para verificar os registros
  console.log("🔍 HistoryView - Registros totais:", registrations?.length || 0);
  console.log("🔍 HistoryView - Filtros atuais:", filters);
  console.log("🔍 HistoryView - Registros paginados:", paginatedRegistrations?.length || 0);
    
  // Verifica se a página atual está vazia e se devemos voltar para a anterior
  useEffect(() => {
    if (paginatedRegistrations.length === 0 && currentPage > 1 && registrations.length > 0) {
      setCurrentPage(currentPage - 1);
    }
  }, [paginatedRegistrations.length, currentPage, registrations.length]);

  // Atualizar selectedRegistration quando os dados dos registros são atualizados
  useEffect(() => {
    if (selectedRegistration && registrations.length > 0) {
      console.log("🔄 Atualizando dados do registro selecionado após recarregamento");
      const updatedRegistration = registrations.find((reg: any) => reg.id === selectedRegistration.id);
      if (updatedRegistration) {
        console.log("✅ Registro atualizado encontrado, atualizando selectedRegistration");
        setSelectedRegistration(updatedRegistration);
      }
    }
  }, [registrations, selectedRegistration?.id]);

  return (
    <Card className="w-full">
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-blue-900">Histórico de Registros</h2>
          </div>
          
          <h3 className="text-lg font-medium text-blue-800">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filter-type">Tipo de Registro</Label>
              <Select
                value={filters.type}
                onValueChange={(value) => setFilters({ ...filters, type: value })}
              >
                <SelectTrigger id="filter-type">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="fuel">Abastecimento</SelectItem>
                  <SelectItem value="maintenance">Manutenção</SelectItem>
                  <SelectItem value="trip">Viagem</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-vehicle">Veículo</Label>
              <Select
                value={filters.vehicleId}
                onValueChange={(value) => setFilters({ ...filters, vehicleId: value })}
              >
                <SelectTrigger id="filter-vehicle">
                  <SelectValue placeholder="Todos os veículos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os veículos</SelectItem>
                  {Array.isArray(vehicles) && vehicles.map((vehicle: any) => (
                    <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                      {vehicle.name} - {vehicle.plate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Período</Label>
              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={`w-full justify-start text-left font-normal ${
                        !filters.startDate && "text-muted-foreground"
                      }`}
                    >
                      {filters.startDate ? (
                        format(filters.startDate, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        <span>Início</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={filters.startDate}
                      onSelect={(date) => setFilters({ ...filters, startDate: date })}
                      disabled={(date) =>
                        (filters.endDate ? date > filters.endDate : false) ||
                        date > new Date()
                      }
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={`w-full justify-start text-left font-normal ${
                        !filters.endDate && "text-muted-foreground"
                      }`}
                    >
                      {filters.endDate ? (
                        format(filters.endDate, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        <span>Fim</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={filters.endDate}
                      onSelect={(date) => setFilters({ ...filters, endDate: date })}
                      disabled={(date) =>
                        (filters.startDate ? date < filters.startDate : false) ||
                        date > new Date()
                      }
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={resetFilters}>
              Limpar
            </Button>
            <Button onClick={() => refetch()}>
              Aplicar Filtros
            </Button>
          </div>
        </div>

        {/* Items do histórico */}
        <div className="space-y-4">
          {isLoading ? (
            // Estado de carregamento
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="ml-3">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24 mt-1" />
                    </div>
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-4 w-24 mt-1" />
                  </div>
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))
          ) : !registrations || registrations.length === 0 ? (
            <div className="border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-500">Nenhum registro encontrado.</p>
            </div>
          ) : (
            <>
              {paginatedRegistrations.map((registration: any) => (
                <div 
                  key={registration.id} 
                  className={`border ${registration.offlinePending ? 'border-orange-300 border-dashed' : 'border-gray-200'} rounded-lg p-4 hover:border-blue-400 transition-colors`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <div className={`p-2 rounded-full ${
                        registration.type === 'fuel' ? 'bg-green-100 text-green-700' :
                        registration.type === 'maintenance' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {registration.type === 'fuel' && <Fuel className="h-6 w-6" />}
                        {registration.type === 'maintenance' && <Wrench className="h-6 w-6" />}
                        {registration.type === 'trip' && <Route className="h-6 w-6" />}
                      </div>
                      <div className="ml-3">
                        <h4 className="font-medium">
                          {getRegistrationTypeText(registration.type)}
                          {registration.offlinePending && (
                            <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                              Pendente
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {registration.vehicle ? `${registration.vehicle.name} - ${registration.vehicle.plate}` : "Veículo não especificado"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {registration.type === 'fuel' && formatCurrency(registration.fuelCost)}
                        {registration.type === 'maintenance' && formatCurrency(registration.maintenanceCost)}
                        {registration.type === 'trip' && `${(registration.finalKm && registration.initialKm) ? (registration.finalKm - registration.initialKm) : 0} km`}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDate(registration.date)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap justify-between items-center text-sm text-gray-500">
                    <div className="flex items-center">
                      <User className="h-3.5 w-3.5 mr-1" />
                      <span>{registration.driver ? registration.driver.name : "Motorista não especificado"}</span>
                    </div>
                    
                    {registration.type === 'fuel' && (
                      <div className="flex items-center">
                        <Fuel className="h-3.5 w-3.5 mr-1" />
                        <span>{registration.fuelStation ? registration.fuelStation.name : "Posto não especificado"}</span>
                      </div>
                    )}
                    
                    {registration.type === 'maintenance' && (
                      <div className="flex items-center">
                        <Wrench className="h-3.5 w-3.5 mr-1" />
                        <span>{registration.maintenanceType ? registration.maintenanceType.name : "Tipo não especificado"}</span>
                      </div>
                    )}
                    
                    {registration.type === 'trip' && (
                      <>
                        <div className="flex items-center">
                          <MapPin className="h-3.5 w-3.5 mr-1 text-green-600" />
                          <span>Origem: {registration.origin || "Não especificado"}</span>
                        </div>
                        <div className="flex items-center mt-1">
                          <MapPin className="h-3.5 w-3.5 mr-1 text-red-600" />
                          <span>Destino: {registration.destination || "Não especificado"}</span>
                        </div>
                        <div className="flex items-center mt-1">
                          <Route className="h-3.5 w-3.5 mr-1 text-blue-600" />
                          <span className="text-blue-600 font-medium">
                            {registration.reason || "Motivo não especificado"}
                          </span>
                        </div>
                        <div className="flex items-center mt-1">
                          <TrendingUp className="h-3.5 w-3.5 mr-1 text-green-600" />
                          <span className="text-green-600 font-medium">
                            {(registration.finalKm && registration.initialKm) ? 
                             `${registration.finalKm - registration.initialKm} km percorridos` : 
                             "Distância não especificada"}
                          </span>
                        </div>
                      </>
                    )}
                    
                    {registration.type === 'fuel' ? (
                      <div className="flex items-center mt-2 md:mt-0">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        <span>{registration.liters ? `${registration.liters} litros` : "Quantidade não especificada"}</span>
                      </div>
                    ) : (
                      <div className="flex items-center mt-2 md:mt-0">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        {registration.initialKm && (
                          <span>Hodômetro: {registration.initialKm} km</span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex space-x-1 mt-2 md:mt-0">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="h-8 w-8 p-0 rounded-full"
                        title="Ver detalhes"
                        onClick={() => openDetailView(registration)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {!registration.offlinePending && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-8 w-8 p-0 rounded-full"
                          title="Editar"
                          onClick={() => handleEditRegistration(registration.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="h-8 w-8 p-0 rounded-full text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Excluir"
                        onClick={() => openDeleteConfirmation(registration.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-4 gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {Array.from({ length: totalPages }).map((_, index) => (
                    <Button
                      key={index}
                      variant={currentPage === index + 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(index + 1)}
                      className={`w-8 ${currentPage === index + 1 ? 'bg-blue-700 text-white' : ''}`}
                    >
                      {index + 1}
                    </Button>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
      
      {/* Diálogo de detalhes do registro */}
      {selectedRegistration && (
        <Dialog open={!!selectedRegistration} onOpenChange={(open) => !open && setSelectedRegistration(null)}>
          <DialogContent className="max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <div className={`p-1 rounded-full mr-2 ${
                  selectedRegistration.type === 'fuel' ? 'bg-green-100 text-green-700' :
                  selectedRegistration.type === 'maintenance' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {selectedRegistration.type === 'fuel' && <Fuel className="h-5 w-5" />}
                  {selectedRegistration.type === 'maintenance' && <Wrench className="h-5 w-5" />}
                  {selectedRegistration.type === 'trip' && <Route className="h-5 w-5" />}
                </div>
                <span>
                  {getRegistrationTypeText(selectedRegistration.type)}
                </span>
              </DialogTitle>
              <DialogDescription>
                {formatDate(selectedRegistration.date)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <Label className="text-gray-500">Veículo</Label>
                <p className="font-medium">{selectedRegistration.vehicle ? `${selectedRegistration.vehicle.name} - ${selectedRegistration.vehicle.plate}` : "Não especificado"}</p>
              </div>
              
              <div>
                <Label className="text-gray-500">Motorista</Label>
                <p className="font-medium">{selectedRegistration.driver ? selectedRegistration.driver.name : "Não especificado"}</p>
              </div>
              
              {selectedRegistration.type === 'fuel' ? (
                <div>
                  <Label className="text-gray-500">Quilometragem atual</Label>
                  <p className="font-medium">{selectedRegistration.initialKm ? `${selectedRegistration.initialKm} km` : "Não especificado"}</p>
                </div>
              ) : (
                <div>
                  <Label className="text-gray-500">Hodômetro</Label>
                  <p className="font-medium">{selectedRegistration.initialKm ? `${selectedRegistration.initialKm} km` : "Não especificado"}</p>
                </div>
              )}
              
              {selectedRegistration.type === 'fuel' && (
                <>
                  <div>
                    <Label className="text-gray-500">Posto</Label>
                    <p className="font-medium">{selectedRegistration.fuelStation ? selectedRegistration.fuelStation.name : "Não especificado"}</p>
                  </div>
                  
                  <div>
                    <Label className="text-gray-500">Combustível</Label>
                    <p className="font-medium">{selectedRegistration.fuelType ? selectedRegistration.fuelType.name : "Não especificado"}</p>
                  </div>
                  
                  <div>
                    <Label className="text-gray-500">Quantidade</Label>
                    <p className="font-medium">{selectedRegistration.liters ? `${selectedRegistration.liters} L` : "Não especificado"}</p>
                  </div>
                  
                  <div>
                    <Label className="text-gray-500">Valor por litro</Label>
                    <p className="font-medium">
                      {selectedRegistration.liters && selectedRegistration.fuelCost ? 
                        formatCurrency(Math.round(selectedRegistration.fuelCost / selectedRegistration.liters) / 100) : 
                        "Não especificado"}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-gray-500">Valor total</Label>
                    <p className="font-medium text-green-700">{formatCurrency(selectedRegistration.fuelCost)}</p>
                  </div>
                </>
              )}
              
              {selectedRegistration.type === 'maintenance' && (
                <>
                  <div>
                    <Label className="text-gray-500">Tipo de manutenção</Label>
                    <p className="font-medium">{selectedRegistration.maintenanceType ? selectedRegistration.maintenanceType.name : "Não especificado"}</p>
                  </div>
                  
                  <div>
                    <Label className="text-gray-500">Local</Label>
                    <p className="font-medium">{selectedRegistration.maintenanceLocation || "Não especificado"}</p>
                  </div>
                  
                  <div className="col-span-2">
                    <Label className="text-gray-500">Descrição</Label>
                    <p className="font-medium">{selectedRegistration.maintenanceDescription || "Não especificado"}</p>
                  </div>
                  
                  <div>
                    <Label className="text-gray-500">Valor total</Label>
                    <p className="font-medium text-red-700">{formatCurrency(selectedRegistration.maintenanceCost)}</p>
                  </div>
                </>
              )}
              
              {selectedRegistration.type === 'trip' && (
                <>
                  <div>
                    <Label className="text-gray-500">Origem</Label>
                    <p className="font-medium">{selectedRegistration.origin || "Não especificado"}</p>
                  </div>
                  
                  <div>
                    <Label className="text-gray-500">Destino</Label>
                    <p className="font-medium">{selectedRegistration.destination || "Não especificado"}</p>
                  </div>
                  
                  <div>
                    <Label className="text-gray-500">Motivo da Viagem</Label>
                    <p className="font-medium">{selectedRegistration.reason || "Não especificado"}</p>
                  </div>
                  
                  <div>
                    <Label className="text-gray-500">Distância Percorrida</Label>
                    <p className="font-medium">
                      {(selectedRegistration.finalKm && selectedRegistration.initialKm) ? 
                      `${selectedRegistration.finalKm - selectedRegistration.initialKm} km` : 
                      "Não especificado"}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-gray-500">KM Final</Label>
                    <p className="font-medium">{selectedRegistration.finalKm ? `${selectedRegistration.finalKm} km` : "Não especificado"}</p>
                  </div>
                </>
              )}
              
              {selectedRegistration.notes && (
                <div className="col-span-2">
                  <Label className="text-gray-500">Observações</Label>
                  <p className="font-medium">{selectedRegistration.notes}</p>
                </div>
              )}
            </div>
            
            {/* Imagem do comprovante */}
            {selectedRegistration.receiptPhoto && (
              <div className="mt-3">
                <Label className="text-gray-500 mb-2 block">Comprovante</Label>
                <div className="relative border rounded-md p-2 bg-gray-50">
                  <div className="relative h-48 w-full">
                    <img
                      src={selectedRegistration.receiptPhoto}
                      alt="Comprovante"
                      className="object-contain w-full h-full"
                    />
                  </div>
                  <div className="absolute top-3 right-3 flex space-x-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 w-7 p-0 rounded-full"
                      onClick={() => openPhotoView(selectedRegistration.receiptPhoto)}
                      title="Ver em tamanho real"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 w-7 p-0 rounded-full"
                      onClick={() => handleDownloadPhoto(selectedRegistration.receiptPhoto, selectedRegistration.type)}
                      title="Baixar"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setSelectedRegistration(null)}
              >
                Fechar
              </Button>
              
              {!selectedRegistration.offlinePending && (
                <Button
                  onClick={() => {
                    setSelectedRegistration(null);
                    handleEditRegistration(selectedRegistration.id);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Diálogo de visualização de foto */}
      <Dialog open={photoViewOpen} onOpenChange={setPhotoViewOpen}>
        <DialogContent className="max-w-3xl mx-auto p-2">
          <div className="absolute right-4 top-4 flex space-x-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 rounded-full"
              onClick={() => handleDownloadPhoto(currentPhotoUrl || '', 'receipt')}
              title="Baixar"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 rounded-full"
              onClick={() => setPhotoViewOpen(false)}
              title="Fechar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-center min-h-[60vh]">
            {currentPhotoUrl && (
              <img
                src={currentPhotoUrl}
                alt="Comprovante em tamanho real"
                className="max-w-full max-h-[70vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setRegistrationToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRegistration}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}