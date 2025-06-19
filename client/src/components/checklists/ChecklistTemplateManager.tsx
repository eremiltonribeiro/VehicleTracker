import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  ArrowLeft,
  Settings,
  List,
  CheckCircle,
  FileText,
  Copy,
  Eye,
  GripVertical,
  Star,
  AlertTriangle,
} from "lucide-react";

// Schemas
const templateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  isDefault: z.boolean().optional(),
});

const itemSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  category: z.string().min(1, "Categoria é obrigatória"),
  isRequired: z.boolean(),
  order: z.number().min(0),
});

type TemplateFormData = z.infer<typeof templateSchema>;
type ItemFormData = z.infer<typeof itemSchema>;

interface Template {
  id: number;
  name: string;
  description?: string;
  isDefault: boolean;
  createdAt: string;
}

interface TemplateItem {
  id: number;
  templateId: number;
  name: string;
  description?: string;
  isRequired: boolean;
  category: string;
  order: number;
}

const categories = [
  { id: "geral", name: "Geral" },
  { id: "exterior", name: "Exterior" },
  { id: "interior", name: "Interior" },
  { id: "motor", name: "Motor" },
  { id: "pneus", name: "Pneus e Rodas" },
  { id: "luzes", name: "Luzes e Sinalização" },
  { id: "documentacao", name: "Documentação" },
  { id: "seguranca", name: "Segurança" },
];

