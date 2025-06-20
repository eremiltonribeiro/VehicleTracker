import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Wrench, Plus, Edit, Trash, Search, RefreshCw, AlertCircle, CheckCircle2, Calendar, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MaintenanceType, insertMaintenanceTypeSchema } from "@shared/schema";
import { ZodIssue } from "zod";
import { brandColors } from "@/lib/colors";

export function CadastroTiposManutencao() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [currentType, setCurrentType] = useState<MaintenanceType | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: ""
  });

  const { data: types = [], isLoading, error, refetch } = useQuery<MaintenanceType[], Error>({
    queryKey: ["/api/maintenance-types"],
    queryFn: async () => {
      const res = await fetch("/api/maintenance-types");
      if (!res.ok) {
        throw new Error("Falha ao buscar tipos de manutenção da API");
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });

  // Filtered data based on search
  const filteredTypes = useMemo(() => {
    if (!searchTerm) return types;
    return types.filter(type =>
      type.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [types, searchTerm]);

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
        action: <CheckCircle2 className="h-5 w-5" />,
      });
      resetForm();
      setShowForm(false);
    },
    onError: (error) => {
      toast({
        title: "Erro!",
        description: error.message || "Ocorreu um erro.",
        variant: "destructive",
        action: <AlertCircle className="h-5 w-5" />,
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
        action: <CheckCircle2 className="h-5 w-5" />,
      });
      setDeleteId(null);
    },
    onError: (error) => {
      toast({
        title: "Erro!",
        description: error.message || "Ocorreu um erro ao excluir o tipo de manutenção.",
        variant: "destructive",
        action: <AlertCircle className="h-5 w-5" />,
      });
      setDeleteId(null);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear specific field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const resetForm = () => {
    setFormData({ name: "" });
    setFormMode("create");
    setCurrentType(null);
    setFormErrors({});
  };

  const handleEdit = (type: MaintenanceType) => {
    setCurrentType(type);
    setFormData({ name: type.name });
    setFormMode("edit");
    setFormErrors({});
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMaintenanceTypeMutation.mutate(deleteId);
    }
  };

  const handleNewType = () => {
    resetForm();
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    
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
        action: <AlertCircle className="h-5 w-5" />,
      });
      return;
    }

    saveMaintenanceTypeMutation.mutate(validationResult.data);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: brandColors.primary[600] }} />
        <p className="text-muted-foreground">Carregando tipos de manutenção...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar tipos de manutenção: {error.message}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()} 
                className="ml-2"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: brandColors.primary[600] }}>
            <Wrench className="h-6 w-6" />
            Tipos de Manutenção
          </h2>
          <p className="text-muted-foreground mt-1">
            Gerencie os tipos de manutenção do sistema
          </p>
        </div>
        <Button onClick={handleNewType} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Tipo
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Tipos</p>
                <p className="text-2xl font-bold" style={{ color: brandColors.primary[600] }}>
                  {types.length}
                </p>
              </div>
              <div className="p-2 rounded-full" style={{ backgroundColor: `${brandColors.primary}20` }}>
                <Wrench className="h-6 w-6" style={{ color: brandColors.primary[600] }} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold" style={{ color: brandColors.success[600] }}>
                  {types.length}
                </p>
              </div>
              <div className="p-2 rounded-full" style={{ backgroundColor: `${brandColors.success}20` }}>
                <Activity className="h-6 w-6" style={{ color: brandColors.success[600] }} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Filtrados</p>
                <p className="text-2xl font-bold" style={{ color: brandColors.accent }}>
                  {filteredTypes.length}
                </p>
              </div>
              <div className="p-2 rounded-full" style={{ backgroundColor: `${brandColors.accent}20` }}>
                <Search className="h-6 w-6" style={{ color: brandColors.accent }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Section */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tipos de manutenção..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Tipos</CardTitle>
          <CardDescription>
            {filteredTypes.length === 0 && searchTerm
              ? `Nenhum tipo encontrado para "${searchTerm}"`
              : `${filteredTypes.length} tipo(s) de manutenção encontrado(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTypes.length === 0 && !searchTerm ? (
            <div className="text-center py-12">
              <div className="p-4 rounded-full mx-auto w-fit" style={{ backgroundColor: `${brandColors.primary}10` }}>
                <Wrench className="h-12 w-12" style={{ color: brandColors.primary[600] }} />
              </div>
              <h3 className="text-lg font-semibold mt-4 mb-2">Nenhum tipo cadastrado</h3>
              <p className="text-muted-foreground mb-4">
                Comece criando seu primeiro tipo de manutenção
              </p>
              <Button onClick={handleNewType}>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Primeiro Tipo
              </Button>
            </div>
          ) : filteredTypes.length === 0 && searchTerm ? (
            <div className="text-center py-8">
              <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">
                Nenhum tipo encontrado para "{searchTerm}"
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo de Manutenção</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-full" style={{ backgroundColor: `${brandColors.primary}20` }}>
                            <Wrench className="h-4 w-4" style={{ color: brandColors.primary[600] }} />
                          </div>
                          <div>
                            <p className="font-medium">{type.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Tipo de manutenção ativo
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" style={{ backgroundColor: `${brandColors.success[600]}20`, color: brandColors.success[600] }}>
                          Ativo
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(type)}
                            disabled={saveMaintenanceTypeMutation.isPending}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(type.id)}
                            disabled={deleteMaintenanceTypeMutation.isPending}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash className="h-4 w-4" />
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

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {formMode === "create" ? <Plus className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
              {formMode === "create" ? "Novo Tipo de Manutenção" : "Editar Tipo de Manutenção"}
            </DialogTitle>
            <DialogDescription>
              {formMode === "create" 
                ? "Preencha os dados para cadastrar um novo tipo de manutenção" 
                : "Altere os dados do tipo de manutenção selecionado"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Tipo de Manutenção*</Label>
              <Input 
                id="name"
                name="name"
                placeholder="Ex: Troca de Óleo"
                value={formData.name}
                onChange={handleInputChange}
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {formErrors.name}
                </p>
              )}
            </div>
            
            <DialogFooter className="flex gap-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setShowForm(false)}
                disabled={saveMaintenanceTypeMutation.isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={saveMaintenanceTypeMutation.isPending}
                className="flex items-center gap-2"
              >
                {saveMaintenanceTypeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {formMode === "create" ? "Cadastrar" : "Atualizar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este tipo de manutenção? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMaintenanceTypeMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMaintenanceTypeMutation.isPending}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteMaintenanceTypeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}