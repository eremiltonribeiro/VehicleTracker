import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Wrench, Plus, Edit, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MaintenanceType, insertMaintenanceTypeSchema } from "@shared/schema"; // Import Zod schema
import { ZodIssue } from "zod"; // Import ZodIssue for error formatting
// import { offlineStorage } from "@/services/offlineStorage"; // Kept if offline is still relevant

export function CadastroTiposManutencao() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [currentType, setCurrentType] = useState<MaintenanceType | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({}); // State for Zod errors
  const [formData, setFormData] = useState({
    name: ""
  });

  const { data: types = [], isLoading } = useQuery<MaintenanceType[], Error>({
    queryKey: ["/api/maintenance-types"],
    queryFn: async () => {
      // Simplified online-only queryFn
      const res = await fetch("/api/maintenance-types");
      if (!res.ok) {
        throw new Error("Falha ao buscar tipos de manutenção da API");
      }
      return res.json();
    },
  });

  // Mutations
  const saveMaintenanceTypeMutation = useMutation<MaintenanceType, Error, Partial<MaintenanceType>>({
    mutationFn: async (maintenanceTypeData) => {
      let url = '/api/maintenance-types';
      let method = 'POST';

      if (formMode === "edit" && currentType?.id) {
        url = `/api/maintenance-types/${currentType.id}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maintenanceTypeData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Erro desconhecido" }));
        throw new Error(errorData.message || `Falha ao ${formMode === "create" ? "criar" : "atualizar"} tipo de manutenção`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance-types"] });
      toast({
        title: "Sucesso!",
        description: formMode === "create"
          ? "Tipo de manutenção cadastrado com sucesso."
          : "Tipo de manutenção atualizado com sucesso.",
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

  const deleteMaintenanceTypeMutation = useMutation<unknown, Error, number>({
    mutationFn: async (typeId) => {
      const response = await fetch(`/api/maintenance-types/${typeId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Erro desconhecido" }));
        throw new Error(errorData.message || "Falha ao excluir tipo de manutenção");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance-types"] });
      toast({
        title: "Sucesso!",
        description: "Tipo de manutenção excluído com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro!",
        description: error.message || "Ocorreu um erro ao excluir o tipo de manutenção.",
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

  const handleEdit = (type: MaintenanceType) => {
    setCurrentType(type);
    setFormData({
      name: type.name
    });
    setFormMode("edit");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este tipo de manutenção?")) return;
    deleteMaintenanceTypeMutation.mutate(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({}); // Clear previous errors
    
    const validationResult = insertMaintenanceTypeSchema.safeParse(formData);

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

    saveMaintenanceTypeMutation.mutate(validationResult.data);
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
            {formMode === "create" ? "Novo Tipo de Manutenção" : "Editar Tipo de Manutenção"}
          </CardTitle>
          <CardDescription>
            {formMode === "create" 
              ? "Cadastre um novo tipo de manutenção" 
              : "Altere os dados do tipo de manutenção selecionado"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Tipo de Manutenção*</Label>
              <Input 
                id="name"
                name="name"
                placeholder="Ex: Troca de Óleo"
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
                disabled={saveMaintenanceTypeMutation.isPending}
              >
                {saveMaintenanceTypeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {formMode === "create" ? "Cadastrar Tipo" : "Atualizar Tipo"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Manutenção Cadastrados</CardTitle>
          <CardDescription>
            {types.length} tipo(s) de manutenção registrado(s) no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
           {isLoading && types.length === 0 && (
            <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin" /></div>
          )}
          {!isLoading && types.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Wrench className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Nenhum tipo de manutenção cadastrado.</p>
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
                          <Wrench className="h-4 w-4 mr-2 text-muted-foreground" />
                          {type.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(type)}
                            disabled={deleteMaintenanceTypeMutation.isPending}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(type.id)}
                            disabled={deleteMaintenanceTypeMutation.isPending && deleteMaintenanceTypeMutation.variables === type.id}
                          >
                            {deleteMaintenanceTypeMutation.isPending && deleteMaintenanceTypeMutation.variables === type.id
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