function ChecklistTemplateManager() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showDeleteTemplateDialog, setShowDeleteTemplateDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<TemplateItem | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<TemplateItem | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Forms
  const templateForm = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      description: "",
      isDefault: false,
    },
  });

  const itemForm = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "geral",
      isRequired: true,
      order: 0,
    },
  });

  // Queries
  const { data: templates = [], isLoading: templatesLoading } = useQuery<Template[]>({
    queryKey: ["/api/checklist-templates"],
    queryFn: async () => {
      const response = await fetch("/api/checklist-templates");
      if (!response.ok) throw new Error("Erro ao carregar templates");
      return response.json();
    },
  });

  const { data: templateItems = [] } = useQuery<TemplateItem[]>({
    queryKey: ["/api/checklist-templates", selectedTemplate?.id || "none", "items"],
    queryFn: async () => {
      if (!selectedTemplate?.id) return [];
      const response = await fetch(`/api/checklist-templates/${selectedTemplate.id}/items`);
      if (!response.ok) throw new Error("Erro ao carregar itens");
      return response.json();
    },
    enabled: !!selectedTemplate?.id,
  });

  // Mutations
  const createTemplateMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      const response = await fetch("/api/checklist-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Erro ao criar template");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-templates"] });
      toast({ title: "Sucesso!", description: "Template criado com sucesso." });
      setShowTemplateDialog(false);
      templateForm.reset();
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao criar template.", variant: "destructive" });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: TemplateFormData }) => {
      const response = await fetch(`/api/checklist-templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Erro ao atualizar template");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-templates"] });
      toast({ title: "Sucesso!", description: "Template atualizado com sucesso." });
      setShowTemplateDialog(false);
      templateForm.reset();
      setSelectedTemplate(null);
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao atualizar template.", variant: "destructive" });
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: ItemFormData & { templateId: number }) => {
      const response = await fetch("/api/checklist-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Erro ao criar item");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/checklist-templates", selectedTemplate?.id || "none", "items"] 
      });
      toast({ title: "Sucesso!", description: "Item criado com sucesso." });
      setShowItemDialog(false);
      itemForm.reset();
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao criar item.", variant: "destructive" });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ItemFormData }) => {
      const response = await fetch(`/api/checklist-items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Erro ao atualizar item");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/checklist-templates", selectedTemplate?.id || "none", "items"] 
      });
      toast({ title: "Sucesso!", description: "Item atualizado com sucesso." });
      setShowItemDialog(false);
      itemForm.reset();
      setEditingItem(null);
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao atualizar item.", variant: "destructive" });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/checklist-items/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erro ao excluir item");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/checklist-templates", selectedTemplate?.id || "none", "items"] 
      });
      toast({ title: "Sucesso!", description: "Item excluído com sucesso." });
      setShowDeleteDialog(false);
      setItemToDelete(null);
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao excluir item.", variant: "destructive" });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/checklist-templates/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erro ao excluir template");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-templates"] });
      toast({ title: "Sucesso!", description: "Template excluído com sucesso." });
      setShowDeleteTemplateDialog(false);
      setTemplateToDelete(null);
      if (selectedTemplate?.id === templateToDelete?.id) {
        setSelectedTemplate(null);
      }
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao excluir template.", variant: "destructive" });
    },
  });

  const duplicateTemplateMutation = useMutation({
    mutationFn: async (template: Template) => {
      // Criar o template duplicado
      const templateResponse = await fetch("/api/checklist-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${template.name} (Cópia)`,
          description: template.description,
          isDefault: false,
        }),
      });
      if (!templateResponse.ok) throw new Error("Erro ao duplicar template");
      const newTemplate = await templateResponse.json();

      // Obter itens do template original
      const itemsResponse = await fetch(`/api/checklist-templates/${template.id}/items`);
      if (!itemsResponse.ok) throw new Error("Erro ao obter itens do template");
      const items = await itemsResponse.json();

      // Criar os itens para o novo template
      await Promise.all(
        items.map(async (item: TemplateItem) => {
          await fetch("/api/checklist-items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: item.name,
              category: item.category,
              isRequired: item.isRequired,
              order: item.order,
              templateId: newTemplate.id,
            }),
          });
        })
      );

      return newTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-templates"] });
      toast({ title: "Sucesso!", description: "Template duplicado com sucesso." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao duplicar template.", variant: "destructive" });
    },
  });

  // Handlers
  const handleTemplateSubmit = (data: TemplateFormData) => {
    if (selectedTemplate) {
      updateTemplateMutation.mutate({ id: selectedTemplate.id, data });
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  const handleItemSubmit = (data: ItemFormData) => {
    if (!selectedTemplate) return;
    
    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data });
    } else {
      const maxOrder = Math.max(...templateItems.map(item => item.order), -1);
      createItemMutation.mutate({ 
        ...data, 
        templateId: selectedTemplate.id,
        order: maxOrder + 1 
      });
    }
  };

  const openTemplateDialog = (template?: Template) => {
    if (template) {
      setSelectedTemplate(template);
      templateForm.reset({
        name: template.name,
        description: template.description || "",
        isDefault: template.isDefault,
      });
    } else {
      setSelectedTemplate(null);
      templateForm.reset({
        name: "",
        description: "",
        isDefault: false,
      });
    }
    setShowTemplateDialog(true);
  };

  const openItemDialog = (item?: TemplateItem) => {
    if (item) {
      setEditingItem(item);
      itemForm.reset({
        name: item.name,
        description: item.description || "",
        category: item.category,
        isRequired: item.isRequired,
        order: item.order,
      });
    } else {
      setEditingItem(null);
      itemForm.reset({
        name: "",
        description: "",
        category: "geral",
        isRequired: true,
        order: 0,
      });
    }
    setShowItemDialog(true);
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || categoryId;
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const filteredItems = templateItems.filter((item) => {
    if (selectedCategory === "all") return true;
    return item.category === selectedCategory;
  });

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, TemplateItem[]>);

  return (
    <div className="space-y-6 pb-8">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/checklists")}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-blue-900">Templates de Checklist</h2>
              <p className="text-gray-600 text-sm mt-1">
                Gerencie os modelos de checklist para seus veículos
              </p>
            </div>
          </div>
          <Button onClick={() => openTemplateDialog()} className="bg-blue-700 hover:bg-blue-800">
            <Plus className="mr-2 h-4 w-4" />
            Novo Template
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
          {selectedTemplate && (
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {templatesLoading ? (
              <div className="text-center py-8">Carregando templates...</div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="mb-2">Nenhum template encontrado</p>
                <Button onClick={() => openTemplateDialog()} variant="outline">
                  Criar Primeiro Template
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{template.name}</h3>
                          {template.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Padrão
                            </Badge>
                          )}
                        </div>
                        {template.description && (
                          <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          Criado em {new Date(template.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTemplate(template);
                            setShowPreviewDialog(true);
                          }}
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateTemplateMutation.mutate(template);
                          }}
                          title="Duplicar"
                          disabled={duplicateTemplateMutation.isPending}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openTemplateDialog(template);
                          }}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTemplateToDelete(template);
                            setShowDeleteTemplateDialog(true);
                          }}
                          className="text-red-600"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Itens do Template Selecionado */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <List className="h-5 w-5" />
                Itens do Template
                {selectedTemplate && <span className="text-sm font-normal">({selectedTemplate.name})</span>}
              </CardTitle>
              {selectedTemplate && (
                <Button onClick={() => openItemDialog()} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Item
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedTemplate ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Selecione um template para ver seus itens</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <List className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="mb-2">Nenhum item encontrado</p>
                {selectedCategory !== "all" ? (
                  <Button onClick={() => setSelectedCategory("all")} variant="outline">
                    Ver Todos os Itens
                  </Button>
                ) : (
                  <Button onClick={() => openItemDialog()} variant="outline">
                    Adicionar Primeiro Item
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedItems)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([categoryId, items]) => (
                    <div key={categoryId} className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-700 flex items-center gap-2">
                        {getCategoryName(categoryId)}
                        <Badge variant="outline" className="text-xs">
                          {items.length}
                        </Badge>
                      </h4>
                      <div className="space-y-1 pl-4 border-l-2 border-gray-100">
                        {items
                          .sort((a, b) => a.order - b.order)
                          .map((item) => (
                            <div
                              key={item.id}
                              className="p-3 border rounded-lg flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <div className="cursor-move text-gray-400">
                                  <GripVertical className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h5 className="font-medium text-sm">{item.name}</h5>
                                    {item.isRequired && (
                                      <Badge variant="outline" className="text-xs">
                                        Obrigatório
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    Ordem: {item.order + 1}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openItemDialog(item)}
                                  title="Editar"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setItemToDelete(item);
                                    setShowDeleteDialog(true);
                                  }}
                                  className="text-red-600"
                                  title="Excluir"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Template */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? "Editar Template" : "Novo Template"}
            </DialogTitle>
          </DialogHeader>
          <Form {...templateForm}>
            <form onSubmit={templateForm.handleSubmit(handleTemplateSubmit)} className="space-y-4">
              <FormField
                control={templateForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Inspeção Diária" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={templateForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descrição do template..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={templateForm.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Template padrão</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowTemplateDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {createTemplateMutation.isPending || updateTemplateMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog Item */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar Item" : "Novo Item"}
            </DialogTitle>
          </DialogHeader>
          <Form {...itemForm}>
            <form onSubmit={itemForm.handleSubmit(handleItemSubmit)} className="space-y-4">
              <FormField
                control={itemForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Verificar nível de óleo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={itemForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Instruções ou observações sobre este item..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={itemForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={itemForm.control}
                name="isRequired"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Item obrigatório</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowItemDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createItemMutation.isPending || updateItemMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {createItemMutation.isPending || updateItemMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog Delete Template */}
      <Dialog open={showDeleteTemplateDialog} onOpenChange={setShowDeleteTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirmar Exclusão do Template
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o template "{templateToDelete?.name}"?
              <br />
              <strong>Esta ação irá excluir permanentemente:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>O template e todos os seus itens</li>
                <li>Não afetará checklists já criados</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteTemplateDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => templateToDelete && deleteTemplateMutation.mutate(templateToDelete.id)}
              disabled={deleteTemplateMutation.isPending}
            >
              {deleteTemplateMutation.isPending ? "Excluindo..." : "Excluir Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Preview Template */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Prévia do Template: {selectedTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              Visualize como este template aparecerá durante a inspeção
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {selectedTemplate && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">{selectedTemplate.name}</h3>
                  {selectedTemplate.description && (
                    <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
                  )}
                </div>
                
                {Object.entries(groupedItems).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(groupedItems)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([categoryId, items]) => (
                        <div key={categoryId} className="border rounded-lg p-4">
                          <h4 className="font-medium mb-3 text-blue-900">
                            {getCategoryName(categoryId)}
                          </h4>
                          <div className="space-y-2">
                            {items
                              .sort((a, b) => a.order - b.order)
                              .map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-2 bg-white border rounded">
                                  <div className="flex items-center gap-3">
                                    <div className="flex gap-2">
                                      <button className="w-6 h-6 border-2 border-green-500 rounded bg-green-50"></button>
                                      <button className="w-6 h-6 border-2 border-red-500 rounded bg-red-50"></button>
                                    </div>
                                    <span className="text-sm">{item.name}</span>
                                    {item.isRequired && (
                                      <Badge variant="outline" className="text-xs">
                                        Obrigatório
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <List className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Este template não possui itens</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPreviewDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Delete Item */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o item "{itemToDelete?.name}"?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => itemToDelete && deleteItemMutation.mutate(itemToDelete.id)}
              disabled={deleteItemMutation.isPending}
            >
              {deleteItemMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ChecklistTemplateManager;
