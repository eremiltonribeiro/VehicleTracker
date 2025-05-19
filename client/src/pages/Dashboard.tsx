import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CalendarCheck, Car, User } from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  
  const { data: vehicles = [] } = useQuery({
    queryKey: ['/api/vehicles'],
  }) as { data: any[] };
  
  const { data: drivers = [] } = useQuery({
    queryKey: ['/api/drivers'],
  }) as { data: any[] };
  
  const { data: registrations = [] } = useQuery({
    queryKey: ['/api/registrations'],
  }) as { data: any[] };

  // Estatísticas para o dashboard
  const stats = [
    {
      title: 'Veículos',
      value: Array.isArray(vehicles) ? vehicles.length : 0,
      icon: <Car className="h-6 w-6" />,
      description: 'Total da frota',
      color: 'bg-blue-100 text-blue-700'
    },
    {
      title: 'Motoristas',
      value: Array.isArray(drivers) ? drivers.length : 0,
      icon: <User className="h-6 w-6" />,
      description: 'Cadastrados',
      color: 'bg-green-100 text-green-700'
    },
    {
      title: 'Registros',
      value: Array.isArray(registrations) ? registrations.length : 0,
      icon: <CalendarCheck className="h-6 w-6" />,
      description: 'Total de registros',
      color: 'bg-purple-100 text-purple-700'
    },
    {
      title: 'Alertas',
      value: 0,
      icon: <AlertCircle className="h-6 w-6" />,
      description: 'Manutenções pendentes',
      color: 'bg-orange-100 text-orange-700'
    },
  ];

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral da frota e ações rápidas
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="actions">Ações Rápidas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <Card key={i}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`p-3 rounded-full ${stat.color}`}>
                      {stat.icon}
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.title}</div>
                      <div className="text-xs text-muted-foreground">{stat.description}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <QuickActions />
              
              <Card>
                <CardHeader>
                  <CardTitle>Próximas Manutenções</CardTitle>
                  <CardDescription>Veículos com manutenção programada</CardDescription>
                </CardHeader>
                <CardContent>
                  {registrations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma manutenção programada
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Lista de manutenções */}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="actions">
            <div className="grid grid-cols-1 gap-4">
              <QuickActions />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}