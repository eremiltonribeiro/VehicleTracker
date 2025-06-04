import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, UserCircle, Plus, Edit, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Driver, insertDriverSchema } from "@shared/schema"; // Import Zod schema
import { ZodIssue } from "zod"; // Import ZodIssue for error formatting
// import { offlineStorage } from "@/services/offlineStorage"; // Kept if offline is still relevant

export function CadastroMotoristas() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [currentDriver, setCurrentDriver] = useState<Driver | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({}); // State for Zod errors
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
        const errorData = await response.json().catch(() => ({ message: "Erro desconhecido" }));
        throw new Error(errorData.message || `Falha ao ${formMode === "create" ? "criar" : "atualizar"} motorista`);
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
          <CardTitle>Motoristas Cadastrados</CardTitle>
          <CardDescription>
            {drivers.length} motorista(s) registrado(s) no sistema.
          </CardDescription>
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
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {driver.imageUrl ? (
                            <img src={driver.imageUrl} alt={driver.name} className="h-8 w-8 mr-2 rounded-full object-cover" />
                          ) : (
                            <UserCircle className="h-6 w-6 mr-2 text-muted-foreground" />
                          )}
                          {driver.name}
                        </div>
                      </TableCell>
                      <TableCell>{driver.license || "-"}</TableCell>
                      <TableCell>{driver.phone || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(driver)}
                            disabled={deleteDriverMutation.isPending}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(driver.id)}
                            disabled={deleteDriverMutation.isPending && deleteDriverMutation.variables === driver.id}
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