import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserCircle, Plus, Edit, Trash, Eye, Search, Phone, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Driver, insertDriverSchema } from "@shared/schema";
import { ZodIssue } from "zod";
// import { offlineStorage } from "@/services/offlineStorage"; // Kept if offline is still relevant

export function CadastroMotoristas() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [currentDriver, setCurrentDriver] = useState<Driver | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({}); 
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    license: "",
    phone: "",
    imageUrl: ""
  });

  const { data: drivers = [], isLoading } = useQuery<Driver[], Error>({
    queryKey: ["/api/drivers"],
    queryFn: async () => {
      // Simplified online-only queryFn for this refactor
      const res = await fetch("/api/drivers");
      if (!res.ok) {
        throw new Error("Falha ao buscar motoristas da API");
      }
      return res.json();
    },
  });

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este motorista?")) return;
    deleteDriverMutation.mutate(id);
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

  if (isLoading) { // This isLoading is from useQuery for fetching drivers
    return <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {formMode === "create" ? <Plus className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
            {formMode === "create" ? "Novo Motorista" : "Editar Motorista"}
          </CardTitle>
          <CardDescription>
            {formMode === "create" 
              ? "Cadastre um novo motorista no sistema" 
              : "Altere os dados do motorista selecionado"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Motorista*</Label>
                <Input 
                  id="name"
                  name="name"
                  placeholder="Ex: João Silva"
                  value={formData.name}
                  onChange={handleInputChange}
                />
                {formErrors.name && <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="license">CNH</Label>
                <Input 
                  id="license"
                  name="license"
                  placeholder="Ex: 12345678901"
                  value={formData.license}
                  onChange={handleInputChange}
                />
                {formErrors.license && <p className="text-sm text-red-500 mt-1">{formErrors.license}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input 
                  id="phone"
                  name="phone"
                  placeholder="Ex: (11) 99999-9999"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
                {formErrors.phone && <p className="text-sm text-red-500 mt-1">{formErrors.phone}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="imageUrl">URL da Imagem</Label>
                <Input 
                  id="imageUrl"
                  name="imageUrl"
                  placeholder="URL da foto do motorista"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                />
                 {/* Assuming imageUrl is not in the Zod schema for this example, so no formErrors.imageUrl */}
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              {formMode === "edit" && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancelar
                </Button>
              )}
              
              <Button 
                type="submit"
                className="flex items-center gap-1"
                disabled={saveDriverMutation.isPending}
              >
                {saveDriverMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {formMode === "create" ? "Cadastrar Motorista" : "Atualizar Motorista"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <CardTitle>Motoristas Cadastrados</CardTitle>
              <CardDescription>
                {drivers.length} motorista(s) registrado(s) no sistema.
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar motoristas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[200px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && drivers.length === 0 && (
            <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin" /></div>
          )}
          {!isLoading && drivers.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <UserCircle className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Nenhum motorista cadastrado.</p>
              <p className="text-sm mt-1">Use o formulário acima para adicionar um novo motorista.</p>
            </div>
          )}
          {drivers.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CNH</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers
                    .filter(driver => 
                      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      driver.license.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      driver.phone.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((driver) => (
                    <TableRow key={driver.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center cursor-pointer">
                          {driver.imageUrl ? (
                            <img src={driver.imageUrl} alt={driver.name} className="h-10 w-10 mr-3 rounded-full object-cover border" />
                          ) : (
                            <div className="h-10 w-10 mr-3 rounded-full border bg-muted flex items-center justify-center">
                              <UserCircle className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{driver.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {driver.phone}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                          <Badge variant="outline" className="font-mono">
                            {driver.license}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          {driver.phone}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">Ativo</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Link href={`/drivers/${driver.id}`}>
                            <Button variant="ghost" size="sm" title="Ver detalhes">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(driver)}
                            disabled={deleteDriverMutation.isPending}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(driver.id)}
                            disabled={deleteDriverMutation.isPending && deleteDriverMutation.variables === driver.id}
                            title="Excluir"
                          >
                            {deleteDriverMutation.isPending && deleteDriverMutation.variables === driver.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Trash className="h-4 w-4" />
                            }
                          </Button>
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
  );
}