import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { insertDriverSchema } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save, UserCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { offlineStorage } from "@/services/offlineStorage";

// Schema simplificado sem imagem
const driverFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  license: z.string().min(1, "CNH é obrigatória"),
  phone: z.string().min(1, "Telefone é obrigatório")
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
  const defaultValues: DriverFormValues = {
    name: "",
    license: "",
    phone: ""
  };
  
  const form = useForm<DriverFormValues>({
    resolver: zodResolver(driverFormSchema),
    defaultValues,
  });
  
  // Preencher o formulário quando estiver editando
  useEffect(() => {
    if (editingDriver) {
      form.reset({
        name: editingDriver.name,
        license: editingDriver.license,
        phone: editingDriver.phone
      });
    }
  }, [editingDriver, form]);

  const saveDriver = useMutation({
    mutationFn: async (data: DriverFormValues) => {
      try {
        console.log("Iniciando salvamento do motorista:", data);
        const isEditing = !!editingDriver;
        
        // Dados para enviar ao servidor
        const driverData = {
          name: String(data.name),
          license: String(data.license),
          phone: String(data.phone)
        };
        
        const url = isEditing 
          ? `/api/drivers/${editingDriver?.id}` 
          : '/api/drivers';
        
        console.log("Enviando para URL:", url, "Método:", isEditing ? 'PUT' : 'POST', "Dados:", driverData);
        
        const response = await fetch(url, {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(driverData)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Erro na resposta:", errorText);
          throw new Error(`Erro ao salvar motorista: ${errorText}`);
        }
        
        const result = await response.json();
        console.log("Resposta do servidor:", result);
        return result;
      } catch (error) {
        console.error("Exceção ao salvar motorista:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: editingDriver 
          ? "Motorista atualizado com sucesso" 
          : "Motorista criado com sucesso",
      });
      
      // Limpar o formulário
      form.reset(defaultValues);
      
      // Invalidar queries para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['/api/drivers'] });
      
      // Callback de sucesso
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro!",
        description: `Não foi possível salvar o motorista: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = async (data: DriverFormValues) => {
    saveDriver.mutate(data);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <UserCircle className="mr-2 h-6 w-6" />
          {editingDriver ? "Editar Motorista" : "Novo Motorista"}
        </CardTitle>
        <CardDescription>
          {editingDriver 
            ? "Atualize as informações do motorista" 
            : "Preencha as informações do novo motorista"}
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
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormDescription>
                      Nome do motorista
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
                      <Input placeholder="Número da CNH" {...field} />
                    </FormControl>
                    <FormDescription>
                      Número da Carteira Nacional de Habilitação
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
                      Número de contato do motorista
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={saveDriver.isPending}
                className="flex items-center gap-1"
              >
                {saveDriver.isPending ? (
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