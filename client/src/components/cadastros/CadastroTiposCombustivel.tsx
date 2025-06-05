import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Droplet, Plus, Edit, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FuelType, insertFuelTypeSchema } from "@shared/schema"; // Import Zod schema
import { ZodIssue } from "zod"; // Import ZodIssue for error formatting
// import { offlineStorage } from "@/services/offlineStorage"; // Kept if offline is still relevant

export function CadastroTiposCombustivel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [currentType, setCurrentType] = useState<FuelType | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({}); // State for Zod errors
  const [formData, setFormData] = useState({
    name: ""
  });

  const { data: types = [], isLoading } = useQuery<FuelType[], Error>({
    queryKey: ["/api/fuel-types"],
    queryFn: async () => {
      // Simplified online-only queryFn
      const res = await fetch("/api/fuel-types");
      if (!res.ok) {
        throw new Error("Falha ao buscar tipos de combustível da API");
      }
      return res.json();
    },
  });

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
        const entityName = "tipo de combustível"; // For message customization
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
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-types"] });
      toast({
        title: "Sucesso!",
        description: formMode === "create"
          ? "Tipo de combustível cadastrado com sucesso."
          : "Tipo de combustível atualizado com sucesso.",
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
  };

  const handleEdit = (type: FuelType) => {
    setCurrentType(type);
    setFormData({
      name: type.name
    });
    setFormMode("edit");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este tipo de combustível?")) return;
    deleteFuelTypeMutation.mutate(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({}); // Clear previous errors
    
    const validationResult = insertFuelTypeSchema.safeParse(formData);

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

  if (isLoading) { // This isLoading is from useQuery
    return <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {formMode === "create" ? <Plus className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
            {formMode === "create" ? "Novo Tipo de Combustível" : "Editar Tipo de Combustível"}
          </CardTitle>
          <CardDescription>
            {formMode === "create" 
              ? "Cadastre um novo tipo de combustível" 
              : "Altere os dados do tipo de combustível selecionado"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Combustível*</Label>
              <Input 
                id="name"
                name="name"
                placeholder="Ex: Gasolina Comum"
                value={formData.name}
                onChange={handleInputChange}
              />
              {formErrors.name && <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>}
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
                disabled={saveFuelTypeMutation.isPending}
              >
                {saveFuelTypeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {formMode === "create" ? "Cadastrar Tipo" : "Atualizar Tipo"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Combustível Cadastrados</CardTitle>
          <CardDescription>
            {types.length} tipo(s) de combustível registrado(s) no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && types.length === 0 && (
            <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin" /></div>
          )}
          {!isLoading && types.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Droplet className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Nenhum tipo de combustível cadastrado.</p>
              <p className="text-sm mt-1">Use o formulário acima para adicionar um novo tipo.</p>
            </div>
          )}
          {types.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {types.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Droplet className="h-4 w-4 mr-2 text-muted-foreground" />
                          {type.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(type)}
                            disabled={deleteFuelTypeMutation.isPending}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(type.id)}
                            disabled={deleteFuelTypeMutation.isPending && deleteFuelTypeMutation.variables === type.id}
                          >
                            {deleteFuelTypeMutation.isPending && deleteFuelTypeMutation.variables === type.id
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