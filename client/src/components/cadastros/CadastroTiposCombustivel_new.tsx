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
import { Loader2, Droplet, Plus, Edit, Trash, Search, X, Beaker } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FuelType, insertFuelTypeSchema } from "@shared/schema";
import { ZodIssue } from "zod";
import { brandColors } from "@/lib/colors";

export function CadastroTiposCombustivel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [currentType, setCurrentType] = useState<FuelType | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormVisible, setIsFormVisible] = useState(true);
  const [formData, setFormData] = useState({
    name: ""
  });

  const { data: types = [], isLoading } = useQuery<FuelType[], Error>({
    queryKey: ["/api/fuel-types"],
    queryFn: async () => {
      const res = await fetch("/api/fuel-types");
      if (!res.ok) {
        throw new Error("Falha ao buscar tipos de combustível da API");
      }
      return res.json();
    },
  });

  // Filter types based on search term
  const filteredTypes = types.filter(type =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mutations
  const saveFuelTypeMutation = useMutation<FuelType, Error, Partial<FuelType>>({
    mutationFn: async (fuelTypeData) => {
      let url = '/api/fuel-types';
      let method = 'POST';

      if (formMode === "edit" && currentType?.id) {
        url = `/api/fuel-types/${currentType.id}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fuelTypeData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Erro desconhecido" }));
        throw new Error(errorData.message || "Falha ao salvar tipo de combustível");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-types"] });
      toast({
        title: "Sucesso!",
        description: formMode === "create"
          ? "Tipo de combustível cadastrado com sucesso."
          : "Tipo de combustível atualizado com sucesso.",
      });
      resetForm();
      window.dispatchEvent(new CustomEvent("fuel-type-updated"));
    },
    onError: (error) => {
      toast({
        title: "Erro!",
        description: error.message || "Ocorreu um erro.",
        variant: "destructive",
      });
    },
  });

  const deleteFuelTypeMutation = useMutation<unknown, Error, number>({
    mutationFn: async (typeId) => {
      const response = await fetch(`/api/fuel-types/${typeId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Erro desconhecido" }));
        throw new Error(errorData.message || "Falha ao excluir tipo de combustível");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-types"] });
      toast({
        title: "Sucesso!",
        description: "Tipo de combustível excluído com sucesso.",
      });
      window.dispatchEvent(new CustomEvent("fuel-type-updated"));
    },
    onError: (error) => {
      toast({
        title: "Erro!",
        description: error.message || "Ocorreu um erro ao excluir o tipo de combustível.",
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
      name: ""
    });
    setFormMode("create");
    setCurrentType(null);
    setFormErrors({});
    setIsFormVisible(true);
  };

  const handleEdit = (type: FuelType) => {
    setCurrentType(type);
    setFormData({
      name: type.name
    });
    setFormMode("edit");
    setFormErrors({});
    setIsFormVisible(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (type: FuelType) => {
    deleteFuelTypeMutation.mutate(type.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const fuelTypeDataToValidate = {
      name: formData.name,
    };

    const validationResult = insertFuelTypeSchema.safeParse(fuelTypeDataToValidate);

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

    saveFuelTypeMutation.mutate(validationResult.data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: brandColors.primary[600] }} />
          <p className="text-sm text-gray-600">Carregando tipos de combustível...</p>
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
                  <Droplet className="h-8 w-8" style={{ color: brandColors.primary[600] }} />
                </div>
                Tipos de Combustível
              </h1>
              <p className="text-gray-600 mt-2">
                Cadastre e gerencie os tipos de combustível disponíveis
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setIsFormVisible(!isFormVisible)}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isFormVisible ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {isFormVisible ? "Ocultar Formulário" : "Novo Tipo"}
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
                    Novo Tipo de Combustível
                  </>
                ) : (
                  <>
                    <Edit className="h-5 w-5" style={{ color: brandColors.warning[600] }} />
                    Editar Tipo de Combustível
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {formMode === "create" 
                  ? "Preencha os dados para cadastrar um novo tipo de combustível" 
                  : `Altere os dados de ${currentType?.name}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                      <Beaker className="h-4 w-4" />
                      Nome do Combustível*
                    </Label>
                    <Input 
                      id="name"
                      name="name"
                      placeholder="Ex: Gasolina Comum, Diesel S10, Etanol"
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
                    disabled={saveFuelTypeMutation.isPending}
                    style={{ 
                      backgroundColor: formMode === "create" ? brandColors.success[600] : brandColors.warning[600],
                      borderColor: formMode === "create" ? brandColors.success[600] : brandColors.warning[600]
                    }}
                  >
                    {saveFuelTypeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {formMode === "create" ? "Cadastrar Tipo" : "Atualizar Tipo"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Types List */}
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Tipos de Combustível</CardTitle>
                <CardDescription>
                  {filteredTypes.length} de {types.length} tipo(s) {searchTerm && 'encontrado(s)'}
                </CardDescription>
              </div>
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome do combustível..."
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
            {!isLoading && types.length === 0 && (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Droplet className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum tipo de combustível cadastrado</h3>
                <p className="text-gray-600 mb-4">Comece cadastrando os tipos de combustível utilizados na sua frota.</p>
                <Button 
                  onClick={() => setIsFormVisible(true)}
                  className="flex items-center gap-2"
                  style={{ backgroundColor: brandColors.primary[600] }}
                >
                  <Plus className="h-4 w-4" />
                  Cadastrar Primeiro Tipo
                </Button>
              </div>
            )}

            {!isLoading && types.length > 0 && filteredTypes.length === 0 && searchTerm && (
              <div className="text-center py-8">
                <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum resultado encontrado</h3>
                <p className="text-gray-600 mb-4">
                  Não encontramos tipos que correspondam à sua busca por "{searchTerm}".
                </p>
                <Button variant="outline" onClick={() => setSearchTerm("")}>
                  Limpar busca
                </Button>
              </div>
            )}

            {filteredTypes.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo de Combustível</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTypes.map((type) => (
                      <TableRow key={type.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                              <Droplet className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{type.name}</div>
                              <div className="text-sm text-gray-500">ID: {type.id}</div>
                            </div>
                          </div>
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
                              onClick={() => handleEdit(type)}
                              disabled={saveFuelTypeMutation.isPending}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={deleteFuelTypeMutation.isPending}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  {deleteFuelTypeMutation.isPending && deleteFuelTypeMutation.variables === type.id ? (
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
                                    Tem certeza que deseja excluir o tipo de combustível <strong>{type.name}</strong>?
                                    Esta ação não pode ser desfeita e removerá todos os registros associados.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(type)}
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
