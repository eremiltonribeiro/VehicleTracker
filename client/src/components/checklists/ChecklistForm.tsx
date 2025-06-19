import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, CheckCircle2, XCircle, AlertTriangle, Camera } from "lucide-react";

// Schema de validação
const checklistFormSchema = z.object({
  vehicleId: z.coerce.number().min(1, "Veículo é obrigatório"),
  driverId: z.coerce.number().min(1, "Motorista é obrigatório"),
  templateId: z.coerce.number().min(1, "Template é obrigatório"),
  odometer: z.coerce.number().min(0, "Hodômetro deve ser um número positivo"),
  observations: z.string().optional(),
  items: z.array(z.object({
    itemId: z.number(),
    status: z.enum(["ok", "issue", "not_applicable"]),
    observation: z.string().optional(),
  })),
});

type ChecklistFormData = z.infer<typeof checklistFormSchema>;

interface ChecklistItem {
  id: number;
  name: string;
  category: string;
  isRequired: boolean;
  order: number;
}

interface Template {
  id: number;
  name: string;
  description: string;
  items: ChecklistItem[];
}

interface Vehicle {
  id: number;
  name: string;
  plate: string;
}

interface Driver {
  id: number;
  name: string;
}

interface ChecklistFormProps {
  checklistId?: string;
}

