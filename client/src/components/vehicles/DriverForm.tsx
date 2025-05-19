import { useState } from "react";
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
import { FileInput } from "@/components/ui/file-input";
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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
  
  const saveDriver = useMutation({
    mutationFn: async (data: DriverFormValues) => {
      try {
        // Determine if creating or updating
        const isEditing = !!editingDriver;
        
        // Handle offline state
        if (!navigator.onLine) {
          // Generate a temporary id if needed (negative to avoid collisions with server ids)
          const id = isEditing ? editingDriver.id : -(Date.now());
          
          // Create driver object
          const driver = {
            ...data,
            id,
          };
          
          // Get current drivers
          const drivers = await offlineStorage.getDrivers();
          
          if (isEditing) {
            // Update existing driver
            const updatedDrivers = drivers.map((d: any) => 
              d.id === editingDriver.id ? driver : d
            );
            await offlineStorage.saveDrivers(updatedDrivers);
          } else {
            // Add new driver
            drivers.push(driver);
            await offlineStorage.saveDrivers(drivers);
          }
          
          // Save image if provided
          if (data.image && imagePreview) {
            await offlineStorage.saveImage(`driver_${id}`, imagePreview);
          }
          
          return driver;
        }
        
        // Online state - create FormData for file upload
        const formData = new FormData();
        
        // Add all fields to form data
        Object.entries(data).forEach(([key, value]) => {
          if (key !== 'image') {
            formData.append(key, String(value));
          }
        });
        
        // Add image if available
        if (data.image) {
          formData.append('image', data.image);
        }
        
        // Send data to server
        const url = isEditing 
          ? `/api/drivers/${editingDriver.id}` 
          : '/api/drivers';
          
        const method = isEditing ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method,
          body: formData,
          headers: {
            // Não incluir Content-Type porque o FormData define automaticamente com boundary
          },
        });
        
        if (!response.ok) {
          throw new Error('Falha ao salvar motorista');
        }
        
        return await response.json();
      } catch (error) {
        console.error("Erro ao salvar motorista:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: editingDriver 
          ? "Motorista atualizado com sucesso." 
          : "Motorista cadastrado com sucesso.",
      });
      
      // Reset form if not editing
      if (!editingDriver) {
        form.reset();
        setImagePreview(null);
      }
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/drivers'] });
      
      // Call success callback if provided
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro!",
        description: `Ocorreu um erro ao ${editingDriver ? 'atualizar' : 'cadastrar'} o motorista. Tente novamente.`,
        variant: "destructive",
      });
      
      console.error("Erro na mutação:", error);
    },
  });
  
  const handleImageChange = (file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };
  
  const onSubmit = async (data: DriverFormValues) => {
    try {
      console.log("Enviando dados do motorista:", data);
      saveDriver.mutate(data);
    } catch (error) {
      console.error("Erro ao enviar formulário:", error);
    }
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
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo*</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: João Silva" {...field} />
                  </FormControl>
                  <FormDescription>
                    Nome completo do motorista
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="license"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNH*</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 12345678901" {...field} />
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
            
            <FormField
              control={form.control}
              name="image"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Foto do Motorista</FormLabel>
                  <FormControl>
                    <FileInput
                      {...field}
                      accept={['image/jpeg', 'image/png', 'image/jpg']}
                      maxSize={5} // 5MB
                      onFileChange={(file) => {
                        onChange(file);
                        handleImageChange(file);
                      }}
                      defaultPreview={imagePreview || undefined}
                    />
                  </FormControl>
                  <FormDescription>
                    Adicione uma foto do motorista (opcional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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