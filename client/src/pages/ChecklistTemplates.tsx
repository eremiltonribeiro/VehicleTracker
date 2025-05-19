import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2, Plus, X, Check } from "lucide-react";

// Tipos para os templates de checklist
interface ChecklistItem {
  id: string;
  description: string;
  required: boolean;
  category: string;
}

interface ChecklistTemplate {
  id: string;
  name: string;
  description: string;
  items: ChecklistItem[];
}

export default function ChecklistTemplates() {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemCategory, setItemCategory] = useState("geral");
  const [itemRequired, setItemRequired] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Categorias padrão para os itens de checklist
  const categories = [
    { id: "geral", name: "Geral" },
    { id: "exterior", name: "Exterior" },
    { id: "interior", name: "Interior" },
    { id: "motor", name: "Motor" },
    { id: "pneus", name: "Pneus e Rodas" },
    { id: "luzes", name: "Luzes e Sinalização" },
    { id: "documentacao", name: "Documentação" },
    { id: "seguranca", name: "Segurança" }
  ];

  // Carregar templates de checklist
  useEffect(() => {
    loadTemplates();
  }, []);

  // Função para carregar os templates do localStorage
  const loadTemplates = () => {
    setIsLoading(true);
    const storedTemplates = JSON.parse(localStorage.getItem("checklistTemplates") || "[]");
    
    if (storedTemplates.length > 0) {
      setTemplates(storedTemplates);
    } else {
      // Criar templates padrão se não existirem
      const defaultTemplates: ChecklistTemplate[] = [
        {
          id: "1",
          name: "Inspeção Diária",
          description: "Checklist básico para verificação diária dos veículos",
          items: [
            { id: "1", description: "Nível de combustível", required: true, category: "geral" },
            { id: "2", description: "Pressão dos pneus", required: true, category: "pneus" },
            { id: "3", description: "Luzes de sinalização", required: true, category: "luzes" },
            { id: "4", description: "Documentação do veículo", required: true, category: "documentacao" }
          ]
        },
        {
          id: "2",
          name: "Manutenção Preventiva",
          description: "Checklist completo para manutenção mensal",
          items: [
            { id: "1", description: "Nível de óleo", required: true, category: "motor" },
            { id: "2", description: "Nível de água do radiador", required: true, category: "motor" },
            { id: "3", description: "Desgaste das pastilhas de freio", required: true, category: "seguranca" },
            { id: "4", description: "Condição das correias", required: false, category: "motor" },
            { id: "5", description: "Alinhamento e balanceamento", required: false, category: "pneus" }
          ]
        }
      ];
      
      setTemplates(defaultTemplates);
      localStorage.setItem("checklistTemplates", JSON.stringify(defaultTemplates));
    }
    
    setIsLoading(false);
  };

  // Função para abrir o diálogo de criação/edição de template
  const openTemplateDialog = (template?: ChecklistTemplate) => {
    if (template) {
      setSelectedTemplate(template);
      setTemplateName(template.name);
      setTemplateDescription(template.description);
    } else {
      setSelectedTemplate(null);
      setTemplateName("");
      setTemplateDescription("");
    }
    setFormErrors({});
    setIsDialogOpen(true);
  };

  // Função para abrir o diálogo de criação/edição de item
  const openItemDialog = (template: ChecklistTemplate, item?: ChecklistItem) => {
    setSelectedTemplate(template);
    if (item) {
      setSelectedItem(item);
      setItemDescription(item.description);
      setItemCategory(item.category);
      setItemRequired(item.required);
    } else {
      setSelectedItem(null);
      setItemDescription("");
      setItemCategory("geral");
      setItemRequired(true);
    }
    setFormErrors({});
    setIsItemDialogOpen(true);
  };

  // Validar formulário de template
  const validateTemplateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!templateName.trim()) {
      errors.name = "Nome do template é obrigatório";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validar formulário de item
  const validateItemForm = () => {
    const errors: Record<string, string> = {};
    
    if (!itemDescription.trim()) {
      errors.description = "Descrição do item é obrigatória";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Salvar template
  const handleSaveTemplate = () => {
    if (!validateTemplateForm()) return;
    
    if (selectedTemplate) {
      // Edição de template existente
      const updatedTemplates = templates.map(t => {
        if (t.id === selectedTemplate.id) {
          return {
            ...t,
            name: templateName,
            description: templateDescription
          };
        }
        return t;
      });
      
      setTemplates(updatedTemplates);
      localStorage.setItem("checklistTemplates", JSON.stringify(updatedTemplates));
      
      toast({
        title: "Template atualizado",
        description: `O template "${templateName}" foi atualizado com sucesso.`
      });
    } else {
      // Novo template
      const newTemplate: ChecklistTemplate = {
        id: Date.now().toString(),
        name: templateName,
        description: templateDescription,
        items: []
      };
      
      const updatedTemplates = [...templates, newTemplate];
      setTemplates(updatedTemplates);
      localStorage.setItem("checklistTemplates", JSON.stringify(updatedTemplates));
      
      toast({
        title: "Template criado",
        description: `O template "${templateName}" foi criado com sucesso.`
      });
    }
    
    setIsDialogOpen(false);
  };

  // Salvar item
  const handleSaveItem = () => {
    if (!validateItemForm() || !selectedTemplate) return;
    
    const templateIndex = templates.findIndex(t => t.id === selectedTemplate.id);
    if (templateIndex === -1) return;
    
    if (selectedItem) {
      // Edição de item existente
      const updatedTemplate = {
        ...selectedTemplate,
        items: selectedTemplate.items.map(item => {
          if (item.id === selectedItem.id) {
            return {
              ...item,
              description: itemDescription,
              category: itemCategory,
              required: itemRequired
            };
          }
          return item;
        })
      };
      
      const updatedTemplates = [...templates];
      updatedTemplates[templateIndex] = updatedTemplate;
      
      setTemplates(updatedTemplates);
      localStorage.setItem("checklistTemplates", JSON.stringify(updatedTemplates));
      
      toast({
        title: "Item atualizado",
        description: "O item de checklist foi atualizado com sucesso."
      });
    } else {
      // Novo item
      const newItem: ChecklistItem = {
        id: Date.now().toString(),
        description: itemDescription,
        category: itemCategory,
        required: itemRequired
      };
      
      const updatedTemplate = {
        ...selectedTemplate,
        items: [...selectedTemplate.items, newItem]
      };
      
      const updatedTemplates = [...templates];
      updatedTemplates[templateIndex] = updatedTemplate;
      
      setTemplates(updatedTemplates);
      localStorage.setItem("checklistTemplates", JSON.stringify(updatedTemplates));
      
      toast({
        title: "Item adicionado",
        description: "O novo item foi adicionado ao checklist com sucesso."
      });
    }
    
    setIsItemDialogOpen(false);
  };

  // Excluir template
  const handleDeleteTemplate = (templateId: string) => {
    // Verificar se há checklists usando este template
    // (Em um sistema real, verificaria no backend)
    const confirmDelete = window.confirm("Tem certeza que deseja excluir este template de checklist?");
    
    if (confirmDelete) {
      const updatedTemplates = templates.filter(t => t.id !== templateId);
      setTemplates(updatedTemplates);
      localStorage.setItem("checklistTemplates", JSON.stringify(updatedTemplates));
      
      toast({
        title: "Template excluído",
        description: "O template de checklist foi excluído com sucesso."
      });
    }
  };

  // Excluir item
  const handleDeleteItem = (templateId: string, itemId: string) => {
    const confirmDelete = window.confirm("Tem certeza que deseja excluir este item de checklist?");
    
    if (confirmDelete) {
      const templateIndex = templates.findIndex(t => t.id === templateId);
      if (templateIndex === -1) return;
      
      const updatedTemplate = {
        ...templates[templateIndex],
        items: templates[templateIndex].items.filter(item => item.id !== itemId)
      };
      
      const updatedTemplates = [...templates];
      updatedTemplates[templateIndex] = updatedTemplate;
      
      setTemplates(updatedTemplates);
      localStorage.setItem("checklistTemplates", JSON.stringify(updatedTemplates));
      
      toast({
        title: "Item excluído",
        description: "O item de checklist foi excluído com sucesso."
      });
    }
  };

  // Obter nome da categoria a partir do ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-blue-900">Templates de Checklist</h2>
        <Button 
          onClick={() => openTemplateDialog()}
          className="bg-blue-700 hover:bg-blue-800"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Novo Template
        </Button>
      </div>
      
      {isLoading ? (
        <div className="text-center py-4">Carregando templates...</div>
      ) : (
        <div className="space-y-6">
          {templates.map(template => (
            <Card key={template.id} className="overflow-hidden border-2 border-gray-200">
              <CardHeader className="bg-blue-50 pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-medium">{template.name}</CardTitle>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => openTemplateDialog(template)}
                    className="h-8 text-blue-700"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar Template
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="h-8 text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-4 flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Itens do Checklist ({template.items.length})
                  </h3>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => openItemDialog(template)}
                    className="h-8 text-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Item
                  </Button>
                </div>
                
                {template.items.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    Este template ainda não possui itens. Adicione itens para personalizar o checklist.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-10">Req.</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {template.items.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {item.required ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <X className="h-4 w-4 text-gray-400" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{item.description}</TableCell>
                          <TableCell>{getCategoryName(item.category)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => openItemDialog(template, item)}
                                className="h-8 w-8 text-blue-700"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDeleteItem(template.id, item.id)}
                                className="h-8 w-8 text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ))}
          
          {templates.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhum template de checklist encontrado.</p>
              <p className="mt-2">Clique em "Novo Template" para criar o primeiro template de checklist.</p>
            </div>
          )}
        </div>
      )}
      
      {/* Diálogo de template */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? "Editar Template" : "Novo Template de Checklist"}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate
                ? "Atualize as informações do template de checklist."
                : "Preencha as informações para criar um novo template de checklist."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="templateName">Nome do Template</Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Ex: Inspeção Diária"
              />
              {formErrors.name && (
                <p className="text-sm text-red-500">{formErrors.name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="templateDescription">Descrição</Label>
              <Input
                id="templateDescription"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Ex: Checklist para inspeção diária dos veículos"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveTemplate}
              className="bg-blue-700 hover:bg-blue-800"
            >
              {selectedTemplate ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de item */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? "Editar Item" : "Novo Item de Checklist"}
            </DialogTitle>
            <DialogDescription>
              {selectedItem
                ? "Atualize as informações do item de checklist."
                : "Preencha as informações para adicionar um novo item ao checklist."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="itemDescription">Descrição do Item</Label>
              <Input
                id="itemDescription"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                placeholder="Ex: Verificar pressão dos pneus"
              />
              {formErrors.description && (
                <p className="text-sm text-red-500">{formErrors.description}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="itemCategory">Categoria</Label>
              <select
                id="itemCategory"
                value={itemCategory}
                onChange={(e) => setItemCategory(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="itemRequired"
                checked={itemRequired}
                onCheckedChange={(checked) => 
                  setItemRequired(checked === true)
                }
              />
              <Label
                htmlFor="itemRequired"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Item obrigatório
              </Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsItemDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveItem}
              className="bg-blue-700 hover:bg-blue-800"
            >
              {selectedItem ? "Atualizar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}