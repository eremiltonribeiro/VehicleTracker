import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { insertFuelStationSchema } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Fuel } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { offlineStorage } from "@/services/offlineStorage";

// Extend schema for validation
const fuelStationFormSchema = insertFuelStationSchema;

type FuelStationFormValues = z.infer<typeof fuelStationFormSchema>;

interface FuelStationFormProps {
  onSuccess?: () => void;
  editingStation?: any;
}

export function FuelStationForm({ onSuccess, editingStation }: FuelStationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Default values
  const defaultValues: Partial<FuelStationFormValues> = {
    name: editingStation?.name || "",
    address: editingStation?.address || "",
  };
  
  const form = useForm<FuelStationFormValues>({
    resolver: zodResolver(fuelStationFormSchema),
    defaultValues,
  });
  
  const createFuelStation = useMutation({
    mutationFn: async (data: FuelStationFormValues) => {
      try {
        // Handle offline state
        if (!navigator.onLine) {
          // Generate a temporary id (negative to avoid collisions with server ids)
          const tempId = -(Date.now());
          
          // Create station object
          const station = {
            ...data,
            id: tempId,
          };
          
          // Get current stations
          const stations = await offlineStorage.getFuelStations();
          
          // Add new station
          stations.push(station);
          
          // Save to local storage
          await offlineStorage.saveFuelStations(stations);
          
          return station;
        }
        
        // Send data to server
        const response = await apiRequest('/api/fuel-stations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        return response;
      } catch (error) {
        console.error("Erro ao criar posto de combustível:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Posto de combustível cadastrado com sucesso.",
      });
      
      // Reset form
      form.reset();
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/fuel-stations'] });
      
      // Call success callback if provided
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro!",
        description: "Ocorreu um erro ao cadastrar o posto de combustível. Tente novamente.",
        variant: "destructive",
      });
      
      console.error("Erro na mutação:", error);
    },
  });
  
  const onSubmit = (data: FuelStationFormValues) => {
    createFuelStation.mutate(data);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fuel className="h-5 w-5" />
          {editingStation ? "Editar Posto de Combustível" : "Novo Posto de Combustível"}
        </CardTitle>
        <CardDescription>
          {editingStation 
            ? "Altere os dados do posto conforme necessário" 
            : "Cadastre um novo posto de combustível para abastecimentos"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Posto*</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Posto Ipiranga" {...field} />
                  </FormControl>
                  <FormDescription>
                    Nome completo do posto de combustível
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço*</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Av. Paulista, 1578" {...field} />
                  </FormControl>
                  <FormDescription>
                    Endereço completo ou referência do posto
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={createFuelStation.isPending}
                className="flex items-center gap-1"
              >
                {createFuelStation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar Posto
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