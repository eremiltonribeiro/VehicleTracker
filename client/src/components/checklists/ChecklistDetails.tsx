import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  User,
  Car,
  Gauge,
  FileText,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ChecklistDetailsProps {
  checklistId: string;
}

interface ChecklistResult {
  id: number;
  itemId: number;
  status: "ok" | "issue" | "not_applicable";
  observation?: string;
  item: {
    id: number;
    name: string;
    category: string;
    isRequired: boolean;
  };
}

interface ChecklistDetails {
  id: number;
  vehicleId: number;
  driverId: number;
  templateId: number;
  date: string;
  odometer: number;
  status: "pending" | "complete" | "failed";
  observations?: string;
  photoUrl?: string;
  vehicle: {
    id: number;
    name: string;
    plate: string;
  };
  driver: {
    id: number;
    name: string;
  };
  template: {
    id: number;
    name: string;
    description: string;
  };
  results: ChecklistResult[];
}

export default function ChecklistDetails({ checklistId }: ChecklistDetailsProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: checklist,
    isLoading,
    error,
  } = useQuery<ChecklistDetails>({
    queryKey: ["/api/checklists", checklistId],
    queryFn: async () => {
      const response = await fetch(`/api/checklists/${checklistId}`);
      if (!response.ok) {
        throw new Error("Erro ao carregar checklist");
      }
      return response.json();
    },
  });

  const handleEdit = () => {
    setLocation(`/checklists/edit/${checklistId}`);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      const response = await fetch(`/api/checklists/${checklistId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao excluir checklist");
      }

      // Invalidar cache e disparar evento
      queryClient.invalidateQueries({ queryKey: ["/api/checklists"] });
      queryClient.removeQueries({ queryKey: ["/api/checklists"] });
      window.dispatchEvent(new CustomEvent("checklist-updated"));

      toast({
        title: "Sucesso!",
        description: "Checklist excluído com sucesso.",
        variant: "default",
      });

      setLocation("/checklists");
    } catch (error) {
      console.error("Erro ao excluir checklist:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir checklist. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "complete":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Aprovado
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Falhas Encontradas
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getItemStatusIcon = (status: string) => {
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

  const getItemStatusText = (status: string) => {
    switch (status) {
      case "ok":
        return "OK";
      case "issue":
        return "Problema";
      case "not_applicable":
        return "Não Aplicável";
      default:
        return status;
    }
  };

  const groupResultsByCategory = (results: ChecklistResult[]) => {
    return results.reduce((acc, result) => {
      const category = result.item.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(result);
      return acc;
    }, {} as Record<string, ChecklistResult[]>);
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="text-center">
          <div className="mb-4">Carregando checklist...</div>
        </div>
      </div>
    );
  }

  if (error || !checklist) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <p className="text-red-600 mb-4">Erro ao carregar checklist</p>
        <Button onClick={() => setLocation("/checklists")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    );
  }

  const groupedResults = groupResultsByCategory(checklist.results || []);
  const issuesCount = checklist.results?.filter(r => r.status === "issue").length || 0;
  const okCount = checklist.results?.filter(r => r.status === "ok").length || 0;
  const naCount = checklist.results?.filter(r => r.status === "not_applicable").length || 0;

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
          <div>
            <h2 className="text-2xl font-bold text-blue-900">Detalhes do Checklist</h2>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(checklist.status)}
              <span className="text-sm text-gray-500">#{checklist.id}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Informações Gerais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <Car className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Veículo</p>
                <p className="text-sm text-gray-600">
                  {checklist.vehicle.name}
                </p>
                <p className="text-xs text-gray-500">{checklist.vehicle.plate}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Motorista</p>
                <p className="text-sm text-gray-600">{checklist.driver.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Data</p>
                <p className="text-sm text-gray-600">
                  {formatDate(new Date(checklist.date))}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Gauge className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Hodômetro</p>
                <p className="text-sm text-gray-600">{checklist.odometer.toLocaleString()} km</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Template</p>
                <p className="text-sm text-gray-600">{checklist.template.name}</p>
                {checklist.template.description && (
                  <p className="text-xs text-gray-500 mt-1">{checklist.template.description}</p>
                )}
              </div>
            </div>

            {checklist.observations && (
              <div className="flex items-start gap-3 mt-4">
                <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Observações Gerais</p>
                  <p className="text-sm text-gray-600">{checklist.observations}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resumo dos Resultados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Resumo dos Resultados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-800">{okCount}</p>
              <p className="text-sm text-green-600">Itens OK</p>
            </div>

            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center justify-center mb-2">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-800">{issuesCount}</p>
              <p className="text-sm text-red-600">Problemas</p>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-center mb-2">
                <AlertTriangle className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-600">{naCount}</p>
              <p className="text-sm text-gray-500">Não Aplicável</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados Detalhados */}
      {Object.keys(groupedResults).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Resultados Detalhados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(groupedResults).map(([category, results]) => (
              <div key={category} className="space-y-3">
                <h3 className="text-md font-medium text-gray-700 border-b pb-2">
                  {getCategoryName(category)}
                </h3>
                <div className="space-y-2">
                  {results.map((result) => (
                    <div
                      key={result.id}
                      className="flex items-start justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {result.item.name}
                          {result.item.isRequired && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </p>
                        {result.observation && (
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Observação:</strong> {result.observation}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {getItemStatusIcon(result.status)}
                        <span className="text-sm font-medium">
                          {getItemStatusText(result.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este checklist? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
