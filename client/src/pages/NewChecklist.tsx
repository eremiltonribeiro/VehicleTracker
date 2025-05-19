import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronRight, CheckSquare, Camera, Upload, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Tipos para o componente
interface Vehicle {
  id: number;
  name: string;
  plate: string;
}

interface Driver {
  id: number;
  name: string;
}

interface ChecklistTemplate {
  id: number;
  name: string;
  description: string | null;
}

interface ChecklistItem {
  id: number;
  templateId: number;
  name: string;
  description: string | null;
  isRequired: boolean;
  category: string | null;
  order: number;
}

// Schema para validação do formulário de checklist
const checklistFormSchema = z.object({
  vehicleId: z.string().min(1, "Veículo é obrigatório"),
  driverId: z.string().min(1, "Motorista é obrigatório"),
  templateId: z.string().min(1, "Modelo de checklist é obrigatório"),
  odometer: z.string().min(1, "Hodômetro é obrigatório"),
  observations: z.string().optional(),
  // Itens do checklist serão gerenciados separadamente
});

type ChecklistFormValues = z.infer<typeof checklistFormSchema>;

// Componente principal
export default function NewChecklist() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [itemResults, setItemResults] = useState<Record<number, { status: string; observation: string | null; photo: File | null }>>({});
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Configuração do formulário
  const form = useForm<ChecklistFormValues>({
    resolver: zodResolver(checklistFormSchema),
    defaultValues: {
      vehicleId: "",
      driverId: "",
      templateId: "",
      odometer: "",
      observations: "",
    },
  });
  
  useEffect(() => {
    // Carregar dados iniciais
    loadData();
  }, []);
  
  // Carregamento de dados (veículos, motoristas, templates)
  const loadData = () => {
    setIsLoading(true);
    
    // Simulação de carga de dados (em produção isso viria do servidor)
    setTimeout(() => {
      // Veículos
      const mockVehicles: Vehicle[] = [
        { id: 1, name: "Caminhão 01", plate: "ABC1234" },
        { id: 2, name: "Caminhão 02", plate: "DEF5678" },
        { id: 3, name: "Caminhão 03", plate: "GHI9012" },
      ];
      
      // Motoristas
      const mockDrivers: Driver[] = [
        { id: 1, name: "João Silva" },
        { id: 2, name: "Carlos Santos" },
        { id: 3, name: "Maria Oliveira" },
      ];
      
      // Templates de checklist
      const mockTemplates: ChecklistTemplate[] = [
        { id: 1, name: "Checklist Diário", description: "Verificação básica de segurança" },
        { id: 2, name: "Checklist Semanal", description: "Verificação completa do veículo" },
        { id: 3, name: "Checklist de Viagem", description: "Verificação para viagens longas" },
      ];
      
      setVehicles(mockVehicles);
      setDrivers(mockDrivers);
      setTemplates(mockTemplates);
      setIsLoading(false);
    }, 500);
  };
  
  // Carregar itens do template selecionado
  const loadTemplateItems = (templateId: string) => {
    if (!templateId) return;
    
    setIsLoading(true);
    
    // Simular carregamento de itens do template (em produção isso viria do servidor)
    setTimeout(() => {
      const mockItems: ChecklistItem[] = [
        // Itens para o template diário (ID 1)
        ...(templateId === "1" ? [
          { id: 1, templateId: 1, name: "Verificação do óleo do motor", description: "Verificar nível do óleo", isRequired: true, category: "Motor", order: 1 },
          { id: 2, templateId: 1, name: "Verificação do líquido de arrefecimento", description: "Verificar nível do radiador", isRequired: true, category: "Motor", order: 2 },
          { id: 3, templateId: 1, name: "Verificação dos freios", description: "Verificar funcionamento e nível do fluido", isRequired: true, category: "Segurança", order: 3 },
          { id: 4, templateId: 1, name: "Verificação das luzes", description: "Testar faróis, lanternas e setas", isRequired: true, category: "Segurança", order: 4 },
          { id: 5, templateId: 1, name: "Verificação da pressão dos pneus", description: "Verificar pressão conforme manual", isRequired: true, category: "Pneus", order: 5 },
        ] : []),
        
        // Itens para o template semanal (ID 2)
        ...(templateId === "2" ? [
          { id: 6, templateId: 2, name: "Verificação do óleo do motor", description: "Verificar nível e condição do óleo", isRequired: true, category: "Motor", order: 1 },
          { id: 7, templateId: 2, name: "Verificação do líquido de arrefecimento", description: "Verificar nível e condição do líquido", isRequired: true, category: "Motor", order: 2 },
          { id: 8, templateId: 2, name: "Verificação dos freios", description: "Verificar funcionamento, nível do fluido e desgaste das pastilhas", isRequired: true, category: "Segurança", order: 3 },
          { id: 9, templateId: 2, name: "Verificação das luzes", description: "Testar faróis, lanternas, setas e luzes internas", isRequired: true, category: "Segurança", order: 4 },
          { id: 10, templateId: 2, name: "Verificação da pressão dos pneus", description: "Verificar pressão e desgaste dos pneus", isRequired: true, category: "Pneus", order: 5 },
          { id: 11, templateId: 2, name: "Verificação da suspensão", description: "Verificar amortecedores e molas", isRequired: true, category: "Suspensão", order: 6 },
          { id: 12, templateId: 2, name: "Verificação do sistema elétrico", description: "Verificar bateria e alternador", isRequired: true, category: "Elétrica", order: 7 },
          { id: 13, templateId: 2, name: "Verificação dos filtros", description: "Verificar filtro de ar e combustível", isRequired: false, category: "Motor", order: 8 },
        ] : []),
        
        // Itens para o template de viagem (ID 3)
        ...(templateId === "3" ? [
          { id: 14, templateId: 3, name: "Verificação do óleo do motor", description: "Verificar nível do óleo", isRequired: true, category: "Motor", order: 1 },
          { id: 15, templateId: 3, name: "Verificação do líquido de arrefecimento", description: "Verificar nível do radiador", isRequired: true, category: "Motor", order: 2 },
          { id: 16, templateId: 3, name: "Verificação dos freios", description: "Verificar funcionamento e nível do fluido", isRequired: true, category: "Segurança", order: 3 },
          { id: 17, templateId: 3, name: "Verificação das luzes", description: "Testar faróis, lanternas e setas", isRequired: true, category: "Segurança", order: 4 },
          { id: 18, templateId: 3, name: "Verificação da pressão dos pneus", description: "Verificar pressão conforme manual", isRequired: true, category: "Pneus", order: 5 },
          { id: 19, templateId: 3, name: "Verificação do estepe", description: "Verificar condição e pressão do estepe", isRequired: true, category: "Pneus", order: 6 },
          { id: 20, templateId: 3, name: "Verificação dos documentos", description: "Verificar CRLV e demais documentos obrigatórios", isRequired: true, category: "Documentação", order: 7 },
          { id: 21, templateId: 3, name: "Verificação de equipamentos obrigatórios", description: "Verificar triangulo, macaco e chave de roda", isRequired: true, category: "Equipamentos", order: 8 },
          { id: 22, templateId: 3, name: "Verificação do combustível", description: "Verificar nível de combustível", isRequired: true, category: "Combustível", order: 9 },
        ] : []),
      ];
      
      setChecklistItems(mockItems);
      
      // Inicializar o estado de resultados para cada item
      const initialResults: Record<number, { status: string; observation: string | null; photo: File | null }> = {};
      mockItems.forEach(item => {
        initialResults[item.id] = { status: "ok", observation: null, photo: null };
      });
      setItemResults(initialResults);
      
      setIsLoading(false);
    }, 300);
  };
  
  // Lidar com a mudança de template
  const handleTemplateChange = (value: string) => {
    setSelectedTemplate(value);
    form.setValue("templateId", value);
    loadTemplateItems(value);
  };
  
  // Atualizar status de um item do checklist
  const updateItemStatus = (itemId: number, status: string) => {
    setItemResults(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], status },
    }));
  };
  
  // Atualizar observação de um item do checklist
  const updateItemObservation = (itemId: number, observation: string) => {
    setItemResults(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], observation },
    }));
  };
  
  // Atualizar foto de um item do checklist
  const handlePhotoUpload = (itemId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setItemResults(prev => ({
        ...prev,
        [itemId]: { ...prev[itemId], photo: file },
      }));
    }
  };
  
  // Avançar para o próximo passo
  const handleNext = async () => {
    if (step === 1) {
      // Validar o primeiro passo
      const isValid = await form.trigger(["vehicleId", "driverId", "templateId", "odometer"]);
      if (!isValid) return;
      
      setStep(2);
    } else {
      // Salvar o checklist completo
      handleSave();
    }
  };
  
  // Voltar para o passo anterior
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      // Voltar para a lista de checklists
      setLocation("/checklists");
    }
  };
  
  // Salvar o checklist
  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Verificar se todos os itens obrigatórios foram preenchidos
      const requiredItems = checklistItems.filter(item => item.isRequired);
      
      let hasErrors = false;
      for (const item of requiredItems) {
        const result = itemResults[item.id];
        if (result.status === "issue" && !result.observation) {
          toast({
            title: "Erro",
            description: `O item "${item.name}" apresenta problema e precisa de uma observação`,
            variant: "destructive",
          });
          hasErrors = true;
          break;
        }
      }
      
      if (hasErrors) {
        setIsSaving(false);
        return;
      }
      
      // Simulando salvamento (em produção seria uma chamada à API)
      setTimeout(() => {
        toast({
          title: "Sucesso",
          description: "Checklist registrado com sucesso!",
        });
        
        setIsSaving(false);
        setLocation("/checklists");
      }, 1000);
    } catch (error) {
      console.error("Erro ao salvar checklist:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o checklist. Tente novamente.",
        variant: "destructive",
      });
      setIsSaving(false);
    }
  };
  
  // Obter itens agrupados por categoria
  const getItemsByCategory = () => {
    const categories: Record<string, ChecklistItem[]> = {};
    
    checklistItems.forEach(item => {
      const category = item.category || "Sem categoria";
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(item);
    });
    
    return categories;
  };
  
  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleBack}
            className="h-8 w-8 text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold text-blue-900">Novo Checklist</h2>
        </div>
        <div className="text-sm font-medium text-gray-500">
          Passo {step} de 2
        </div>
      </div>
      
      {step === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Carregando...</div>
            ) : (
              <Form {...form}>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="vehicleId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Veículo</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o veículo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {vehicles.map(vehicle => (
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
                          <FormLabel>Motorista</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o motorista" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {drivers.map(driver => (
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
                          <FormLabel>Modelo de Checklist</FormLabel>
                          <Select 
                            onValueChange={handleTemplateChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o modelo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {templates.map(template => (
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
                    
                    <FormField
                      control={form.control}
                      name="odometer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hodômetro (km)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Hodômetro atual" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="observations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações Gerais (opcional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Observações adicionais sobre o veículo" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-blue-700" />
              Itens do Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Carregando itens do checklist...</div>
            ) : (
              <div className="space-y-8">
                {Object.entries(getItemsByCategory()).map(([category, items]) => (
                  <div key={category} className="space-y-4">
                    <h3 className="font-medium text-blue-900 text-lg">{category}</h3>
                    <div className="space-y-6">
                      {items.map(item => (
                        <div key={item.id} className="border rounded-lg p-4 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                              <h4 className="font-medium">{item.name}</h4>
                              {item.description && (
                                <p className="text-sm text-gray-600">{item.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`item-${item.id}-ok`} 
                                  checked={itemResults[item.id]?.status === "ok"}
                                  onCheckedChange={() => updateItemStatus(item.id, "ok")}
                                  className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                                />
                                <label
                                  htmlFor={`item-${item.id}-ok`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  OK
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`item-${item.id}-issue`} 
                                  checked={itemResults[item.id]?.status === "issue"}
                                  onCheckedChange={() => updateItemStatus(item.id, "issue")}
                                  className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                                />
                                <label
                                  htmlFor={`item-${item.id}-issue`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Problema
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`item-${item.id}-na`} 
                                  checked={itemResults[item.id]?.status === "not_applicable"}
                                  onCheckedChange={() => updateItemStatus(item.id, "not_applicable")}
                                  className="data-[state=checked]:bg-gray-500 data-[state=checked]:border-gray-500"
                                />
                                <label
                                  htmlFor={`item-${item.id}-na`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  N/A
                                </label>
                              </div>
                            </div>
                          </div>
                          
                          {itemResults[item.id]?.status === "issue" && (
                            <div className="space-y-3">
                              <Textarea 
                                placeholder="Descreva o problema encontrado" 
                                value={itemResults[item.id]?.observation || ""}
                                onChange={(e) => updateItemObservation(item.id, e.target.value)}
                                className="h-20"
                              />
                              <div>
                                <Label htmlFor={`photo-${item.id}`} className="mb-2 block">
                                  Foto (opcional)
                                </Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    id={`photo-${item.id}`}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handlePhotoUpload(item.id, e)}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => document.getElementById(`photo-${item.id}`)?.click()}
                                    className="text-blue-700"
                                  >
                                    <Camera className="h-4 w-4 mr-2" />
                                    {itemResults[item.id]?.photo ? "Alterar Foto" : "Adicionar Foto"}
                                  </Button>
                                  {itemResults[item.id]?.photo && (
                                    <span className="text-sm text-green-600">
                                      Foto selecionada: {itemResults[item.id]?.photo?.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          onClick={handleBack}
        >
          {step === 1 ? "Cancelar" : "Voltar"}
        </Button>
        <Button 
          onClick={handleNext}
          className="bg-blue-800 hover:bg-blue-700"
          disabled={isLoading || isSaving}
        >
          {isSaving ? (
            "Salvando..."
          ) : step === 1 ? (
            <>
              Próximo
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          ) : (
            "Finalizar Checklist"
          )}
        </Button>
      </div>
    </div>
  );
}