import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Car, 
  Users, 
  Fuel, 
  Droplet, 
  Wrench, 
  Settings, 
  Plus, 
  Eye, 
  Edit,
  BarChart3,
  Activity,
  TrendingUp,
  Database
} from "lucide-react";
import { useLocation } from "wouter";
import { brandColors } from "@/lib/colors";
import { CadastroVeiculos } from "@/components/cadastros/CadastroVeiculos";
import { CadastroMotoristas } from "@/components/cadastros/CadastroMotoristas";
import { CadastroPostos } from "@/components/cadastros/CadastroPostos";
import { CadastroTiposCombustivel } from "@/components/cadastros/CadastroTiposCombustivel";

export default function SimpleCadastros() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch data for statistics
  const { data: vehicles = [] } = useQuery({
    queryKey: ["/api/vehicles"],
    queryFn: async () => {
      const res = await fetch("/api/vehicles");
      return res.ok ? res.json() : [];
    },
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ["/api/drivers"],
    queryFn: async () => {
      const res = await fetch("/api/drivers");
      return res.ok ? res.json() : [];
    },
  });

  const { data: stations = [] } = useQuery({
    queryKey: ["/api/fuel-stations"],
    queryFn: async () => {
      const res = await fetch("/api/fuel-stations");
      return res.ok ? res.json() : [];
    },
  });

  const { data: fuelTypes = [] } = useQuery({
    queryKey: ["/api/fuel-types"],
    queryFn: async () => {
      const res = await fetch("/api/fuel-types");
      return res.ok ? res.json() : [];
    },
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ["/api/registrations"],
    queryFn: async () => {
      const res = await fetch("/api/registrations");
      return res.ok ? res.json() : [];
    },
  });

  // Calculate quick stats
  const recentRegistrations = registrations.slice(0, 5);
  const totalRegistrations = registrations.length;

  const managementCards = [
    {
      id: "vehicles",
      title: "Gestão de Veículos",
      description: "Cadastre e gerencie os veículos da sua frota",
      icon: Car,
      color: "blue",
      count: vehicles.length,
      gradient: "from-blue-500 to-blue-600"
    },
    {
      id: "drivers",
      title: "Gestão de Motoristas",
      description: "Cadastre e gerencie os motoristas autorizados",
      icon: Users,
      color: "green",
      count: drivers.length,
      gradient: "from-green-500 to-green-600"
    },
    {
      id: "stations",
      title: "Postos de Combustível",
      description: "Gerencie os postos e pontos de abastecimento",
      icon: Fuel,
      color: "orange",
      count: stations.length,
      gradient: "from-orange-500 to-orange-600"
    },
    {
      id: "fuel-types",
      title: "Tipos de Combustível",
      description: "Configure os tipos de combustível disponíveis",
      icon: Droplet,
      color: "purple",
      count: fuelTypes.length,
      gradient: "from-purple-500 to-purple-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: brandColors.primary[100] }}>
                  <Database className="h-8 w-8" style={{ color: brandColors.primary[600] }} />
                </div>
                Central de Cadastros
              </h1>
              <p className="text-gray-600 mt-2">
                Gerencie todos os dados fundamentais da sua frota
              </p>
            </div>
          </div>
        </div>

        {/* Main Interface */}
        <Card className="shadow-lg border-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-5 bg-gray-100">
                <TabsTrigger 
                  value="overview" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600"
                >
                  <BarChart3 className="h-4 w-4" />
                  Visão Geral
                </TabsTrigger>
                <TabsTrigger 
                  value="vehicles" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600"
                >
                  <Car className="h-4 w-4" />
                  Veículos
                </TabsTrigger>
                <TabsTrigger 
                  value="drivers" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600"
                >
                  <Users className="h-4 w-4" />
                  Motoristas
                </TabsTrigger>
                <TabsTrigger 
                  value="stations" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600"
                >
                  <Fuel className="h-4 w-4" />
                  Postos
                </TabsTrigger>
                <TabsTrigger 
                  value="fuel-types" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600"
                >
                  <Droplet className="h-4 w-4" />
                  Combustíveis
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="p-0">
              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-0">
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Resumo do Sistema</h3>
                    <p className="text-gray-600">
                      Visão geral de todos os dados cadastrados no sistema
                    </p>
                  </div>

                  {/* Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {managementCards.map((card) => {
                      const IconComponent = card.icon;
                      return (
                        <Card key={card.id} className={`bg-gradient-to-r ${card.gradient} text-white border-0 cursor-pointer transition-transform hover:scale-105`} onClick={() => setActiveTab(card.id)}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-white/80 text-sm">{card.title}</p>
                                <p className="text-2xl font-bold">{card.count}</p>
                              </div>
                              <IconComponent className="h-8 w-8 text-white/80" />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Management Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {managementCards.map((card) => {
                      const IconComponent = card.icon;
                      return (
                        <Card key={card.id} className="group border-2 hover:border-blue-200 transition-all duration-300 cursor-pointer" onClick={() => setActiveTab(card.id)}>
                          <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg bg-${card.color}-100 group-hover:bg-${card.color}-200 transition-colors`}>
                                <IconComponent className={`h-6 w-6 text-${card.color}-600`} />
                              </div>
                              <div>
                                <span className="text-lg">{card.title}</span>
                                <Badge variant="outline" className="ml-2">
                                  {card.count} cadastrado(s)
                                </Badge>
                              </div>
                            </CardTitle>
                            <CardDescription>{card.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                className="flex-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveTab(card.id);
                                }}
                                style={{ backgroundColor: brandColors.primary[600] }}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Gerenciar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveTab(card.id);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Recent Activity */}
                  <Card className="bg-gray-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Atividade Recente
                      </CardTitle>
                      <CardDescription>
                        Últimos {recentRegistrations.length} registros no sistema
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {recentRegistrations.length === 0 ? (
                        <div className="text-center py-6 text-gray-500">
                          <Activity className="h-12 w-12 mx-auto mb-2 opacity-20" />
                          <p>Nenhuma atividade recente</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {recentRegistrations.map((registration: any, index: number) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg">
                              <div className={`p-2 rounded-full ${
                                registration.type === 'fuel' ? 'bg-blue-100' :
                                registration.type === 'maintenance' ? 'bg-orange-100' : 
                                'bg-green-100'
                              }`}>
                                {registration.type === 'fuel' && <Fuel className="h-4 w-4 text-blue-600" />}
                                {registration.type === 'maintenance' && <Wrench className="h-4 w-4 text-orange-600" />}
                                {registration.type === 'trip' && <Car className="h-4 w-4 text-green-600" />}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-sm">
                                  {registration.type === 'fuel' && 'Abastecimento'}
                                  {registration.type === 'maintenance' && 'Manutenção'}
                                  {registration.type === 'trip' && 'Viagem'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(registration.date).toLocaleDateString('pt-BR')}
                                </div>
                              </div>
                              <Badge variant="outline">
                                {registration.type}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Individual Management Tabs */}
              <TabsContent value="vehicles" className="mt-0">
                <CadastroVeiculos />
              </TabsContent>

              <TabsContent value="drivers" className="mt-0">
                <CadastroMotoristas />
              </TabsContent>

              <TabsContent value="stations" className="mt-0">
                <CadastroPostos />
              </TabsContent>

              <TabsContent value="fuel-types" className="mt-0">
                <CadastroTiposCombustivel />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
