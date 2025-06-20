import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  User, 
  Phone, 
  FileText, 
  Calendar, 
  MapPin, 
  Car,
  Fuel,
  Activity,
  Loader2,
  AlertCircle,
  Edit
} from "lucide-react";
import { Driver } from "@shared/schema";
import { brandColors } from "@/lib/colors";

export default function DriverDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();

  const { data: driver, isLoading, error } = useQuery<Driver>({
    queryKey: ["/api/drivers", id],
    queryFn: async () => {
      const res = await fetch(`/api/drivers/${id}`);
      if (!res.ok) throw new Error("Falha ao buscar detalhes do motorista");
      return res.json();
    },
    enabled: !!id,
  });

  // Query for driver's recent registrations
  const { data: recentRegistrations = [] } = useQuery({
    queryKey: ["/api/fuel-records", "by-driver", id],
    queryFn: async () => {
      const res = await fetch(`/api/fuel-records?driverId=${id}&limit=5`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: brandColors.primary[600] }} />
        <p className="text-muted-foreground">Carregando detalhes do motorista...</p>
      </div>
    );
  }

  if (error || !driver) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <div className="text-center">
              <h3 className="text-lg font-semibold">Erro ao carregar dados</h3>
              <p className="text-muted-foreground">
                {error?.message || "Motorista não encontrado"}
              </p>
            </div>
            <Button onClick={() => setLocation("/cadastros")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Cadastros
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation("/cadastros")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>             <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: brandColors.primary[600] }}>
              <User className="h-6 w-6" />
              {driver.name}
            </h1>
            <p className="text-muted-foreground">Detalhes do motorista</p>
          </div>
        </div>
        <Button onClick={() => setLocation(`/cadastros?edit=${driver.id}&type=driver`)}>
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nome Completo</label>
                  <p className="text-lg font-semibold">{driver.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {driver.phone || "Não informado"}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">CNH</label>
                  <p className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {driver.license || "Não informado"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data de Cadastro</label>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    N/A
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Registros Recentes
              </CardTitle>
              <CardDescription>
                Últimos 5 registros de combustível
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentRegistrations.length === 0 ? (
                <div className="text-center py-6">
                  <Fuel className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Nenhum registro encontrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentRegistrations.map((record: any, index: number) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full" style={{ backgroundColor: `${brandColors.accent}20` }}>
                          <Fuel className="h-4 w-4" style={{ color: brandColors.accent }} />
                        </div>
                        <div>
                          <p className="font-medium">
                            {record.liters}L - R$ {record.totalValue?.toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(record.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {record.fuelType || 'N/A'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge 
                  variant="secondary" 
                  style={{ backgroundColor: `${brandColors.success[500]}20`, color: brandColors.success[600] }}
                >
                  Ativo
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Registros</span>
                <span className="font-semibold">{recentRegistrations.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setLocation("/registros")}
              >
                <Fuel className="h-4 w-4 mr-2" />
                Novo Registro
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setLocation("/relatorios")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Ver Relatórios
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setLocation(`/cadastros?edit=${driver.id}&type=driver`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar Dados
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
