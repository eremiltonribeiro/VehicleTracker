import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Truck, CheckCircle2, XCircle, AlertTriangle, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChecklistItem {
  id: number;
  templateId: number;
  name: string;
  description: string | null;
  isRequired: boolean;
  category: string | null;
  order: number;
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
  const params = useParams();
  const id = params.id;
  const [checklist, setChecklist] = useState<VehicleChecklist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  useEffect(() => {
    loadChecklistData();
  }, [id]);
  
  const loadChecklistData = async () => {
    setIsLoading(true);
    
    try {
      // Buscar dados do checklist da API
      const response = await fetch(`/api/checklists/${id}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar dados do checklist');
      }
      
      const checklistData = await response.json();
      
      // Buscar os resultados do checklist
      const resultsResponse = await fetch(`/api/checklists/${id}/results`);
      
      if (!resultsResponse.ok) {
        throw new Error('Erro ao carregar resultados do checklist');
      }
      
      const resultsData = await resultsResponse.json();
      
      // Buscar os itens do template associado
      const itemsResponse = await fetch(`/api/checklist-templates/${checklistData.templateId}/items`);
      
      if (!itemsResponse.ok) {
        throw new Error('Erro ao carregar itens do template');
      }
      
      const itemsData = await itemsResponse.json();
      
      // Montar o objeto checklist completo
      const completeChecklist = {
        ...checklistData,
        results: resultsData,
        items: itemsData
      };
      
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
    setLocation("/checklists");
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        return status;
    }
  };
  
  // Agrupar itens por categoria
  const getItemsByCategory = () => {
    if (!checklist) return {};
    
    const categories: Record<string, { item: ChecklistItem, result: ChecklistResult }[]> = {};
    
    checklist.items.forEach(item => {
      const category = item.category || "Sem categoria";
      if (!categories[category]) {
        categories[category] = [];
      }
      
      const result = checklist.results.find(r => r.itemId === item.id);
      if (result) {
        categories[category].push({ item, result });
      }
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
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-medium mb-2">
                {checklist.template.name} - {formatDate(checklist.date)}
              </CardTitle>
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <div className="flex items-center gap-1">
                  <Truck className="h-4 w-4" />
                  <span>{checklist.vehicle.name} ({checklist.vehicle.plate})</span>
                </div>
                <span className="text-gray-400">•</span>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{checklist.driver.name}</span>
                </div>
                <span className="text-gray-400">•</span>
                <span>{checklist.odometer} km</span>
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
                  {items.map(({ item, result }) => (
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
      
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          onClick={handleBack}
          className="text-blue-700 border-blue-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Checklists
        </Button>
      </div>
    </div>
  );
}