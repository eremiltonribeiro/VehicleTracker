import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { insertDriverSchema } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save, UserCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { offlineStorage } from "@/services/offlineStorage";

// Extend schema for validation
const driverFormSchema = insertDriverSchema.extend({
  image: z.instanceof(File).optional(),
});

type DriverFormValues = z.infer<typeof driverFormSchema>;

interface DriverFormProps {
  onSuccess?: () => void;
  editingDriver?: any;
}

export function DriverForm({ onSuccess, editingDriver }: DriverFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Default values
  const defaultValues: Partial<DriverFormValues> = {
    name: editingDriver?.name || "",
    license: editingDriver?.license || "",
    phone: editingDriver?.phone || "",
  };

  const form = useForm<DriverFormValues>({
    resolver: zodResolver(driverFormSchema),
    defaultValues,
  });

  const createDriver = useMutation({
    mutationFn: async (data: DriverFormValues) => {
      try {
        // Handle offline state
        if (!navigator.onLine) {
          // Generate a temporary id (negative to avoid collisions with server ids)
          const tempId = -(Date.now());

          // Create driver object
          const driver = {
            ...data,
            id: tempId,
          };

          // Get current drivers
          const drivers = await offlineStorage.getDrivers();

          // Add new driver
          drivers.push(driver);

          // Save to local storage
          await offlineStorage.saveDrivers(drivers);

          return driver;
        }

        // Send data to server using native fetch with proper error handling
        const response = await window.fetch('/api/drivers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
          credentials: 'include', // Para incluir cookies de sessão
        });

        if (!response.ok) {
          // Capturar erro mais detalhado
          let errorMessage = 'Erro ao salvar motorista';
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            errorMessage = `Erro ${response.status}: ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        return await response.json();
      } catch (error) {
        console.error("Erro ao criar motorista:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Motorista cadastrado com sucesso.",
      });

      // Reset form
      form.reset();

      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/drivers'] });

      // Disparar evento para atualizar outras telas que dependem dos dados de motoristas
      window.dispatchEvent(new CustomEvent("driver-updated"));

      // Call success callback if provided
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro!",
        description: error.message || "Ocorreu um erro ao cadastrar o motorista. Tente novamente.",
        variant: "destructive",
      });

      console.error("Erro na mutação:", error);
    },
  });

  const onSubmit = (data: DriverFormValues) => {
    createDriver.mutate(data);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCircle className="h-5 w-5" />
          {editingDriver ? "Editar Motorista" : "Novo Motorista"}
        </CardTitle>
        <CardDescription>
          {editingDriver 
            ? "Altere os dados do motorista conforme necessário" 
            : "Preencha os dados para cadastrar um novo motorista"}
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
                    <FormLabel>Nome do Motorista*</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: João da Silva" {...field} />
                    </FormControl>
                    <FormDescription>
                      Nome completo do motorista
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="license"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNH*</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 12345678900" {...field} />
                    </FormControl>
                    <FormDescription>
                      Número da Carteira Nacional de Habilitação
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone*</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: (11) 98765-4321" {...field} />
                  </FormControl>
                  <FormDescription>
                    Número para contato com o motorista
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={createDriver.isPending}
                className="flex items-center gap-1"
              >
                {createDriver.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar Motorista
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