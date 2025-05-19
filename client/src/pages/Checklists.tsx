import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Filter, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

interface ChecklistItem {
  id: number;
  name: string;
  isRequired: boolean;
}

interface VehicleChecklist {
  id: number;
  date: string;
  vehicleId: number;
  driverId: number;
  odometer: number;
  status: "pending" | "complete" | "failed";
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
  const [checklists, setChecklists] = useState<VehicleChecklist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  
  useEffect(() => {
    // Se houver um ID nos parâmetros, redireciona para a página de detalhes
    if (params.id) {
      setLocation(`/checklists/${params.id}`);
    } else {
      loadChecklists();
    }
  }, [params.id]);
  
  const loadChecklists = () => {
    setIsLoading(true);
    
    // Simulação de carregamento de dados
    setTimeout(() => {
      // Dados simulados para demonstração
      const mockChecklists: VehicleChecklist[] = [
        {
          id: 1,
          date: new Date().toISOString(),
          vehicleId: 1,
          driverId: 1,
          odometer: 5430,
          status: "complete",
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
          date: new Date(Date.now() - 86400000).toISOString(), // ontem
          vehicleId: 2,
          driverId: 2,
          odometer: 12540,
          status: "failed",
          vehicle: {
            name: "Caminhão 02",
            plate: "XYZ5678"
          },
          driver: {
            name: "Maria Oliveira"
          },
          template: {
            name: "Checklist Semanal"
          }
        },
        {
          id: 3,
          date: new Date(Date.now() - 172800000).toISOString(), // 2 dias atrás
          vehicleId: 3,
          driverId: 3,
          odometer: 8120,
          status: "pending",
          vehicle: {
            name: "Caminhão 03",
            plate: "DEF9012"
          },
          driver: {
            name: "Carlos Santos"
          },
          template: {
            name: "Checklist Mensal"
          }
        }
      ];
      
      setChecklists(mockChecklists);
      setIsLoading(false);
    }, 500);
  };
  
  const handleNewChecklist = () => {
    setLocation("/checklists/new");
  };
  
  const handleViewChecklist = (id: number) => {
    setLocation(`/checklists/${id}`);
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
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="text-center">
          <div className="mb-4">Carregando checklists...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-blue-900">Checklists de Veículos</h2>
        <div className="flex gap-2">
          <Button
            onClick={handleNewChecklist}
            className="bg-blue-700 hover:bg-blue-800"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Checklist
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">
            Histórico de Checklists
          </CardTitle>
        </CardHeader>
        <CardContent>
          {checklists.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhum checklist encontrado.</p>
              <p>Clique em "Novo Checklist" para criar o primeiro.</p>
            </div>
          ) : (
            <div className="overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-medium">Data</TableHead>
                    <TableHead className="font-medium">Veículo</TableHead>
                    <TableHead className="font-medium">Motorista</TableHead>
                    <TableHead className="font-medium">Modelo</TableHead>
                    <TableHead className="font-medium">Hodômetro</TableHead>
                    <TableHead className="font-medium">Status</TableHead>
                    <TableHead className="font-medium">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checklists.map((checklist) => (
                    <TableRow key={checklist.id}>
                      <TableCell className="font-medium">
                        {formatDate(new Date(checklist.date))}
                      </TableCell>
                      <TableCell>
                        {checklist.vehicle.name} ({checklist.vehicle.plate})
                      </TableCell>
                      <TableCell>{checklist.driver.name}</TableCell>
                      <TableCell>{checklist.template.name}</TableCell>
                      <TableCell>{checklist.odometer} km</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(checklist.status)}
                          <span>{getStatusText(checklist.status)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="link"
                          className="text-blue-700 p-0 h-auto"
                          onClick={() => handleViewChecklist(checklist.id)}
                        >
                          Visualizar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}