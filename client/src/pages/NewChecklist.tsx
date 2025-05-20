import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Save, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";

// Interfaces para os dados
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

// Esquema de validação para o formulário básico
const baseFormSchema = z.object({
  vehicleId: z.string().min(1, "Selecione um veículo"),
  driverId: z.string().min(1, "Selecione um motorista"),
  templateId: z.string().min(1, "Selecione um modelo de checklist"),
  odometer: z.string().min(1, "Informe a quilometragem"),
  observations: z.string().optional(),
});

// Componente principal
export default function NewChecklist() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<"info" | "items">("info");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<{ [key: number]: { status: string; observation: string | null; photoUrl: string | null } }>({});
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [baseFormComplete, setBaseFormComplete] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [issueObservation, setIssueObservation] = useState("");
  
  // Inicializar o formulário
  const form = useForm<z.infer<typeof baseFormSchema>>({
    resolver: zodResolver(baseFormSchema),
    defaultValues: {
      vehicleId: "",
      driverId: "",
      templateId: "",
      odometer: "",
      observations: "",
    },
  });
  
  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);
  
  // Carregar dados quando o template muda
  useEffect(() => {
    const templateId = form.watch("templateId");
    if (templateId) {
      loadTemplateItems(parseInt(templateId));
    }
  }, [form.watch("templateId")]);
  
  // Função para carregar os dados iniciais
  const loadInitialData = async () => {
    setIsLoading(true);
    
    try {
      // Carregar veículos da API
      const vehiclesResponse = await fetch('/api/vehicles');
      if (!vehiclesResponse.ok) {
        throw new Error('Erro ao carregar veículos');
      }
      const vehiclesData = await vehiclesResponse.json();
      setVehicles(vehiclesData);
      
      // Carregar motoristas da API
      const driversResponse = await fetch('/api/drivers');
      if (!driversResponse.ok) {
        throw new Error('Erro ao carregar motoristas');
      }
      const driversData = await driversResponse.json();
      setDrivers(driversData);
      
      // Carregar templates de checklist da API
      const templatesResponse = await fetch('/api/checklist-templates');
      if (!templatesResponse.ok) {
        throw new Error('Erro ao carregar templates');
      }
      const templatesData = await templatesResponse.json();
      setTemplates(templatesData);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar os dados necessários. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para carregar os itens do template selecionado
  const loadTemplateItems = async (templateId: number) => {
    try {
      // Carregar itens do template da API
      const response = await fetch(`/api/checklist-templates/${templateId}/items`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar itens do template');
      }
      
      const items: ChecklistItem[] = await response.json();
      
      setItems(items);
      
      // Inicializar resultados como vazios
      const initialResults: { [key: number]: { status: string; observation: string | null; photoUrl: string | null } } = {};
      items.forEach(item => {
        initialResults[item.id] = { status: "", observation: null, photoUrl: null };
      });
      
      setResults(initialResults);
    } catch (error) {
      console.error('Erro ao carregar itens do template:', error);
      toast({
        title: "Erro ao carregar itens",
        description: "Não foi possível carregar os itens do checklist. Tente novamente.",
        variant: "destructive",
      });
      
      // Em caso de erro, definir uma lista vazia
      setItems([]);
      setResults({});
    }
  };
  
  // Voltar para a página de checklists
  const handleBack = () => {
    setLocation("/checklists");
  };
  
  // Enviar o formulário
  const onSubmit = async (data: z.infer<typeof baseFormSchema>) => {
    // Se estivermos na primeira etapa, avançar para a segunda
    if (selectedTab === "info") {
      setBaseFormComplete(true);
      setSelectedTab("items");
      return;
    }
    
    // Verificar se todos os itens obrigatórios foram avaliados
    const requiredItems = items.filter(item => item.isRequired);
    const missingItems = requiredItems.filter(item => !results[item.id].status);
    
    if (missingItems.length > 0) {
      toast({
        title: "Checklist incompleto",
        description: `Existem ${missingItems.length} itens obrigatórios não avaliados.`,
        variant: "destructive",
      });
      return;
    }
    
    // Se todos os itens obrigatórios foram avaliados, enviar o checklist
    setIsSubmitting(true);
    
    try {
      // Criar objeto com os dados do checklist
      const checklistData = {
        vehicleId: parseInt(data.vehicleId),
        driverId: parseInt(data.driverId),
        templateId: parseInt(data.templateId),
        odometer: parseInt(data.odometer),
        observations: data.observations || null,
        date: new Date(),
        status: "pending", // Status inicial
        photoUrl: null,
        results: Object.entries(results).map(([itemId, result]) => ({
          itemId: parseInt(itemId),
          status: result.status || "not_applicable",
          observation: result.observation,
          photoUrl: result.photoUrl,
        })),
      };
      
      console.log("Enviando checklist:", checklistData);
      
      // Enviar para a API
      const response = await fetch("/api/checklists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checklistData),
      });
      
      toast({
        title: "Checklist salvo com sucesso!",
        description: "O checklist foi registrado no sistema.",
      });
      
      // Redirecionar para a página de checklists
      setLocation("/checklists");
    } catch (error) {
      console.error("Erro ao salvar checklist:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o checklist. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Atualizar o status de um item
  const updateItemStatus = (itemId: number, status: string) => {
    setResults(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        status,
      },
    }));
  };
  
  // Abrir o diálogo para reportar um problema
  const openIssueDialog = (item: ChecklistItem) => {
    setSelectedItem(item);
    setIssueObservation("");
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoDialogOpen(true);
  };
  
  // Salvar os detalhes do problema
  const saveIssueDetails = () => {
    if (!selectedItem) return;
    
    setResults(prev => ({
      ...prev,
      [selectedItem.id]: {
        ...prev[selectedItem.id],
        status: "issue",
        observation: issueObservation || null,
        photoUrl: photoPreview,
      },
    }));
    
    setPhotoDialogOpen(false);
  };
  
  // Manipular o upload de foto
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setPhotoFile(file);
    
    // Criar preview da imagem
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Agrupar itens por categoria
  const getItemsByCategory = () => {
    const categories: Record<string, ChecklistItem[]> = {};
    
    items.forEach(item => {
      const category = item.category || "Sem categoria";
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(item);
    });
    
    return categories;
  };
  
  // Verificar se todos os itens foram avaliados
  const allItemsChecked = () => {
    const requiredItems = items.filter(item => item.isRequired);
    return requiredItems.every(item => results[item.id]?.status);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="text-center">
          <div className="mb-4">Carregando...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-8 w-8 text-blue-700 mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold text-blue-900">Novo Checklist</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={selectedTab === "info" ? "default" : "outline"}
            onClick={() => setSelectedTab("info")}
            className={selectedTab === "info" ? "bg-blue-700" : "text-blue-700 border-blue-700"}
          >
            1. Informações Básicas
          </Button>
          <Button
            variant={selectedTab === "items" ? "default" : "outline"}
            onClick={() => baseFormComplete && setSelectedTab("items")}
            disabled={!baseFormComplete}
            className={selectedTab === "items" ? "bg-blue-700" : "text-blue-700 border-blue-700"}
          >
            2. Itens do Checklist
          </Button>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {selectedTab === "info" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Informações do Checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              <SelectValue placeholder="Selecione um veículo" />
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
                        <FormLabel>Motorista</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um motorista" />
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
                </div>
                
                <FormField
                  control={form.control}
                  name="templateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo de Checklist</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um modelo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {templates.map((template) => (
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
                        <Input type="number" placeholder="Ex: 12345" {...field} />
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
                          placeholder="Observações adicionais sobre o veículo ou checklist" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}
          
          {selectedTab === "items" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Itens do Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    Nenhum item encontrado para este modelo de checklist.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(getItemsByCategory()).map(([category, categoryItems]) => (
                      <div key={category} className="space-y-3">
                        <h3 className="font-medium text-blue-900">{category}</h3>
                        <div className="overflow-auto rounded-lg border">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gray-50">
                                <TableHead className="font-medium">Item</TableHead>
                                <TableHead className="font-medium">Obrigatório</TableHead>
                                <TableHead className="font-medium">Status</TableHead>
                                <TableHead className="font-medium">Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {categoryItems.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium">{item.name}</p>
                                      {item.description && (
                                        <p className="text-sm text-gray-500">{item.description}</p>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {item.isRequired ? "Sim" : "Não"}
                                  </TableCell>
                                  <TableCell>
                                    <RadioGroup
                                      value={results[item.id]?.status || ""}
                                      onValueChange={(value) => updateItemStatus(item.id, value)}
                                      className="flex space-x-4"
                                    >
                                      <div className="flex items-center space-x-1">
                                        <RadioGroupItem 
                                          value="ok" 
                                          id={`ok-${item.id}`} 
                                          className="text-green-600" 
                                        />
                                        <label 
                                          htmlFor={`ok-${item.id}`}
                                          className="text-sm cursor-pointer"
                                        >
                                          OK
                                        </label>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <RadioGroupItem 
                                          value="issue" 
                                          id={`issue-${item.id}`} 
                                          className="text-red-600"
                                        />
                                        <label
                                          htmlFor={`issue-${item.id}`}
                                          className="text-sm cursor-pointer"
                                        >
                                          Problema
                                        </label>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <RadioGroupItem 
                                          value="not_applicable" 
                                          id={`na-${item.id}`}
                                          className="text-yellow-600"
                                        />
                                        <label
                                          htmlFor={`na-${item.id}`}
                                          className="text-sm cursor-pointer"
                                        >
                                          N/A
                                        </label>
                                      </div>
                                    </RadioGroup>
                                  </TableCell>
                                  <TableCell>
                                    {results[item.id]?.status === "issue" && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openIssueDialog(item)}
                                        className="text-red-600 border-red-600"
                                      >
                                        Detalhar Problema
                                      </Button>
                                    )}
                                    {results[item.id]?.status === "issue" && results[item.id]?.observation && (
                                      <div className="mt-1 text-xs text-red-600">
                                        {results[item.id]?.observation}
                                      </div>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
              className="text-blue-700 border-blue-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            
            {selectedTab === "info" ? (
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-700 hover:bg-blue-800"
              >
                Próximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                type="submit"
                disabled={isSubmitting || !allItemsChecked()}
                className="bg-blue-700 hover:bg-blue-800"
              >
                {isSubmitting ? "Salvando..." : "Salvar Checklist"}
                {isSubmitting ? null : <Save className="ml-2 h-4 w-4" />}
              </Button>
            )}
          </div>
        </form>
      </Form>
      
      {/* Diálogo para reportar um problema */}
      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhar Problema</DialogTitle>
            <DialogDescription>
              Adicione uma descrição e foto do problema encontrado.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="observation" className="text-sm font-medium">
                Descrição do Problema
              </label>
              <Textarea
                id="observation"
                placeholder="Descreva o problema encontrado..."
                value={issueObservation}
                onChange={(e) => setIssueObservation(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="photo" className="text-sm font-medium">
                Foto do Problema (opcional)
              </label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
              />
              
              {photoPreview && (
                <div className="mt-2">
                  <p className="text-sm mb-1">Preview:</p>
                  <div className="relative w-full h-40 bg-gray-100 rounded-md overflow-hidden">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setPhotoDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={saveIssueDetails}
              className="bg-blue-700 hover:bg-blue-800"
            >
              Salvar Detalhes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}