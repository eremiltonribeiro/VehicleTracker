import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent,
  CardHeader, 
  CardTitle,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCircle, Plus, Pencil, Trash2 } from "lucide-react";
import { DriverForm } from "@/components/vehicles/DriverForm";
import { AlertDialogDelete } from "@/components/ui/alert-dialog-delete";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DriversSimple() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("list");
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [driverToDelete, setDriverToDelete] = useState<number | null>(null);
  
  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['/api/drivers'],
  }) as { data: any[], isLoading: boolean };
  
  const deleteDriver = useMutation({
    mutationFn: async (driverId: number) => {
      const response = await fetch(`/api/drivers/${driverId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Erro ao excluir motorista');
      }
      
      return driverId;
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Motorista excluído com sucesso.",
      });
      
      // Atualizar a lista após exclusão
      queryClient.invalidateQueries({ queryKey: ['/api/drivers'] });
    },
    onError: (error) => {
      toast({
        title: "Erro!",
        description: "Não foi possível excluir o motorista.",
        variant: "destructive",
      });
    },
  });
  
  const handleNewClick = () => {
    setEditingDriver(null);
    setActiveTab("form");
  };
  
  const handleEditClick = (driver: any) => {
    setEditingDriver(driver);
    setActiveTab("form");
  };
  
  const handleFormSuccess = () => {
    setActiveTab("list");
    setEditingDriver(null);
  };
  
  const handleDeleteClick = (driverId: number) => {
    setDriverToDelete(driverId);
  };
  
  const confirmDelete = () => {
    if (driverToDelete) {
      deleteDriver.mutate(driverToDelete);
      setDriverToDelete(null);
    }
  };
  
  const cancelDelete = () => {
    setDriverToDelete(null);
  };
  
  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Motoristas</h1>
            <p className="text-muted-foreground">
              Gerencie os motoristas da sua frota
            </p>
          </div>
          
          <TabsList>
            <TabsTrigger value="list">Lista</TabsTrigger>
            <TabsTrigger value="form">
              {editingDriver ? "Editar Motorista" : "Novo Motorista"}
            </TabsTrigger>
          </TabsList>
          
          <Button onClick={handleNewClick}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Motorista
          </Button>
        </div>
        
        <TabsContent value="list" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drivers.map((driver: any) => (
              <Card key={driver.id} className="flex flex-col">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xl flex items-center">
                    <UserCircle className="mr-2 h-5 w-5" />
                    {driver.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-grow">
                  <p className="text-sm">
                    <strong>CNH:</strong> {driver.license}
                  </p>
                  <p className="text-sm">
                    <strong>Telefone:</strong> {driver.phone}
                  </p>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditClick(driver)}>
                    <Pencil className="h-4 w-4 mr-1" /> Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(driver.id)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Excluir
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="form">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingDriver ? "Editar Motorista" : "Novo Motorista"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DriverForm 
                onSuccess={handleFormSuccess}
                editingDriver={editingDriver}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("list")}>
                Cancelar
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      <AlertDialogDelete 
        isOpen={driverToDelete !== null}
        setIsOpen={(isOpen) => !isOpen && setDriverToDelete(null)}
        title="Excluir Motorista"
        description="Tem certeza que deseja excluir este motorista? Esta ação não pode ser desfeita."
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        loading={deleteDriver.isPending}
      />
    </div>
  );
}