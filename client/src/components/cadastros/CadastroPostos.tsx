import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Fuel, Plus, Edit, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FuelStation, insertFuelStationSchema } from "@shared/schema"; // Import Zod schema
import { ZodIssue } from "zod"; // Import ZodIssue for error formatting
// import { offlineStorage } from "@/services/offlineStorage"; // Kept if offline is still relevant

export function CadastroPostos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [currentStation, setCurrentStation] = useState<FuelStation | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({}); // State for Zod errors
  const [formData, setFormData] = useState({
    name: "",
    address: ""
  });

  const { data: stations = [], isLoading } = useQuery<FuelStation[], Error>({
    queryKey: ["/api/fuel-stations"],
    queryFn: async () => {
      // Simplified online-only queryFn
      const res = await fetch("/api/fuel-stations");
      if (!res.ok) {
        throw new Error("Falha ao buscar postos da API");
      }
      return res.json();
    },
  });

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
        throw new Error(errorData.message || `Falha ao ${formMode === "create" ? "criar" : "atualizar"} posto`);
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
  };

  const handleEdit = (station: FuelStation) => {
    setCurrentStation(station);
    setFormData({
      name: station.name,
      address: station.address || ""
    });
    setFormMode("edit");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este posto?")) return;
    deleteFuelStationMutation.mutate(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({}); // Clear previous errors

    const stationDataToValidate = {
      name: formData.name,
      address: formData.address || undefined, // Handle optional fields for Zod
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

  if (isLoading) { // This isLoading is from useQuery for fetching stations
    return <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {formMode === "create" ? <Plus className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
            {formMode === "create" ? "Novo Posto" : "Editar Posto"}
          </CardTitle>
          <CardDescription>
            {formMode === "create" 
              ? "Cadastre um novo posto de combustível" 
              : "Altere os dados do posto selecionado"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Posto*</Label>
                <Input 
                  id="name"
                  name="name"
                  placeholder="Ex: Posto Ipiranga"
                  value={formData.name}
                  onChange={handleInputChange}
                />
                {formErrors.name && <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input 
                  id="address"
                  name="address"
                  placeholder="Ex: Av. Principal, 1000"
                  value={formData.address}
                  onChange={handleInputChange}
                />
                {formErrors.address && <p className="text-sm text-red-500 mt-1">{formErrors.address}</p>}
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
                disabled={saveFuelStationMutation.isPending}
              >
                {saveFuelStationMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {formMode === "create" ? "Cadastrar Posto" : "Atualizar Posto"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Postos Cadastrados</CardTitle>
          <CardDescription>
            {stations.length} posto(s) registrado(s) no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && stations.length === 0 && (
             <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin" /></div>
          )}
          {!isLoading && stations.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Fuel className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Nenhum posto cadastrado.</p>
              <p className="text-sm mt-1">Use o formulário acima para adicionar um novo posto.</p>
            </div>
          )}
          {stations.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stations.map((station) => (
                    <TableRow key={station.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Fuel className="h-4 w-4 mr-2 text-muted-foreground" />
                          {station.name}
                        </div>
                      </TableCell>
                      <TableCell>{station.address || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(station)}
                            disabled={deleteFuelStationMutation.isPending}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(station.id)}
                            disabled={deleteFuelStationMutation.isPending && deleteFuelStationMutation.variables === station.id}
                          >
                            {deleteFuelStationMutation.isPending && deleteFuelStationMutation.variables === station.id
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