import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Calendar,
  Car,
  User,
  FileText,
  Gauge,
  Settings,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface VehicleChecklist {
  id: number;
  date: string;
  vehicleId: number;
  driverId: number;
  templateId: number;
  odometer: number;
  status: "pending" | "complete" | "failed";
  observations?: string;
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

interface Template {
  id: number;
  name: string;
  description: string;
}

export default function ChecklistList() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");
  const [driverFilter, setDriverFilter] = useState<string>("all");
  const [templateFilter, setTemplateFilter] = useState<string>("all");

  // Carregar checklists
  const {
    data: checklists = [],
    isLoading,
    error,
  } = useQuery<VehicleChecklist[]>({
    queryKey: ["/api/checklists"],
    queryFn: async () => {
      const response = await fetch("/api/checklists");
      if (!response.ok) {
        throw new Error("Erro ao carregar checklists");
      }
      return response.json();
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
  });

  // Carregar dados para filtros
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

  const { data: templates = [] } = useQuery<Template[]>({
    queryKey: ["/api/checklist-templates"],
    queryFn: async () => {
      const response = await fetch("/api/checklist-templates");
      if (!response.ok) throw new Error("Erro ao carregar templates");
      return response.json();
    },
  });

  // Listener para atualização de dados
  useEffect(() => {
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklists"] });
      queryClient.removeQueries({ queryKey: ["/api/checklists"] });
    };

    window.addEventListener("checklist-updated", handleUpdate);
    return () => window.removeEventListener("checklist-updated", handleUpdate);
  }, [queryClient]);

  // Filtrar checklists
  const filteredChecklists = checklists.filter((checklist) => {
    // Filtro de busca
    const matchesSearch =
      searchTerm === "" ||
      checklist.vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      checklist.vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      checklist.driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      checklist.template.name.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro de status
    const matchesStatus = statusFilter === "all" || checklist.status === statusFilter;

    // Filtro de veículo
    const matchesVehicle =
      vehicleFilter === "all" || checklist.vehicleId.toString() === vehicleFilter;

    // Filtro de motorista
    const matchesDriver =
      driverFilter === "all" || checklist.driverId.toString() === driverFilter;

    // Filtro de template
    const matchesTemplate =
      templateFilter === "all" || checklist.templateId.toString() === templateFilter;

    return (
      matchesSearch && matchesStatus && matchesVehicle && matchesDriver && matchesTemplate
    );
  });

  const handleNewChecklist = () => {
    setLocation("/checklists/new");
  };

  const handleViewChecklist = (id: number) => {
    setLocation(`/checklists/${id}`);
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
            Falhas
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

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setVehicleFilter("all");
    setDriverFilter("all");
    setTemplateFilter("all");
  };

  const activeFiltersCount = [
    searchTerm !== "",
    statusFilter !== "all",
    vehicleFilter !== "all",
    driverFilter !== "all",
    templateFilter !== "all",
  ].filter(Boolean).length;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <p className="text-red-600 mb-4">Erro ao carregar checklists</p>
        <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">Checklists de Veículos</h2>
          <p className="text-gray-600 text-sm mt-1">
            {isLoading ? "Carregando..." : `${filteredChecklists.length} checklist(s) encontrado(s)`}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setLocation("/checklists/templates")}
            className="order-2 sm:order-1"
          >
            <Settings className="mr-2 h-4 w-4" />
            Gerenciar Templates
          </Button>
          <Button
            onClick={handleNewChecklist}
            className="bg-blue-700 hover:bg-blue-800 order-1 sm:order-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Checklist
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium">Filtros</CardTitle>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpar Filtros ({activeFiltersCount})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Linha 1: Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por veículo, placa, motorista ou template..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Linha 2: Filtros de seleção */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="complete">Aprovado</SelectItem>
                  <SelectItem value="failed">Falhas</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Veículo</label>
              <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os veículos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os veículos</SelectItem>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                      {vehicle.name} ({vehicle.plate})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Motorista</label>
              <Select value={driverFilter} onValueChange={setDriverFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os motoristas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os motoristas</SelectItem>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id.toString()}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Template</label>
              <Select value={templateFilter} onValueChange={setTemplateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os templates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os templates</SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Checklists */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Histórico de Checklists</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando checklists...</p>
              </div>
            </div>
          ) : filteredChecklists.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {checklists.length === 0 ? "Nenhum checklist encontrado" : "Nenhum resultado"}
              </h3>
              <p className="text-gray-600 mb-4">
                {checklists.length === 0
                  ? "Clique em 'Novo Checklist' para criar o primeiro."
                  : "Tente ajustar os filtros para encontrar o que procura."}
              </p>
              {checklists.length === 0 ? (
                <Button onClick={handleNewChecklist} className="bg-blue-700 hover:bg-blue-800">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Checklist
                </Button>
              ) : (
                <Button variant="outline" onClick={clearFilters}>
                  Limpar Filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-medium">Data</TableHead>
                    <TableHead className="font-medium">Veículo</TableHead>
                    <TableHead className="font-medium">Motorista</TableHead>
                    <TableHead className="font-medium">Template</TableHead>
                    <TableHead className="font-medium">Hodômetro</TableHead>
                    <TableHead className="font-medium">Status</TableHead>
                    <TableHead className="font-medium text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredChecklists
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((checklist) => (
                      <TableRow
                        key={checklist.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleViewChecklist(checklist.id)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {formatDate(new Date(checklist.date))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="font-medium text-sm">{checklist.vehicle.name}</p>
                              <p className="text-xs text-gray-500">{checklist.vehicle.plate}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            {checklist.driver.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="font-medium text-sm">{checklist.template.name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Gauge className="h-4 w-4 text-gray-400" />
                            {checklist.odometer.toLocaleString()} km
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(checklist.status)}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewChecklist(checklist.id);
                            }}
                          >
                            <Eye className="h-4 w-4" />
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
