import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Car, 
  Users, 
  ClipboardCheck, 
  BarChart3, 
  Settings, 
  FileText,
  Plus,
  History,
  TrendingUp,
  Calendar
} from "lucide-react";

export default function Portal() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Sistema de Gestão de Frota
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Granduvale Mineração - Portal Central
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/registros">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Novo Registro</CardTitle>
                    <CardDescription>Combustível, manutenção ou viagem</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/historico">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <History className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Histórico</CardTitle>
                    <CardDescription>Ver registros anteriores</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Dashboard</CardTitle>
                    <CardDescription>Análises e métricas</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Main Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Fleet Management */}
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Car className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <div>
                  <CardTitle>Gestão de Frota</CardTitle>
                  <CardDescription>Veículos e motoristas</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/cadastros">
                <Button variant="outline" className="w-full justify-start">
                  <Car className="h-4 w-4 mr-2" />
                  Gerenciar Veículos
                </Button>
              </Link>
              <Link href="/cadastros">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Gerenciar Motoristas
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Checklists */}
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <ClipboardCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
                <div>
                  <CardTitle>Checklists</CardTitle>
                  <CardDescription>Inspeções de veículos</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/checklists">
                <Button variant="outline" className="w-full justify-start">
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Nova Inspeção
                </Button>
              </Link>
              <Link href="/checklists/templates">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Templates
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Reports */}
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                <div>
                  <CardTitle>Relatórios</CardTitle>
                  <CardDescription>Análises e exportações</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/relatorios">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Gerar Relatórios
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Settings className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                <div>
                  <CardTitle>Configurações</CardTitle>
                  <CardDescription>Sistema e usuários</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/configuracoes">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </Button>
              </Link>
              <Link href="/usuarios">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Usuários
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 dark:text-gray-400">
          <p>© 2025 Granduvale Mineração - Sistema de Gestão de Frota</p>
        </div>
      </div>
    </div>
  );
}