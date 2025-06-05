import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Car, Plus, Edit, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Vehicle, insertVehicleSchema } from "@shared/schema"; // Import Zod schema
import { ZodIssue } from "zod"; // Import ZodIssue for error formatting
// import { offlineStorage } from "@/services/offlineStorage"; // Kept if offline is still relevant

export function CadastroVeiculos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({}); // State for Zod errors
  const [formData, setFormData] = useState({
    name: "",
    plate: "",
    model: "",
    year: "",
    imageUrl: ""
  });

  const { data: vehicles = [], isLoading } = useQuery<Vehicle[], Error>({ // Added Error type for useQuery
    queryKey: ["/api/vehicles"], // Changed from array to string for consistency if preferred, though array is fine
    queryFn: async () => {
      // Offline storage logic can be kept if desired, but for now, focusing on online
      const res = await fetch("/api/vehicles");
      if (!res.ok) {
        // For offline-first, you might return offlineStorage.getVehicles() here
        throw new Error("Falha ao buscar veículos da API");
      }
      const data = await res.json();
      // await offlineStorage.saveVehicles(data); // Keep if offline needed
      return data;
    },
    // onError: () => { // Example if you want to fallback to offline on error
    //   return offlineStorage.getVehicles();
    // }
  });

  // Mutations
  const saveVehicleMutation = useMutation<Vehicle, Error, Partial<Vehicle>>({
    mutationFn: async (vehicleData) => {
      let url = '/api/vehicles';
      let method = 'POST';

      if (formMode === "edit" && currentVehicle?.id) {
        url = `/api/vehicles/${currentVehicle.id}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicleData),
      });

      if (!response.ok) {
        const entityName = "veículo"; // For message customization
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
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({
        title: "Sucesso!",
        description: formMode === "create"
          ? "Veículo cadastrado com sucesso."
          : "Veículo atualizado com sucesso.",
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

  const deleteVehicleMutation = useMutation<unknown, Error, number>({
    mutationFn: async (vehicleId) => {
      const response = await fetch(`/api/vehicles/${vehicleId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Erro desconhecido" }));
        throw new Error(errorData.message || "Falha ao excluir veículo");
      }
      // No need to return response.json() for DELETE if backend sends no body on 200/204
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({
        title: "Sucesso!",
        description: "Veículo excluído com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro!",
        description: error.message || "Ocorreu um erro ao excluir o veículo.",
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
      plate: "",
      model: "",
      year: "",
      imageUrl: ""
    });
    setFormMode("create");
    setCurrentVehicle(null);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setCurrentVehicle(vehicle);
    setFormData({
      name: vehicle.name,
      plate: vehicle.plate,
      model: vehicle.model || "",
      year: vehicle.year ? String(vehicle.year) : "",
      imageUrl: vehicle.imageUrl || ""
    });
    setFormMode("edit");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este veículo?")) return;
    deleteVehicleMutation.mutate(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({}); // Clear previous errors

    const rawYear = formData.year ? parseInt(formData.year) : undefined;
    const vehicleDataToValidate = {
      name: formData.name,
      plate: formData.plate,
      model: formData.model || undefined, // Ensure empty strings become undefined if schema expects optional
      year: rawYear,
      // imageUrl is not part of insertVehicleSchema from shared/schema by default,
      // but if it were, it would be: imageUrl: formData.imageUrl || undefined
    };

    const validationResult = insertVehicleSchema.safeParse(vehicleDataToValidate);

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
    const finalVehicleData = {
        ...validationResult.data,
        imageUrl: formData.imageUrl || undefined
    };

    saveVehicleMutation.mutate(finalVehicleData);
  };

  if (isLoading) { // This isLoading is from useQuery for fetching vehicles
    return <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {formMode === "create" ? <Plus className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
            {formMode === "create" ? "Novo Veículo" : "Editar Veículo"}
          </CardTitle>
          <CardDescription>
            {formMode === "create" 
              ? "Cadastre um novo veículo no sistema" 
              : "Altere os dados do veículo selecionado"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Veículo*</Label>
                <Input 
                  id="name"
                  name="name"
                  placeholder="Ex: Ford Ranger"
                  value={formData.name}
                  onChange={handleInputChange}
                  // Zod schema handles required, but `required` attr is good for browser too
                />
                {formErrors.name && <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="plate">Placa*</Label>
                <Input 
                  id="plate"
                  name="plate"
                  placeholder="Ex: ABC-1234"
                  value={formData.plate}
                  onChange={handleInputChange}
                />
                {formErrors.plate && <p className="text-sm text-red-500 mt-1">{formErrors.plate}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model">Modelo</Label>
                <Input 
                  id="model"
                  name="model"
                  placeholder="Ex: XLT 4x4"
                  value={formData.model}
                  onChange={handleInputChange}
                />
                {formErrors.model && <p className="text-sm text-red-500 mt-1">{formErrors.model}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="year">Ano</Label>
                <Input 
                  id="year"
                  name="year"
                  type="number"
                  placeholder="Ex: 2023"
                  value={formData.year}
                  onChange={handleInputChange}
                />
                {formErrors.year && <p className="text-sm text-red-500 mt-1">{formErrors.year}</p>}
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="imageUrl">URL da Imagem</Label>
                <Input 
                  id="imageUrl"
                  name="imageUrl"
                  placeholder="URL da imagem do veículo"
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
                disabled={saveVehicleMutation.isPending}
              >
                {saveVehicleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {formMode === "create" ? "Cadastrar Veículo" : "Atualizar Veículo"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Veículos Cadastrados</CardTitle>
          <CardDescription>
            {vehicles.length} veículo(s) registrado(s) no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && vehicles.length === 0 && ( // Show loader only if loading and no vehicles yet
             <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin" /></div>
          )}
          {!isLoading && vehicles.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Car className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Nenhum veículo cadastrado.</p>
              <p className="text-sm mt-1">Use o formulário acima para adicionar um novo veículo.</p>
            </div>
          )}
          {vehicles.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Ano</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {vehicle.imageUrl ? (
                            <img src={vehicle.imageUrl} alt={vehicle.name} className="h-8 w-8 mr-2 rounded-sm object-cover" />
                          ) : (
                            <Car className="h-4 w-4 mr-2 text-muted-foreground" />
                          )}
                          {vehicle.name}
                        </div>
                      </TableCell>
                      <TableCell>{vehicle.plate}</TableCell>
                      <TableCell>{vehicle.model || "-"}</TableCell>
                      <TableCell>{vehicle.year || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(vehicle)}
                            disabled={deleteVehicleMutation.isPending}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(vehicle.id)}
                            disabled={deleteVehicleMutation.isPending && deleteVehicleMutation.variables === vehicle.id}
                          >
                            {deleteVehicleMutation.isPending && deleteVehicleMutation.variables === vehicle.id
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