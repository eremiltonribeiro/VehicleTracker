import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Car } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Schema simplificado - sem imagem
const vehicleFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  plate: z.string().min(1, "Placa é obrigatória"),
  model: z.string().min(1, "Modelo é obrigatório"),
  year: z.string().min(1, "Ano é obrigatório")
});

type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

interface VehicleFormProps {
  onSuccess?: () => void;
  editingVehicle?: any;
}

export function SimpleVehicleForm({ onSuccess, editingVehicle }: VehicleFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Default values
  const defaultValues: VehicleFormValues = {
    name: "",
    plate: "",
    model: "",
    year: ""
  };
  
  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues,
  });
  
  // Preencher o formulário quando estiver editando
  useEffect(() => {
    if (editingVehicle) {
      form.reset({
        name: editingVehicle.name,
        plate: editingVehicle.plate,
        model: editingVehicle.model,
        year: editingVehicle.year
      });
    }
  }, [editingVehicle, form]);

  const saveVehicle = useMutation({
    mutationFn: async (data: VehicleFormValues) => {
      try {
        console.log("Iniciando salvamento do veículo:", data);
        const isEditing = !!editingVehicle;
        
        const vehicleData = {
          name: String(data.name),
          plate: String(data.plate),
          model: String(data.model),
          year: String(data.year)
        };
        
        const url = isEditing 
          ? `/api/vehicles/${editingVehicle?.id}` 
          : '/api/vehicles';
        
        console.log("Enviando para URL:", url, "Método:", isEditing ? 'PUT' : 'POST', "Dados:", vehicleData);
        
        const response = await fetch(url, {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(vehicleData)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Erro na resposta:", errorText);
          throw new Error(`Erro ao salvar veículo: ${errorText}`);
        }
        
        const result = await response.json();
        console.log("Resposta do servidor:", result);
        return result;
      } catch (error) {
        console.error("Exceção ao salvar veículo:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: editingVehicle 
          ? "Veículo atualizado com sucesso" 
          : "Veículo criado com sucesso",
      });
      
      // Limpar o formulário
      form.reset(defaultValues);
      
      // Invalidar queries para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      
      // Callback de sucesso
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro!",
        description: `Não foi possível salvar o veículo: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = async (data: VehicleFormValues) => {
    saveVehicle.mutate(data);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Car className="mr-2 h-6 w-6" />
          {editingVehicle ? "Editar Veículo" : "Novo Veículo"}
        </CardTitle>
        <CardDescription>
          {editingVehicle 
            ? "Atualize as informações do veículo" 
            : "Preencha as informações do novo veículo"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome*</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do veículo" {...field} />
                    </FormControl>
                    <FormDescription>
                      Nome ou identificação do veículo
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="plate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placa*</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: ABC-1234" {...field} />
                    </FormControl>
                    <FormDescription>
                      Placa do veículo
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo*</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Ford Ranger" {...field} />
                    </FormControl>
                    <FormDescription>
                      Modelo do veículo
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano*</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 2023" {...field} />
                    </FormControl>
                    <FormDescription>
                      Ano de fabricação
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={saveVehicle.isPending}
                className="flex items-center gap-1"
              >
                {saveVehicle.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar Veículo
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}