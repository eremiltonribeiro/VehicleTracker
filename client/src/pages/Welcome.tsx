import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Car, BarChart2, Settings, History, Plus, FileText } from "lucide-react";

export default function Welcome() {
  const [_, setLocation] = useLocation();
  
  return (
    <div className="space-y-8">
      <Card className="border-0 shadow-none bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-3">
            <Car className="h-8 w-8" />
            Sistema de Gestão de Frotas
          </CardTitle>
          <CardDescription className="text-primary-100 text-lg">
            Controle completo de abastecimentos, manutenções e viagens da sua frota
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="overflow-hidden border-2 hover:border-primary transition-all">
          <CardHeader className="bg-primary-50 pb-2">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Novo Registro
            </CardTitle>
            <CardDescription>
              Registrar abastecimento, manutenção ou viagem
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600 mb-4">
              Registre informações detalhadas sobre abastecimentos, manutenções realizadas ou viagens com os veículos da frota.
            </p>
            <Button 
              className="w-full" 
              onClick={() => setLocation("/")}
            >
              Adicionar Registro
            </Button>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-2 hover:border-primary transition-all">
          <CardHeader className="bg-primary-50 pb-2">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Histórico
            </CardTitle>
            <CardDescription>
              Consultar registros anteriores
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600 mb-4">
              Visualize todos os registros anteriores com filtragem por veículo, período, motorista e tipo de registro.
            </p>
            <Button 
              className="w-full" 
              onClick={() => setLocation("/?view=history")}
            >
              Ver Histórico
            </Button>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-2 hover:border-primary transition-all">
          <CardHeader className="bg-primary-50 pb-2">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-primary" />
              Dashboard
            </CardTitle>
            <CardDescription>
              Análises e estatísticas da frota
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600 mb-4">
              Visualize indicadores de desempenho, gráficos de consumo, alertas de manutenção e previsões de gastos.
            </p>
            <Button 
              className="w-full" 
              onClick={() => setLocation("/?view=dashboard")}
            >
              Acessar Dashboard
            </Button>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-2 hover:border-primary transition-all">
          <CardHeader className="bg-primary-50 pb-2">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Configurações
            </CardTitle>
            <CardDescription>
              Cadastro de veículos e informações
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600 mb-4">
              Cadastre veículos, motoristas, postos de combustível, tipos de combustível e serviços de manutenção.
            </p>
            <Button 
              className="w-full" 
              onClick={() => setLocation("/configuracoes")}
            >
              Configurar Sistema
            </Button>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-2 hover:border-primary transition-all">
          <CardHeader className="bg-primary-50 pb-2">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Relatórios
            </CardTitle>
            <CardDescription>
              Relatórios e exportação de dados
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600 mb-4">
              Gere relatórios detalhados de consumo, manutenções e custos. Exporte dados para análises externas.
            </p>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => setLocation("/relatorios")}
            >
              Gerar Relatórios
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}