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
import { Loader2, UserCircle, Plus, Edit, Trash, Search, X, Phone, CreditCard, User, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Driver, insertDriverSchema } from "@shared/schema";
import { ZodIssue } from "zod";
import { brandColors } from "@/lib/colors";

export function CadastroMotoristas() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [currentDriver, setCurrentDriver] = useState<Driver | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormVisible, setIsFormVisible] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    license: "",
    phone: "",
    imageUrl: ""
  });

  const { data: drivers = [], isLoading } = useQuery<Driver[], Error>({
    queryKey: ["/api/drivers"],
    queryFn: async () => {
      const res = await fetch("/api/drivers");
      if (!res.ok) {
        throw new Error("Falha ao buscar motoristas da API");
      }
      return res.json();
    },
  });

  // Filter drivers based on search term
  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (driver.license && driver.license.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (driver.phone && driver.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Mutations
  const saveDriverMutation = useMutation<Driver, Error, Partial<Driver>>({
    mutationFn: async (driverData) => {
      let url = '/api/drivers';
      let method = 'POST';

      if (formMode === "edit" && currentDriver?.id) {
        url = `/api/drivers/${currentDriver.id}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(driverData),
      });

      if (!response.ok) {
        const entityName = "motorista"; // For message customization
        let detailedErrorMessage = `Falha ao ${formMode === "create" ? "criar" : "atualizar"} ${entityName}. Status: ${response.status} ${response.statusText}`;
        let responseBodyForErrorLog = "";

        try {
          const errorData = await response.json();
          detailedErrorMessage = errorData.message || JSON.stringify(errorData);
        } catch (e) {
          try {
            // response.text() consumes the body, so call it only if .json() failed or on a cloned response if needed for multiple reads
            responseBodyForErrorLog = await response.text();
            detailedErrorMessage += `. Resposta do servidor (não JSON): ${responseBodyForErrorLog.substring(0, 500)}`;
          } catch (textE) {
            detailedErrorMessage += ". Não foi possível ler o corpo da resposta do servidor.";
          }
        }

        console.error(`Backend error details for ${url}:`, detailedErrorMessage, "Raw Response Body (if available):", responseBodyForErrorLog);

        let toastErrorMessage = `Falha ao ${formMode === "create" ? "criar" : "atualizar"} ${entityName}.`;
        if (typeof detailedErrorMessage === 'string' && detailedErrorMessage.length < 100 && !detailedErrorMessage.startsWith("{") && !detailedErrorMessage.toLowerCase().includes("html")) {
            toastErrorMessage = detailedErrorMessage;
        } else {
            toastErrorMessage = `Erro ${response.status} ao salvar ${entityName}. Verifique o console para detalhes técnicos.`;
        }
        throw new Error(toastErrorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      toast({
        title: "Sucesso!",
        description: formMode === "create"
          ? "Motorista cadastrado com sucesso."
          : "Motorista atualizado com sucesso.",
      });
      resetForm();
      
      // Disparar evento para atualizar outras telas que dependem dos dados de motoristas
      window.dispatchEvent(new CustomEvent("driver-updated"));
    },
    onError: (error) => {
      toast({
        title: "Erro!",
        description: error.message || "Ocorreu um erro.",
        variant: "destructive",
      });
    },
  });

  const deleteDriverMutation = useMutation<unknown, Error, number>({
    mutationFn: async (driverId) => {
      const response = await fetch(`/api/drivers/${driverId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Erro desconhecido" }));
        throw new Error(errorData.message || "Falha ao excluir motorista");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      toast({
        title: "Sucesso!",
        description: "Motorista excluído com sucesso.",
      });
      
      // Disparar evento para atualizar outras telas que dependem dos dados de motoristas
      window.dispatchEvent(new CustomEvent("driver-updated"));
    },
    onError: (error) => {
      toast({
        title: "Erro!",
        description: error.message || "Ocorreu um erro ao excluir o motorista.",
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
      license: "",
      phone: "",
      imageUrl: ""
    });
    setFormMode("create");
    setCurrentDriver(null);
    setFormErrors({});
    setIsFormVisible(true);
  };

  const handleEdit = (driver: Driver) => {
    setCurrentDriver(driver);
    setFormData({
      name: driver.name,
      license: driver.license || "",
      phone: driver.phone || "",
      imageUrl: driver.imageUrl || ""
    });
    setFormMode("edit");
    setFormErrors({});
    setIsFormVisible(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (driver: Driver) => {
    deleteDriverMutation.mutate(driver.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({}); // Clear previous errors

    const driverDataToValidate = {
      name: formData.name,
      license: formData.license || undefined, // Handle optional fields for Zod
      phone: formData.phone || undefined,   // Handle optional fields for Zod
    };

    const validationResult = insertDriverSchema.safeParse(driverDataToValidate);

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

    // Include imageUrl in the data sent to mutation if it's handled by backend but not in Zod schema
    const finalDriverData = {
        ...validationResult.data,
        imageUrl: formData.imageUrl || undefined
    };

    saveDriverMutation.mutate(finalDriverData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: brandColors.primary[600] }} />
          <p className="text-sm text-gray-600">Carregando motoristas...</p>
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
                  <UserCircle className="h-8 w-8" style={{ color: brandColors.primary[600] }} />
                </div>
                Gestão de Motoristas
              </h1>
              <p className="text-gray-600 mt-2">
                Cadastre e gerencie os motoristas da sua frota
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setIsFormVisible(!isFormVisible)}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isFormVisible ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {isFormVisible ? "Ocultar Formulário" : "Novo Motorista"}
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
                    Novo Motorista
                  </>
                ) : (
                  <>
                    <Edit className="h-5 w-5" style={{ color: brandColors.warning[600] }} />
                    Editar Motorista
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {formMode === "create" 
                  ? "Preencha os dados para cadastrar um novo motorista" 
                  : `Altere os dados de ${currentDriver?.name}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Nome do Motorista*
                    </Label>
                    <Input 
                      id="name"
                      name="name"
                      placeholder="Ex: João Silva"
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
                    <Label htmlFor="license" className="text-sm font-medium flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      CNH
                    </Label>
                    <Input 
                      id="license"
                      name="license"
                      placeholder="Ex: 12345678901"
                      value={formData.license}
                      onChange={handleInputChange}
                      className={`transition-all duration-200 ${
                        formErrors.license
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                          : 'focus:border-blue-500 focus:ring-blue-500/20'
                      }`}
                    />
                    {formErrors.license && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <X className="h-3 w-3" />
                        {formErrors.license}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Telefone
                    </Label>
                    <Input 
                      id="phone"
                      name="phone"
                      placeholder="Ex: (11) 99999-9999"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`transition-all duration-200 ${
                        formErrors.phone
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                          : 'focus:border-blue-500 focus:ring-blue-500/20'
                      }`}
                    />
                    {formErrors.phone && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <X className="h-3 w-3" />
                        {formErrors.phone}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="imageUrl" className="text-sm font-medium">
                      URL da Imagem
                    </Label>
                    <Input 
                      id="imageUrl"
                      name="imageUrl"
                      placeholder="URL da foto do motorista"
                      value={formData.imageUrl}
                      onChange={handleInputChange}
                      className="focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                    />
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
                    disabled={saveDriverMutation.isPending}
                    style={{ 
                      backgroundColor: formMode === "create" ? brandColors.success[600] : brandColors.warning[600],
                      borderColor: formMode === "create" ? brandColors.success[600] : brandColors.warning[600]
                    }}
                  >
                    {saveDriverMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {formMode === "create" ? "Cadastrar Motorista" : "Atualizar Motorista"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Drivers List */}
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Motoristas Cadastrados</CardTitle>
                <CardDescription>
                  {filteredDrivers.length} de {drivers.length} motorista(s) {searchTerm && 'encontrado(s)'}
                </CardDescription>
              </div>
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, CNH ou telefone..."
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
            {!isLoading && drivers.length === 0 && (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <UserCircle className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum motorista cadastrado</h3>
                <p className="text-gray-600 mb-4">Comece cadastrando o primeiro motorista da sua frota.</p>
                <Button 
                  onClick={() => setIsFormVisible(true)}
                  className="flex items-center gap-2"
                  style={{ backgroundColor: brandColors.primary[600] }}
                >
                  <Plus className="h-4 w-4" />
                  Cadastrar Primeiro Motorista
                </Button>
              </div>
            )}

            {!isLoading && drivers.length > 0 && filteredDrivers.length === 0 && searchTerm && (
              <div className="text-center py-8">
                <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum resultado encontrado</h3>
                <p className="text-gray-600 mb-4">
                  Não encontramos motoristas que correspondam à sua busca por "{searchTerm}".
                </p>
                <Button variant="outline" onClick={() => setSearchTerm("")}>
                  Limpar busca
                </Button>
              </div>
            )}

            {filteredDrivers.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Motorista</TableHead>
                      <TableHead>CNH</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDrivers.map((driver) => (
                      <TableRow key={driver.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {driver.imageUrl ? (
                              <img 
                                src={driver.imageUrl} 
                                alt={driver.name} 
                                className="h-10 w-10 rounded-full object-cover border-2 border-gray-200" 
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <UserCircle className="h-6 w-6 text-gray-500" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{driver.name}</div>
                              <div className="text-sm text-gray-500">ID: {driver.id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {driver.license ? (
                            <Badge variant="outline" className="font-mono">
                              {driver.license}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">Não informado</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {driver.phone ? (
                            <span className="font-medium">{driver.phone}</span>
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
                              onClick={() => handleEdit(driver)}
                              disabled={saveDriverMutation.isPending}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={deleteDriverMutation.isPending}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  {deleteDriverMutation.isPending && deleteDriverMutation.variables === driver.id ? (
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
                                    Tem certeza que deseja excluir o motorista <strong>{driver.name}</strong>?
                                    Esta ação não pode ser desfeita e removerá todos os registros associados.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(driver)}
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