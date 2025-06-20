import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Fuel, Plus, Edit, Trash, Search, X, MapPin, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FuelStation, insertFuelStationSchema } from "@shared/schema";
import { ZodIssue } from "zod";
import { brandColors } from "@/lib/colors";

export function CadastroPostos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [currentStation, setCurrentStation] = useState<FuelStation | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormVisible, setIsFormVisible] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    address: ""
  });

  const { data: stations = [], isLoading } = useQuery<FuelStation[], Error>({
    queryKey: ["/api/fuel-stations"],
    queryFn: async () => {
      const res = await fetch("/api/fuel-stations");
      if (!res.ok) {
        throw new Error("Falha ao buscar postos da API");
      }
      return res.json();
    },
  });

  // Filter stations based on search term
  const filteredStations = stations.filter(station =>
    station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (station.address && station.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Mutations
  const saveFuelStationMutation = useMutation<FuelStation, Error, Partial<FuelStation>>({
    mutationFn: async (stationData) => {
      let url = '/api/fuel-stations';
      let method = 'POST';

      if (formMode === "edit" && currentStation?.id) {
        url = `/api/fuel-stations/${currentStation.id}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stationData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Erro desconhecido" }));
        throw new Error(errorData.message || "Falha ao salvar posto");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-stations"] });
      toast({
        title: "Sucesso!",
        description: formMode === "create"
          ? "Posto cadastrado com sucesso."
          : "Posto atualizado com sucesso.",
      });
      resetForm();
      window.dispatchEvent(new CustomEvent("fuel-station-updated"));
    },
    onError: (error) => {
      toast({
        title: "Erro!",
        description: error.message || "Ocorreu um erro.",
        variant: "destructive",
      });
    },
  });

  const deleteFuelStationMutation = useMutation<unknown, Error, number>({
    mutationFn: async (stationId) => {
      const response = await fetch(`/api/fuel-stations/${stationId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Erro desconhecido" }));
        throw new Error(errorData.message || "Falha ao excluir posto");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-stations"] });
      toast({
        title: "Sucesso!",
        description: "Posto excluído com sucesso.",
      });
      window.dispatchEvent(new CustomEvent("fuel-station-updated"));
    },
    onError: (error) => {
      toast({
        title: "Erro!",
        description: error.message || "Ocorreu um erro ao excluir o posto.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: ""
    });
    setFormMode("create");
    setCurrentStation(null);
    setFormErrors({});
    setIsFormVisible(true);
  };

  const handleEdit = (station: FuelStation) => {
    setCurrentStation(station);
    setFormData({
      name: station.name,
      address: station.address || ""
    });
    setFormMode("edit");
    setFormErrors({});
    setIsFormVisible(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (station: FuelStation) => {
    deleteFuelStationMutation.mutate(station.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const stationDataToValidate = {
      name: formData.name,
      address: formData.address || undefined,
    };

    const validationResult = insertFuelStationSchema.safeParse(stationDataToValidate);

    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue: ZodIssue) => {
        if (issue.path[0]) {
          errors[issue.path[0] as string] = issue.message;
        }
      });
      setFormErrors(errors);
      toast({
        title: "Erro de Validação",
        description: "Por favor, corrija os erros no formulário.",
        variant: "destructive",
      });
      return;
    }

    saveFuelStationMutation.mutate(validationResult.data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: brandColors.primary[600] }} />
          <p className="text-sm text-gray-600">Carregando postos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: brandColors.primary[100] }}>
                  <Fuel className="h-8 w-8" style={{ color: brandColors.primary[600] }} />
                </div>
                Gestão de Postos
              </h1>
              <p className="text-gray-600 mt-2">
                Cadastre e gerencie os postos de combustível
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setIsFormVisible(!isFormVisible)}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isFormVisible ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {isFormVisible ? "Ocultar Formulário" : "Novo Posto"}
              </Button>
            </div>
          </div>
        </div>

        {/* Form Section */}
        {isFormVisible && (
          <Card className="mb-8 shadow-lg border-0" style={{ borderTop: `4px solid ${brandColors.primary[500]}` }}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                {formMode === "create" ? (
                  <>
                    <Plus className="h-5 w-5" style={{ color: brandColors.success[600] }} />
                    Novo Posto
                  </>
                ) : (
                  <>
                    <Edit className="h-5 w-5" style={{ color: brandColors.warning[600] }} />
                    Editar Posto
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {formMode === "create" 
                  ? "Preencha os dados para cadastrar um novo posto" 
                  : `Altere os dados de ${currentStation?.name}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Nome do Posto*
                    </Label>
                    <Input 
                      id="name"
                      name="name"
                      placeholder="Ex: Shell Centro"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`transition-all duration-200 ${
                        formErrors.name 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                          : 'focus:border-blue-500 focus:ring-blue-500/20'
                      }`}
                    />
                    {formErrors.name && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <X className="h-3 w-3" />
                        {formErrors.name}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Endereço
                    </Label>
                    <Input 
                      id="address"
                      name="address"
                      placeholder="Ex: Rua das Flores, 123"
                      value={formData.address}
                      onChange={handleInputChange}
                      className={`transition-all duration-200 ${
                        formErrors.address
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                          : 'focus:border-blue-500 focus:ring-blue-500/20'
                      }`}
                    />
                    {formErrors.address && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <X className="h-3 w-3" />
                        {formErrors.address}
                      </p>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-end gap-3 pt-2">
                  {formMode === "edit" && (
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={resetForm}
                      className="px-6"
                    >
                      Cancelar
                    </Button>
                  )}
                  
                  <Button 
                    type="submit"
                    className="flex items-center gap-2 px-6"
                    disabled={saveFuelStationMutation.isPending}
                    style={{ 
                      backgroundColor: formMode === "create" ? brandColors.success[600] : brandColors.warning[600],
                      borderColor: formMode === "create" ? brandColors.success[600] : brandColors.warning[600]
                    }}
                  >
                    {saveFuelStationMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {formMode === "create" ? "Cadastrar Posto" : "Atualizar Posto"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Stations List */}
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Postos Cadastrados</CardTitle>
                <CardDescription>
                  {filteredStations.length} de {stations.length} posto(s) {searchTerm && 'encontrado(s)'}
                </CardDescription>
              </div>
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome ou endereço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-80"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!isLoading && stations.length === 0 && (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Fuel className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum posto cadastrado</h3>
                <p className="text-gray-600 mb-4">Comece cadastrando o primeiro posto de combustível.</p>
                <Button 
                  onClick={() => setIsFormVisible(true)}
                  className="flex items-center gap-2"
                  style={{ backgroundColor: brandColors.primary[600] }}
                >
                  <Plus className="h-4 w-4" />
                  Cadastrar Primeiro Posto
                </Button>
              </div>
            )}

            {!isLoading && stations.length > 0 && filteredStations.length === 0 && searchTerm && (
              <div className="text-center py-8">
                <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum resultado encontrado</h3>
                <p className="text-gray-600 mb-4">
                  Não encontramos postos que correspondam à sua busca por "{searchTerm}".
                </p>
                <Button variant="outline" onClick={() => setSearchTerm("")}>
                  Limpar busca
                </Button>
              </div>
            )}

            {filteredStations.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Posto</TableHead>
                      <TableHead>Endereço</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStations.map((station) => (
                      <TableRow key={station.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                              <Fuel className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{station.name}</div>
                              <div className="text-sm text-gray-500">ID: {station.id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {station.address ? (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-700">{station.address}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">Não informado</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className="text-green-700 border-green-200 bg-green-50"
                          >
                            Ativo
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(station)}
                              disabled={saveFuelStationMutation.isPending}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={deleteFuelStationMutation.isPending}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  {deleteFuelStationMutation.isPending && deleteFuelStationMutation.variables === station.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash className="h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir o posto <strong>{station.name}</strong>?
                                    Esta ação não pode ser desfeita e removerá todos os registros associados.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(station)}
                                    className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                                  >
                                    Confirmar Exclusão
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
