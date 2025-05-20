import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Truck, CheckCircle2, XCircle, AlertTriangle, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChecklistItem {
  id: number;
  templateId: number;
  name: string;
  description: string | null;
  isRequired: boolean;
  category: string | null;
  order: number | null;
}

interface ChecklistResult {
  id: number;
  checklistId: number;
  itemId: number;
  status: "ok" | "issue" | "not_applicable";
  observation: string | null;
  photoUrl: string | null;
}

interface VehicleChecklist {
  id: number;
  vehicleId: number;
  driverId: number;
  templateId: number;
  date: string;
  observations: string | null;
  odometer: number;
  status: "pending" | "complete" | "failed";
  photoUrl: string | null;
  vehicle: {
    name: string;
    plate: string;
  };
  driver: {
    name: string;
  };
  template: {
    name: string;
  };
  results: ChecklistResult[];
  items: ChecklistItem[];
}

export default function ChecklistDetails() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [checklist, setChecklist] = useState<VehicleChecklist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Função para navegação
  const navigate = (path: string) => setLocation(path);
  
  useEffect(() => {
    if (id) {
      loadChecklistData(id);
    }
  }, [id]);
  
  const loadChecklistData = async (checklistId: string) => {
    setIsLoading(true);
    
    try {
      console.log("Carregando checklist ID:", checklistId);
      
      // Buscar dados do checklist da API
      const response = await fetch(`/api/checklists/${checklistId}`);
      
      if (!response.ok) {
        console.error("Falha ao carregar checklist:", response.status, response.statusText);
        throw new Error('Erro ao carregar dados do checklist');
      }
      
      const checklistData = await response.json();
      console.log("Dados do checklist:", checklistData);
      
      // Verificar se há dados válidos e templateId
      if (!checklistData) {
        throw new Error('Dados do checklist inválidos');
      }
      
      // Se o template não existir, definir um padrão
      if (!checklistData.template) {
        checklistData.template = { name: "Sem modelo" };
      }
      
      // Se o veículo não existir, definir um padrão
      if (!checklistData.vehicle) {
        checklistData.vehicle = { name: "Veículo desconhecido", plate: "N/A" };
      }
      
      // Se o motorista não existir, definir um padrão
      if (!checklistData.driver) {
        checklistData.driver = { name: "Motorista desconhecido" };
      }
      
      let resultsData: ChecklistResult[] = [];
      let itemsData: ChecklistItem[] = [];
      
      // Buscar os resultados do checklist se possível
      try {
        const resultsResponse = await fetch(`/api/checklists/${checklistId}/results`);
        
        if (resultsResponse.ok) {
          resultsData = await resultsResponse.json();
          console.log("Resultados carregados:", resultsData.length);
        }
      } catch (error) {
        console.warn("Erro ao carregar resultados:", error);
      }
      
      // Buscar os itens do template se houver templateId
      if (checklistData.templateId) {
        try {
          const itemsResponse = await fetch(`/api/checklist-templates/${checklistData.templateId}/items`);
          
          if (itemsResponse.ok) {
            itemsData = await itemsResponse.json();
            console.log("Itens carregados:", itemsData.length);
          }
        } catch (error) {
          console.warn("Erro ao carregar itens:", error);
        }
      }
      
      // Montar o objeto checklist completo
      const completeChecklist = {
        ...checklistData,
        results: resultsData,
        items: itemsData
      };
      
      console.log("Checklist completo montado:", completeChecklist);
      setChecklist(completeChecklist);
    } catch (error) {
      console.error('Erro ao carregar dados do checklist:', error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar os detalhes do checklist. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBack = () => {
    navigate("/checklists");
  };
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString || "Data não disponível";
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ok":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "issue":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "not_applicable":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return null;
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case "ok":
        return "OK";
      case "issue":
        return "Problema";
      case "not_applicable":
        return "Não aplicável";
      default:
        return status;
    }
  };
  
  const getChecklistStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle2 className="h-6 w-6 text-green-600" />;
      case "failed":
        return <XCircle className="h-6 w-6 text-red-600" />;
      case "pending":
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      default:
        return null;
    }
  };
  
  const getChecklistStatusText = (status: string) => {
    switch (status) {
      case "complete":
        return "Aprovado";
      case "failed":
        return "Falhas Encontradas";
      case "pending":
        return "Pendente";
      default:
        return status || "Status desconhecido";
    }
  };
  
  // Agrupar itens por categoria
  const getItemsByCategory = () => {
    if (!checklist) return {};
    
    const categories: Record<string, { item: ChecklistItem, result: ChecklistResult }[]> = {};
    
    // Verificar se os itens existem
    if (!checklist.items || checklist.items.length === 0) {
      return {
        "Sem itens": [
          {
            item: {
              id: 0,
              templateId: checklist.templateId || 0,
              name: "Nenhum item de checklist encontrado",
              description: null,
              isRequired: false,
              category: null,
              order: null
            },
            result: {
              id: 0,
              checklistId: checklist.id,
              itemId: 0,
              status: "not_applicable",
              observation: null,
              photoUrl: null
            }
          }
        ]
      };
    }
    
    // Agregar itens por categoria
    checklist.items.forEach(item => {
      const category = item.category || "Sem categoria";
      if (!categories[category]) {
        categories[category] = [];
      }
      
      // Buscar o resultado correspondente ao item
      const result = checklist.results.find(r => r.itemId === item.id);
      
      // Se não encontrar um resultado, criar um resultado padrão
      const defaultResult: ChecklistResult = {
        id: 0,
        checklistId: checklist.id,
        itemId: item.id,
        status: "not_applicable",
        observation: null,
        photoUrl: null
      };
      
      categories[category].push({ 
        item, 
        result: result || defaultResult 
      });
    });
    
    return categories;
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="text-center">
          <div className="mb-4">Carregando detalhes do checklist...</div>
        </div>
      </div>
    );
  }
  
  if (!checklist) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="text-center py-10">
          <h3 className="text-lg font-medium text-red-600 mb-2">Checklist não encontrado</h3>
          <p className="text-gray-600">O checklist solicitado não existe ou foi removido.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleBack}
          className="h-8 w-8 text-blue-700 mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold text-blue-900">Detalhes do Checklist</h2>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
            <div>
              <CardTitle className="text-xl font-medium mb-2">
                {checklist.template?.name || "Sem modelo"} - {formatDate(checklist.date)}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2 text-gray-600 text-sm">
                <div className="flex items-center gap-1">
                  <Truck className="h-4 w-4" />
                  <span>{checklist.vehicle?.name || "Veículo desconhecido"} 
                    ({checklist.vehicle?.plate || "N/A"})
                  </span>
                </div>
                <span className="text-gray-400 hidden sm:inline">•</span>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{checklist.driver?.name || "Motorista desconhecido"}</span>
                </div>
                <span className="text-gray-400 hidden sm:inline">•</span>
                <span>{checklist.odometer || 0} km</span>
              </div>
            </div>
            <div className="flex items-center gap-2 font-medium">
              {getChecklistStatusIcon(checklist.status)}
              <span>
                {getChecklistStatusText(checklist.status)}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {checklist.observations && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-700 mb-1">Observações gerais:</h3>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-md">{checklist.observations}</p>
            </div>
          )}
          
          <div className="space-y-6">
            {Object.entries(getItemsByCategory()).map(([category, items]) => (
              <div key={category} className="space-y-3">
                <h3 className="font-medium text-blue-900">{category}</h3>
                <div className="space-y-4">
                  {items.map(({ item, result }: { item: ChecklistItem, result: ChecklistResult }) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{item.name}</h4>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(result.status)}
                              <span className="text-sm font-medium">
                                {getStatusText(result.status)}
                              </span>
                            </div>
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          )}
                        </div>
                      </div>
                      
                      {result.status === "issue" && (
                        <div className="mt-3 space-y-3">
                          {result.observation && (
                            <div className="bg-red-50 p-3 rounded-md">
                              <p className="text-red-700 text-sm">{result.observation}</p>
                            </div>
                          )}
                          
                          {result.photoUrl && (
                            <div>
                              <h5 className="text-sm font-medium mb-1">Foto:</h5>
                              <div className="relative w-full h-40 bg-gray-100 rounded-md overflow-hidden">
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                  Imagem não disponível em modo de demonstração
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handleBack}
          className="text-blue-700 border-blue-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Checklists
        </Button>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            className="border-amber-600 text-amber-600 hover:bg-amber-50"
            onClick={() => {
              // Redirecionar para a página de edição
              navigate(`/checklists/edit/${id}`);
            }}
          >
            Editar
          </Button>
          
          <Button 
            variant="outline" 
            className="border-red-600 text-red-600 hover:bg-red-50"
            onClick={async () => {
              const confirm = window.confirm("Tem certeza que deseja excluir este checklist?");
              
              if (confirm) {
                try {
                  // Excluir o checklist usando a API
                  const response = await fetch(`/api/checklists/${id}`, {
                    method: 'DELETE',
                  });
                  
                  if (response.ok) {
                    toast({
                      title: "Sucesso",
                      description: "Checklist excluído com sucesso!",
                    });
                    // Redirecionar para a lista de checklists
                    navigate('/checklists');
                  } else {
                    const error = await response.json();
                    throw new Error(error.message || "Erro ao excluir checklist");
                  }
                } catch (error) {
                  console.error("Erro ao excluir checklist:", error);
                  toast({
                    title: "Erro",
                    description: error instanceof Error ? error.message : "Erro ao excluir checklist",
                    variant: "destructive",
                  });
                }
              }
            }}
          >
            Excluir
          </Button>
        </div>
      </div>
    </div>
  );
}