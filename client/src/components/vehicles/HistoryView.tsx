import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  // Filter state
  const [filters, setFilters] = useState({
    type: "all",
    vehicleId: "all",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  });

  // Detail view state
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);

  // Photo view state
  const [photoViewOpen, setPhotoViewOpen] = useState(false);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] = useState<number | null>(null);

  // Toast hook
  const { toast } = useToast();

  // Location hook for navigation
  const [, setLocation] = useLocation();

  // Query client for refetching data
  const queryClient = useQueryClient();

  // Query for fetching registrations with filters
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

      const res = await fetch(url, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch registrations");
      }

      return res.json();
    },
  });

  // Fetch vehicles for filter
  const { data: vehicles = [] } = useQuery({
    queryKey: ["/api/vehicles"],
  });

  // Reset filters handler
  const resetFilters = () => {
    setFilters({
      type: "all",
      vehicleId: "all",
      startDate: undefined,
      endDate: undefined,
    });
  };

  // Open detail view
  const openDetailView = (registration: any) => {
    setSelectedRegistration(registration);
  };

  // Open photo view
  const openPhotoView = (photoUrl: string) => {
    setCurrentPhotoUrl(photoUrl);
    setPhotoViewOpen(true);
  };

  // Edit registration
  const handleEditRegistration = (id: number) => {
    setLocation(`/registros/edit/${id}`);
  };

  // Open delete confirmation
  const openDeleteConfirmation = (id: number) => {
    setRegistrationToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Delete registration
  const handleDeleteRegistration = async () => {
    if (!registrationToDelete) return;

    try {
      const response = await fetch(`/api/registrations/${registrationToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok){
        throw new Error('Falha ao excluir o registro');
      }

      toast({
        title: "Registro excluído",
        description: "O registro foi excluído com sucesso!",
      });

      // Refresh data
      queryClient.invalidateQueries(["/api/registrations"]);

      // Close dialog
      setDeleteDialogOpen(false);
      setRegistrationToDelete(null);

    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o registro. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Download photo
  const handleDownloadPhoto = (photoUrl: string, registrationType: string) => {
    const link = document.createElement('a');
    link.href = photoUrl;
    link.download = `comprovante_${registrationType}_${new Date().getTime()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination
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

  return (
    <Card className="w-full">
      <CardContent className="space-y-6 pt-6">
        {/* Conteúdo principal sem o título duplicado */}
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

        {/* History Items */}
        <div className="space-y-4">
          {isLoading ? (
            // Skeleton loading state
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
            paginatedRegistrations.map((registration: any) => (
              <div 
                key={registration.id} 
                className={`border border-gray-200 rounded-lg p-4 ${
                  registration.type === "fuel" 
                    ? "bg-amber-50" 
                    : registration.type === "maintenance"
                    ? "bg-green-50"
                    : "bg-blue-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className={`rounded-full ${getRegistrationTypeColor(registration.type).bg} p-2 text-white mr-3`}>
                      {registration.type === "fuel" ? (
                        <Fuel className="h-5 w-5" />
                      ) : registration.type === "maintenance" ? (
                        <Wrench className="h-5 w-5" />
                      ) : (
                        <MapPin className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {getRegistrationTypeText(registration.type)}
                      </h4>
                      <p className="text-gray-600 text-sm">
                        {registration.vehicle?.name} - {registration.vehicle?.plate}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {registration.type === "fuel" && (
                      <>
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(registration.fuelCost)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {registration.liters}L - {registration.fuelType?.name}
                        </p>
                      </>
                    )}
                    {registration.type === "maintenance" && (
                      <>
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(registration.maintenanceCost)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {registration.maintenanceType?.name}
                        </p>
                      </>
                    )}
                    {registration.type === "trip" && (
                      <>
                        <p className="text-sm font-medium text-gray-900">
                          {registration.destination}
                        </p>
                        <p className="text-sm text-gray-600">
                          {registration.reason}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex justify-between items-center text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(registration.date)}
                  </div>
                  <div className="flex items-center">
                    <Route className="h-4 w-4 mr-1" />
                    {registration.type === "trip" 
                      ? `${registration.initialKm} km - ${registration.finalKm} km`
                      : `${registration.initialKm} km`}
                  </div>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {registration.driver?.name}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1">
                    {/* Detail button */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-blue-700"
                          onClick={() => openDetailView(registration)}
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            {registration.type === "fuel" ? (
                              <Fuel className="h-5 w-5 text-amber-500" />
                            ) : registration.type === "maintenance" ? (
                              <Wrench className="h-5 w-5 text-green-600" />
                            ) : (
                              <MapPin className="h-5 w-5 text-blue-600" />
                            )}
                            {getRegistrationTypeText(registration.type)}
                          </DialogTitle>
                          <DialogDescription>
                            {formatDate(registration.date)}
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 mt-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Veículo</h4>
                              <p>{registration.vehicle?.name} - {registration.vehicle?.plate}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Motorista</h4>
                              <p>{registration.driver?.name}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">KM Inicial</h4>
                              <p>{registration.initialKm} km</p>
                            </div>
                            {registration.finalKm && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">KM Final</h4>
                                <p>{registration.finalKm} km</p>
                              </div>
                            )}
                          </div>

                          {registration.type === "fuel" && (
                            <>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-500">Posto</h4>
                                  <p>{registration.fuelStation?.name}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-gray-500">Combustível</h4>
                                  <p>{registration.fuelType?.name}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-500">Litros</h4>
                                  <p>{registration.liters} L</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-gray-500">Valor</h4>
                                  <p>{formatCurrency(registration.fuelCost)}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-500">Tanque Completo</h4>
                                  <p>{registration.fullTank ? "Sim" : "Não"}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-gray-500">ARLA</h4>
                                  <p>{registration.arla ? "Sim" : "Não"}</p>
                                </div>
                              </div>
                            </>
                          )}

                          {registration.type === "maintenance" && (
                            <>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-500">Tipo</h4>
                                  <p>{registration.maintenanceType?.name}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-gray-500">Valor</h4>
                                  <p>{formatCurrency(registration.maintenanceCost)}</p>
                                </div>
                              </div>
                            </>
                          )}

                          {registration.type === "trip" && (
                            <>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-500">Destino</h4>
                                  <p>{registration.destination}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-gray-500">Motivo</h4>
                                  <p>{registration.reason}</p>
                                </div>
                              </div>
                            </>
                          )}

                          {registration.observations && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Observações</h4>
                              <p className="text-sm text-gray-700">{registration.observations}</p>
                            </div>
                          )}

                          {registration.photoUrl && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-2">Comprovante</h4>
                              <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group">
                                <img 
                                  src={registration.photoUrl} 
                                  alt="Comprovante" 
                                  className="absolute inset-0 w-full h-full object-contain cursor-pointer"
                                  onClick={() => {
                                    if (registration.photoUrl) {
                                      openPhotoView(registration.photoUrl);
                                    }
                                  }}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    if (registration.photoUrl && !registration.photoUrl.startsWith('/')) {
                                      target.src = '/' + registration.photoUrl;
                                      return;
                                    }
                                    target.src = ""; // Limpa a src
                                    const parentElement = target.parentElement;
                                    if (parentElement) {
                                      parentElement.innerHTML = '<div class="absolute inset-0 flex items-center justify-center text-gray-400">Imagem não disponível ou corrompida</div>';
                                    }
                                  }}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                  <div className="flex gap-2">
                                    <Button 
                                      size="icon" 
                                      variant="secondary"
                                      className="h-9 w-9"
                                      onClick={() => openPhotoView(registration.photoUrl)}
                                      title="Ampliar"
                                    >
                                      <Maximize2 className="h-5 w-5" />
                                    </Button>
                                    <Button 
                                      size="icon" 
                                      variant="secondary"
                                      className="h-9 w-9"
                                      onClick={() => handleDownloadPhoto(registration.photoUrl, registration.type)}
                                      title="Baixar"
                                    >
                                      <Download className="h-5 w-5" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <DialogFooter className="mt-4 flex justify-between">
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              onClick={() => handleEditRegistration(registration.id)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                            <Button 
                              variant="destructive" 
                              onClick={() => openDeleteConfirmation(registration.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </Button>
                          </div>
                          <DialogClose asChild>
                            <Button variant="secondary">Fechar</Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* Edit button */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-amber-600"
                      onClick={() => handleEditRegistration(registration.id)}
                      title="Editar registro"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    {/* Delete button */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-600"
                      onClick={() => openDeleteConfirmation(registration.id)}
                      title="Excluir registro"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <span className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>

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
        </div>
      </CardContent>

      {/* Visualizador de imagem em tela cheia */}
      <Dialog open={photoViewOpen} onOpenChange={setPhotoViewOpen}>
        <DialogContent className="max-w-5xl h-[90vh] p-0 overflow-hidden">
          <div className="relative w-full h-full flex items-center justify-center bg-black bg-opacity-90">
            {currentPhotoUrl && (
              <img 
                src={currentPhotoUrl} 
                alt="Visualização do comprovante" 
                className="max-w-full max-h-full object-contain"
              />
            )}
            <Button 
              variant="ghost" 
              size="icon"
              className="absolute top-2 right-2 text-white hover:bg-white hover:bg-opacity-20"
              onClick={() => setPhotoViewOpen(false)}
              title="Fechar"
            >
              <X className="h-6 w-6" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="absolute bottom-4 right-4 text-white hover:bg-white hover:bg-opacity-20"
              onClick={() => currentPhotoUrl && handleDownloadPhoto(currentPhotoUrl, "registro")}
              title="Baixar imagem"
            >
              <Download className="h-6 w-6" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex-col sm:flex-row sm:justify-between gap-2">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteRegistration}
            >
              Confirmar exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default HistoryView;
