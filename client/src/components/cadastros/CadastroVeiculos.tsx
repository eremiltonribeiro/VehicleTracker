import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
<<<<<<< HEAD
import { useLocation } from "wouter";
=======
import { Link } from "wouter";
>>>>>>> f637565a40665382154ff66e15537e66e19f2dc7
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
<<<<<<< HEAD
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Car, Plus, Edit, Trash, Search, Eye, Calendar, Fuel, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Vehicle, insertVehicleSchema } from "@shared/schema";
import { ZodIssue } from "zod";
=======
import { Loader2, Car, Plus, Edit, Trash, Eye, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Vehicle, insertVehicleSchema } from "@shared/schema";
import { ZodIssue } from "zod";
// import { offlineStorage } from "@/services/offlineStorage"; // Kept if offline is still relevant
>>>>>>> f637565a40665382154ff66e15537e66e19f2dc7

export function CadastroVeiculos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [_, setLocation] = useLocation();
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(null);
<<<<<<< HEAD
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
=======
  const [formErrors, setFormErrors] = useState<Record<string, string>>({}); 
  const [searchTerm, setSearchTerm] = useState("");
>>>>>>> f637565a40665382154ff66e15537e66e19f2dc7
  const [formData, setFormData] = useState({
    name: "",
    plate: "",
    model: "",
    year: "",
    imageUrl: ""
  });

  const { data: vehicles = [], isLoading } = useQuery<Vehicle[], Error>({
    queryKey: ["/api/vehicles"],
    queryFn: async () => {
      const res = await fetch("/api/vehicles");
      if (!res.ok) {
        throw new Error("Falha ao buscar veículos da API");
      }
      return res.json();
    },
  });

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
        let errorMessage = "Erro ao salvar veículo";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
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
      setIsDialogOpen(false);
      window.dispatchEvent(new CustomEvent("vehicle-updated"));
    },
    onError: (error) => {
      toast({
        title: "Erro!",
        description: error.message,
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({
        title: "Sucesso!",
        description: "Veículo excluído com sucesso.",
      });
      window.dispatchEvent(new CustomEvent("vehicle-updated"));
    },
    onError: (error) => {
      toast({
        title: "Erro!",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
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
    setFormErrors({});
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
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteVehicleMutation.mutate(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const rawYear = formData.year ? parseInt(formData.year) : undefined;
    const vehicleDataToValidate = {
      name: formData.name.trim(),
      plate: formData.plate.trim().toUpperCase(),
      model: formData.model.trim(),
      year: rawYear,
      imageUrl: formData.imageUrl.trim() || undefined
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
      return;
    }

    saveVehicleMutation.mutate(vehicleDataToValidate);
  };

  // Filter vehicles based on search term
  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando veículos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Veículos</h2>
          <p className="text-gray-600">Cadastre e gerencie os veículos da frota</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Veículo
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {formMode === "create" ? "Cadastrar Novo Veículo" : "Editar Veículo"}
              </DialogTitle>
              <DialogDescription>
                {formMode === "create" 
                  ? "Preencha as informações do novo veículo" 
                  : "Atualize as informações do veículo"
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Veículo *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Caminhão 1, Van Executiva"
                  className={formErrors.name ? "border-red-500" : ""}
                />
                {formErrors.name && (
                  <p className="text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="plate">Placa *</Label>
                <Input
                  id="plate"
                  name="plate"
                  value={formData.plate}
                  onChange={handleInputChange}
                  placeholder="ABC-1234"
                  className={formErrors.plate ? "border-red-500" : ""}
                />
                {formErrors.plate && (
                  <p className="text-sm text-red-600">{formErrors.plate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Modelo *</Label>
                <Input
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  placeholder="Ex: Toyota Hilux, Mercedes Sprinter"
                  className={formErrors.model ? "border-red-500" : ""}
                />
                {formErrors.model && (
                  <p className="text-sm text-red-600">{formErrors.model}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Ano *</Label>
                <Input
                  id="year"
                  name="year"
                  type="number"
                  value={formData.year}
                  onChange={handleInputChange}
                  placeholder="2023"
                  min="1900"
                  max="2030"
                  className={formErrors.year ? "border-red-500" : ""}
                />
                {formErrors.year && (
                  <p className="text-sm text-red-600">{formErrors.year}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">URL da Imagem (opcional)</Label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="https://exemplo.com/imagem.jpg"
                  className={formErrors.imageUrl ? "border-red-500" : ""}
                />
                {formErrors.imageUrl && (
                  <p className="text-sm text-red-600">{formErrors.imageUrl}</p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={saveVehicleMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {saveVehicleMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      {formMode === "create" ? "Cadastrar" : "Atualizar"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and filters */}
      <Card>
<<<<<<< HEAD
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle className="text-lg">Veículos Cadastrados</CardTitle>
              <CardDescription>
                {filteredVehicles.length} veículo(s) encontrado(s)
              </CardDescription>
=======
        <CardHeader>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <CardTitle>Veículos Cadastrados</CardTitle>
              <CardDescription>
                {vehicles.length} veículo(s) registrado(s) no sistema.
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar veículos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[200px]"
                />
              </div>
            </div>
          </div>
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
>>>>>>> f637565a40665382154ff66e15537e66e19f2dc7
            </div>
            
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, placa ou modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredVehicles.length === 0 ? (
            <div className="text-center py-8">
              <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "Nenhum veículo encontrado" : "Nenhum veículo cadastrado"}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? "Tente uma busca diferente ou cadastre um novo veículo."
                  : "Comece cadastrando o primeiro veículo da frota."
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Veículo
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Ano</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
<<<<<<< HEAD
                  {filteredVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {vehicle.imageUrl ? (
                            <img 
                              src={vehicle.imageUrl} 
                              alt={vehicle.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Car className="h-4 w-4 text-blue-600" />
=======
                  {vehicles
                    .filter(vehicle => 
                      vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (vehicle.model && vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                    .map((vehicle) => (
                    <TableRow key={vehicle.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center cursor-pointer">
                          {vehicle.imageUrl ? (
                            <img src={vehicle.imageUrl} alt={vehicle.name} className="h-10 w-10 mr-3 rounded-lg object-cover border" />
                          ) : (
                            <div className="h-10 w-10 mr-3 rounded-lg border bg-muted flex items-center justify-center">
                              <Car className="h-5 w-5 text-muted-foreground" />
>>>>>>> f637565a40665382154ff66e15537e66e19f2dc7
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{vehicle.name}</div>
                            <div className="text-sm text-muted-foreground">{vehicle.plate}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
<<<<<<< HEAD
                        <Badge variant="secondary" className="font-mono">
                          {vehicle.plate}
                        </Badge>
                      </TableCell>
                      <TableCell>{vehicle.model}</TableCell>
                      <TableCell>{vehicle.year}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
=======
                        <Badge variant="outline" className="font-mono">
                          {vehicle.plate}
                        </Badge>
                      </TableCell>
                      <TableCell>{vehicle.model || "-"}</TableCell>
                      <TableCell>{vehicle.year || "-"}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">Ativo</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Link href={`/vehicles/${vehicle.id}`}>
                            <Button variant="ghost" size="sm" title="Ver detalhes">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
>>>>>>> f637565a40665382154ff66e15537e66e19f2dc7
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLocation(`/vehicles/${vehicle.id}`)}
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(vehicle)}
<<<<<<< HEAD
=======
                            disabled={deleteVehicleMutation.isPending}
>>>>>>> f637565a40665382154ff66e15537e66e19f2dc7
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
<<<<<<< HEAD
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o veículo <strong>{vehicle.name}</strong> (Placa: {vehicle.plate})?
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(vehicle.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                  disabled={deleteVehicleMutation.isPending}
                                >
                                  {deleteVehicleMutation.isPending ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Excluindo...
                                    </>
                                  ) : (
                                    "Excluir"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
=======
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(vehicle.id)}
                            disabled={deleteVehicleMutation.isPending && deleteVehicleMutation.variables === vehicle.id}
                            title="Excluir"
                          >
                            {deleteVehicleMutation.isPending && deleteVehicleMutation.variables === vehicle.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Trash className="h-4 w-4" />
                            }
                          </Button>
>>>>>>> f637565a40665382154ff66e15537e66e19f2dc7
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
