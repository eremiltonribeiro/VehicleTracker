import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Car, 
  BarChart2, 
  Settings, 
  History, 
  Plus, 
  FileText, 
  CheckSquare, 
  Users,
  TrendingUp,
  Calendar,
  AlertTriangle,
  Fuel,
  Wrench
} from "lucide-react";

export default function Welcome() {
  const [_, setLocation] = useLocation();
  
  // Buscar dados para exibir estatísticas rápidas
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

  const { data: recentRegistrations = [] } = useQuery({
    queryKey: ["/api/registrations"],
    queryFn: async () => {
      const res = await fetch("/api/registrations?limit=5");
      return res.ok ? res.json() : [];
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header com estatísticas */}
        <div className="text-center space-y-4">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-900 to-blue-950 text-white">
            <CardHeader className="py-8">
              <CardTitle className="text-3xl md:text-4xl font-bold flex flex-wrap items-center justify-center gap-3">
                <Car className="h-10 w-10 flex-shrink-0" />
                <span>Sistema de Gestão de Frotas</span>
              </CardTitle>
              <CardDescription className="text-blue-200 text-lg md:text-xl max-w-2xl mx-auto">
                Controle completo de abastecimentos, manutenções e viagens da sua frota
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Estatísticas rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-white/80 backdrop-blur-sm border border-blue-200">
              <CardContent className="p-4 text-center">
                <Car className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{vehicles.length}</div>
                <div className="text-sm text-gray-600">Veículos</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/80 backdrop-blur-sm border border-blue-200">
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{drivers.length}</div>
                <div className="text-sm text-gray-600">Motoristas</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/80 backdrop-blur-sm border border-blue-200">
              <CardContent className="p-4 text-center">
                <FileText className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{recentRegistrations.length}</div>
                <div className="text-sm text-gray-600">Registros Recentes</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/80 backdrop-blur-sm border border-blue-200">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">--</div>
                <div className="text-sm text-gray-600">Performance</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Ações principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="group overflow-hidden border-2 hover:border-blue-500 hover:shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 group-hover:from-blue-100 group-hover:to-blue-150 transition-all duration-300">
              <CardTitle className="text-xl font-semibold flex items-center gap-3 text-blue-900">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <span>Novo Registro</span>
              </CardTitle>
              <CardDescription className="text-blue-700">
                Registrar abastecimento, manutenção ou viagem
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-700 mb-6">
                Registre informações detalhadas sobre abastecimentos, manutenções realizadas ou viagens com os veículos da frota.
              </p>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200" 
                onClick={() => setLocation("/registros")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Registro
              </Button>
            </CardContent>
          </Card>

          <Card className="group overflow-hidden border-2 hover:border-green-500 hover:shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 group-hover:from-green-100 group-hover:to-green-150 transition-all duration-300">
              <CardTitle className="text-xl font-semibold flex items-center gap-3 text-green-900">
                <div className="p-2 bg-green-600 rounded-lg">
                  <History className="h-6 w-6 text-white" />
                </div>
                <span>Histórico</span>
              </CardTitle>
              <CardDescription className="text-green-700">
                Consultar registros anteriores
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-700 mb-6">
                Visualize todos os registros anteriores com filtragem por veículo, período, motorista e tipo de registro.
              </p>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200" 
                onClick={() => setLocation("/registros/history")}
              >
                <History className="h-4 w-4 mr-2" />
                Ver Histórico
              </Button>
            </CardContent>
          </Card>

          <Card className="group overflow-hidden border-2 hover:border-purple-500 hover:shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 group-hover:from-purple-100 group-hover:to-purple-150 transition-all duration-300">
              <CardTitle className="text-xl font-semibold flex items-center gap-3 text-purple-900">
                <div className="p-2 bg-purple-600 rounded-lg">
                  <BarChart2 className="h-6 w-6 text-white" />
                </div>
                <span>Dashboard</span>
              </CardTitle>
              <CardDescription className="text-purple-700">
                Análises e estatísticas da frota
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-700 mb-6">
                Visualize indicadores de desempenho, gráficos de consumo, alertas de manutenção e previsões de gastos.
              </p>
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200" 
                onClick={() => setLocation("/registros/dashboard")}
              >
                <BarChart2 className="h-4 w-4 mr-2" />
                Acessar Dashboard
              </Button>
            </CardContent>
          </Card>

          <Card className="group overflow-hidden border-2 hover:border-orange-500 hover:shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 group-hover:from-orange-100 group-hover:to-orange-150 transition-all duration-300">
              <CardTitle className="text-xl font-semibold flex items-center gap-3 text-orange-900">
                <div className="p-2 bg-orange-600 rounded-lg">
                  <CheckSquare className="h-6 w-6 text-white" />
                </div>
                <span>Checklists</span>
              </CardTitle>
              <CardDescription className="text-orange-700">
                Inspeções de veículos
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-700 mb-6">
                Realize inspeções detalhadas dos veículos antes e depois das viagens para garantir a segurança.
              </p>
              <Button 
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200" 
                onClick={() => setLocation("/checklists")}
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Realizar Checklist
              </Button>
            </CardContent>
          </Card>

          <Card className="group overflow-hidden border-2 hover:border-gray-500 hover:shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 group-hover:from-gray-100 group-hover:to-gray-150 transition-all duration-300">
              <CardTitle className="text-xl font-semibold flex items-center gap-3 text-gray-900">
                <div className="p-2 bg-gray-600 rounded-lg">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <span>Configurações</span>
              </CardTitle>
              <CardDescription className="text-gray-700">
                Cadastro de veículos e informações
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-700 mb-6">
                Cadastre veículos, motoristas, postos de combustível, tipos de combustível e serviços de manutenção.
              </p>
              <Button 
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200" 
                onClick={() => setLocation("/configuracoes")}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurar Sistema
              </Button>
            </CardContent>
          </Card>
          
          <Card className="group overflow-hidden border-2 hover:border-indigo-500 hover:shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 group-hover:from-indigo-100 group-hover:to-indigo-150 transition-all duration-300">
              <CardTitle className="text-xl font-semibold flex items-center gap-3 text-indigo-900">
                <div className="p-2 bg-indigo-600 rounded-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <span>Relatórios</span>
              </CardTitle>
              <CardDescription className="text-indigo-700">
                Análises e exportações
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-700 mb-6">
                Gere relatórios detalhados de consumo, custos, manutenções e desempenho da frota.
              </p>
              <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200" 
                onClick={() => setLocation("/relatorios")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Gerar Relatórios
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Seção de registros recentes */}
        {recentRegistrations.length > 0 && (
          <Card className="bg-white/90 backdrop-blur-sm border border-blue-200">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="h-6 w-6 text-blue-600" />
                Atividades Recentes
              </CardTitle>
              <CardDescription>
                Últimos registros realizados no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentRegistrations.slice(0, 3).map((registration: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-full">
                      {registration.type === 'fuel' && <Fuel className="h-4 w-4 text-blue-600" />}
                      {registration.type === 'maintenance' && <Wrench className="h-4 w-4 text-red-600" />}
                      {registration.type === 'trip' && <Car className="h-4 w-4 text-green-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {registration.type === 'fuel' && 'Abastecimento'}
                        {registration.type === 'maintenance' && 'Manutenção'}
                        {registration.type === 'trip' && 'Viagem'}
                      </div>
                      <div className="text-xs text-gray-600">
                        {new Date(registration.date).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => setLocation("/registros/history")}
              >
                Ver Todos os Registros
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
