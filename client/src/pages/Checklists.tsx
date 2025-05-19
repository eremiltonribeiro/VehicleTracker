import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckSquare, Plus, Settings, List, CheckCircle2, XCircle, Truck, AlertTriangle } from "lucide-react";
import { useAuth } from "@/App";

// Tipos para o componente
interface ChecklistTemplate {
  id: number;
  name: string;
  description: string | null;
  isDefault: boolean;
  createdAt: string;
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
}

export default function Checklists() {
  const [activeTab, setActiveTab] = useState("historico");
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [checklists, setChecklists] = useState<VehicleChecklist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  useEffect(() => {
    // Carregar dados dos templates e checklists realizados
    loadData();
  }, []);
  
  const loadData = () => {
    setIsLoading(true);
    
    // Simulando carregamento de dados (em um sistema real, isso viria do servidor)
    setTimeout(() => {
      // Templates de checklist
      const mockTemplates: ChecklistTemplate[] = [
        {
          id: 1,
          name: "Checklist Diário",
          description: "Verificação diária de itens básicos de segurança",
          isDefault: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          name: "Checklist Semanal",
          description: "Verificação mais completa para manutenção preventiva",
          isDefault: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 3,
          name: "Checklist de Viagem",
          description: "Verificação para antes de iniciar viagens longas",
          isDefault: false,
          createdAt: new Date().toISOString()
        }
      ];
      
      // Checklists realizados
      const mockChecklists: VehicleChecklist[] = [
        {
          id: 1,
          vehicleId: 1,
          driverId: 1,
          templateId: 1,
          date: new Date().toISOString(),
          observations: "Tudo em ordem",
          odometer: 5430,
          status: "complete",
          photoUrl: null,
          vehicle: {
            name: "Caminhão 01",
            plate: "ABC1234"
          },
          driver: {
            name: "João Silva"
          },
          template: {
            name: "Checklist Diário"
          }
        },
        {
          id: 2,
          vehicleId: 2,
          driverId: 2,
          templateId: 1,
          date: new Date(Date.now() - 86400000).toISOString(), // Ontem
          observations: "Problema no farol esquerdo",
          odometer: 12500,
          status: "failed",
          photoUrl: null,
          vehicle: {
            name: "Caminhão 02",
            plate: "DEF5678"
          },
          driver: {
            name: "Carlos Santos"
          },
          template: {
            name: "Checklist Diário"
          }
        },
        {
          id: 3,
          vehicleId: 1,
          driverId: 1,
          templateId: 2,
          date: new Date(Date.now() - 172800000).toISOString(), // 2 dias atrás
          observations: null,
          odometer: 5200,
          status: "complete",
          photoUrl: null,
          vehicle: {
            name: "Caminhão 01",
            plate: "ABC1234"
          },
          driver: {
            name: "João Silva"
          },
          template: {
            name: "Checklist Semanal"
          }
        }
      ];
      
      setTemplates(mockTemplates);
      setChecklists(mockChecklists);
      setIsLoading(false);
    }, 500);
  };
  
  const handleNewChecklist = () => {
    setLocation("/checklists/new");
  };
  
  const handleTemplateSettings = () => {
    setLocation("/checklists/templates");
  };
  
  const handleViewChecklist = (id: number) => {
    setLocation(`/checklists/${id}`);
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
      case "complete":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "pending":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return null;
    }
  };
  
  const getStatusText = (status: string) => {
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
  
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">Checklist de Veículos</h2>
          <p className="text-gray-600">Gerenciamento das verificações de segurança e manutenção</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleNewChecklist}
            className="bg-blue-800 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Checklist
          </Button>
          {(user?.role === "admin" || user?.role === "manager") && (
            <Button 
              onClick={handleTemplateSettings}
              variant="outline"
              className="border-blue-700 text-blue-700 hover:bg-blue-50"
            >
              <Settings className="mr-2 h-4 w-4" />
              Modelos
            </Button>
          )}
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="historico" className="flex gap-2 items-center">
            <List className="h-4 w-4" />
            Histórico de Checklists
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex gap-2 items-center">
            <CheckSquare className="h-4 w-4" />
            Modelos de Checklist
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle>Checklists Realizados</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Carregando checklists...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Motorista</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>KM</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {checklists.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                          Nenhum checklist realizado até o momento.
                        </TableCell>
                      </TableRow>
                    ) : (
                      checklists.map(checklist => (
                        <TableRow key={checklist.id}>
                          <TableCell>{formatDate(checklist.date)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2 items-center">
                              <Truck className="h-4 w-4 text-blue-700" />
                              <div>
                                <div>{checklist.vehicle.name}</div>
                                <div className="text-xs text-gray-500">{checklist.vehicle.plate}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{checklist.driver.name}</TableCell>
                          <TableCell>{checklist.template.name}</TableCell>
                          <TableCell>{checklist.odometer.toLocaleString()} km</TableCell>
                          <TableCell>
                            <div className="flex gap-2 items-center">
                              {getStatusIcon(checklist.status)}
                              <span>{getStatusText(checklist.status)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewChecklist(checklist.id)}
                              className="text-blue-700 hover:text-blue-900 hover:bg-blue-50"
                            >
                              Visualizar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="templates">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Modelos de Checklist</CardTitle>
              {(user?.role === "admin" || user?.role === "manager") && (
                <Button 
                  onClick={handleTemplateSettings}
                  className="bg-blue-800 hover:bg-blue-700"
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Modelo
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Carregando modelos...</div>
              ) : (
                <div className="space-y-6">
                  {templates.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      Nenhum modelo de checklist cadastrado.
                    </div>
                  ) : (
                    templates.map(template => (
                      <div key={template.id} className="border rounded-lg p-4 hover:border-blue-700 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-lg text-blue-900">{template.name}</h3>
                            {template.description && (
                              <p className="text-gray-600 text-sm">{template.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTemplateSettings()}
                              className="text-blue-700 hover:text-blue-900 hover:bg-blue-50"
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleNewChecklist()}
                              className="text-green-700 hover:text-green-900 hover:bg-green-50"
                            >
                              <CheckSquare className="h-4 w-4 mr-1" />
                              Usar
                            </Button>
                          </div>
                        </div>
                        {template.isDefault && (
                          <div className="mt-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                            Padrão
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}