export default function ChecklistForm({ checklistId }: ChecklistFormProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ChecklistFormData>({
    resolver: zodResolver(checklistFormSchema),
    defaultValues: {
      vehicleId: 0,
      driverId: 0,
      templateId: 0,
      odometer: 0,
      observations: "",
      items: [],
    },
  });

  // Carregar dados para os selects
  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
    queryFn: async () => {
      const response = await fetch("/api/vehicles");
      if (!response.ok) throw new Error("Erro ao carregar veículos");
      return response.json();
    },
  });

  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
    queryFn: async () => {
      const response = await fetch("/api/drivers");
      if (!response.ok) throw new Error("Erro ao carregar motoristas");
      return response.json();
    },
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["/api/checklist-templates"],
    queryFn: async () => {
      const response = await fetch("/api/checklist-templates");
      if (!response.ok) throw new Error("Erro ao carregar templates");
      return response.json();
    },
  });

  // Carregar dados do checklist para edição
  const { data: checklistData, isLoading: isLoadingChecklist } = useQuery({
    queryKey: ["/api/checklists", checklistId],
    queryFn: async () => {
      if (!checklistId) return null;
      const response = await fetch(`/api/checklists/${checklistId}`);
      if (!response.ok) throw new Error("Erro ao carregar checklist");
      return response.json();
    },
    enabled: !!checklistId,
  });

  // Carregar itens do template selecionado
  const { data: templateItems = [] } = useQuery<ChecklistItem[]>({
    queryKey: ["/api/checklist-templates", form.watch("templateId"), "items"],
    queryFn: async () => {
      const templateId = form.watch("templateId");
      if (!templateId) return [];
      const response = await fetch(`/api/checklist-templates/${templateId}/items`);
      if (!response.ok) throw new Error("Erro ao carregar itens do template");
      return response.json();
    },
    enabled: !!form.watch("templateId"),
  });

  // Atualizar formulário quando os dados do checklist carregarem
  useEffect(() => {
    if (checklistData && checklistId) {
      form.reset({
        vehicleId: checklistData.vehicleId,
        driverId: checklistData.driverId,
        templateId: checklistData.templateId,
        odometer: checklistData.odometer,
        observations: checklistData.observations || "",
        items: checklistData.results?.map((result: any) => ({
          itemId: result.itemId,
          status: result.status,
          observation: result.observation || "",
        })) || [],
      });
    }
  }, [checklistData, checklistId, form]);

  // Atualizar itens quando template mudar
  useEffect(() => {
    if (templateItems.length > 0 && !checklistId) {
      const items = templateItems.map(item => ({
        itemId: item.id,
        status: "ok" as const,
        observation: "",
      }));
      form.setValue("items", items);
    }
  }, [templateItems, checklistId, form]);

  const handleSubmit = async (data: ChecklistFormData) => {
    try {
      setIsSubmitting(true);

      const url = checklistId ? `/api/checklists/${checklistId}` : "/api/checklists";
      const method = checklistId ? "PUT" : "POST";

      // Calcular status baseado nos itens
      const hasIssues = data.items.some(item => item.status === "issue");
      const status = hasIssues ? "failed" : "complete";

      const payload = {
        ...data,
        status,
        results: data.items,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Erro ao ${checklistId ? "atualizar" : "criar"} checklist`);
      }

      // Invalidar cache e disparar evento
      queryClient.invalidateQueries({ queryKey: ["/api/checklists"] });
      queryClient.removeQueries({ queryKey: ["/api/checklists"] });
      window.dispatchEvent(new CustomEvent("checklist-updated"));

      toast({
        title: "Sucesso!",
        description: `Checklist ${checklistId ? "atualizado" : "criado"} com sucesso.`,
        variant: "default",
      });

      setLocation("/checklists");
    } catch (error) {
      console.error("Erro ao salvar checklist:", error);
      toast({
        title: "Erro",
        description: `Erro ao ${checklistId ? "atualizar" : "criar"} checklist. Tente novamente.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ok":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "issue":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "not_applicable":
        return <AlertTriangle className="h-5 w-5 text-gray-400" />;
      default:
        return null;
    }
  };

  const groupItemsByCategory = (items: ChecklistItem[]) => {
    return items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, ChecklistItem[]>);
  };

  const getCategoryName = (category: string) => {
    const categories: Record<string, string> = {
      geral: "Geral",
      exterior: "Exterior",
      interior: "Interior", 
      motor: "Motor",
      pneus: "Pneus e Rodas",
      luzes: "Luzes e Sinalização",
      documentacao: "Documentação",
      seguranca: "Segurança",
    };
    return categories[category] || category;
  };

  if (isLoadingChecklist) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="text-center">
          <div className="mb-4">Carregando checklist...</div>
        </div>
      </div>
    );
  }

  const groupedItems = groupItemsByCategory(templateItems.sort((a, b) => a.order - b.order));

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/checklists")}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold text-blue-900">
            {checklistId ? "Editar Checklist" : "Novo Checklist"}
          </h2>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="vehicleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Veículo *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o veículo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vehicles.map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                              {vehicle.name} ({vehicle.plate})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="driverId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motorista *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o motorista" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {drivers.map((driver) => (
                            <SelectItem key={driver.id} value={driver.id.toString()}>
                              {driver.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="templateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value?.toString()}
                        disabled={!!checklistId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o template" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {templates.map((template: any) => (
                            <SelectItem key={template.id} value={template.id.toString()}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="odometer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hodômetro (km) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ex: 25000"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações Gerais</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observações gerais sobre o checklist..."
                          className="min-h-[60px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Itens do Checklist */}
          {Object.keys(groupedItems).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Itens do Checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category} className="space-y-3">
                    <h3 className="text-md font-medium text-gray-700 border-b pb-2">
                      {getCategoryName(category)}
                    </h3>
                    <div className="space-y-3">
                      {items.map((item, index) => {
                        const itemIndex = templateItems.findIndex(ti => ti.id === item.id);
                        return (
                          <div key={item.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm">
                                  {item.name}
                                  {item.isRequired && <span className="text-red-500 ml-1">*</span>}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`items.${itemIndex}.status`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      value={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Selecione o status" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="ok">
                                          <div className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                            OK
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="issue">
                                          <div className="flex items-center gap-2">
                                            <XCircle className="h-4 w-4 text-red-600" />
                                            Problema
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="not_applicable">
                                          <div className="flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-gray-400" />
                                            Não Aplicável
                                          </div>
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`items.${itemIndex}.observation`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Observação</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Observação específica..."
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/checklists")}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-700 hover:bg-blue-800"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting
                ? "Salvando..."
                : checklistId
                ? "Atualizar Checklist"
                : "Criar Checklist"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
