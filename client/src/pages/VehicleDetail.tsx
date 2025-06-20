import { useParams, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Car, 
  Edit, 
  Trash2, 
  ArrowLeft, 
  Calendar,
  Fuel,
  Wrench,
  MapPin,
  TrendingUp,
  Clock,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Plus
} from "lucide-react";
import { Vehicle, VehicleRegistration } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const [_, setLocation] = useLocation();

  const { data: vehicle, isLoading: vehicleLoading } = useQuery<Vehicle>({
    queryKey: [`/api/vehicles/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/vehicles/${id}`);
      if (!res.ok) throw new Error("Veículo não encontrado");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: registrations = [], isLoading: registrationsLoading } = useQuery<VehicleRegistration[]>({
    queryKey: [`/api/vehicles/${id}/registrations`],
    queryFn: async () => {
      const res = await fetch(`/api/registrations?vehicleId=${id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!id,
  });

  const { data: statistics } = useQuery({
    queryKey: [`/api/vehicles/${id}/statistics`],
    queryFn: async () => {
      // Calcular estatísticas com base nos registros
      const fuelRegistrations = registrations.filter(r => r.type === 'fuel');
      const maintenanceRegistrations = registrations.filter(r => r.type === 'maintenance');
      const tripRegistrations = registrations.filter(r => r.type === 'trip');

      const totalFuelCost = fuelRegistrations.reduce((sum, r) => sum + (r.fuelCost || 0), 0);
      const totalMaintenanceCost = maintenanceRegistrations.reduce((sum, r) => sum + (r.maintenanceCost || 0), 0);
      const totalLiters = fuelRegistrations.reduce((sum, r) => sum + (r.liters || 0), 0);
      
      const totalKm = tripRegistrations.reduce((sum, r) => {
        const km = (r.finalKm || 0) - (r.initialKm || 0);
        return sum + Math.max(0, km);
      }, 0);

      const averageConsumption = totalKm > 0 && totalLiters > 0 
        ? totalKm / totalLiters 
        : 0;

      return {
        totalRegistrations: registrations.length,
        totalFuelCost,
        totalMaintenanceCost,
        totalCost: totalFuelCost + totalMaintenanceCost,
        totalLiters,
        totalKm,
        averageConsumption,
        lastFueling: fuelRegistrations[0],
        lastMaintenance: maintenanceRegistrations[0],
        lastTrip: tripRegistrations[0]
      };
    },
    enabled: registrations.length > 0,
  });

  if (vehicleLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Carregando veículo...</span>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Car className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Veículo não encontrado</h2>
        <p className="text-gray-600 mb-4">O veículo solicitado não existe ou foi removido.</p>
        <Button onClick={() => setLocation("/configuracoes")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Configurações
        </Button>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  const getRegistrationIcon = (type: string) => {
    switch (type) {
      case 'fuel': return <Fuel className="h-4 w-4 text-green-600" />;
      case 'maintenance': return <Wrench className="h-4 w-4 text-red-600" />;
      case 'trip': return <MapPin className="h-4 w-4 text-blue-600" />;
      default: return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRegistrationLabel = (type: string) => {
    switch (type) {
      case 'fuel': return 'Abastecimento';
      case 'maintenance': return 'Manutenção';
      case 'trip': return 'Viagem';
      default: return 'Registro';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <div>
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/configuracoes")}
            className="mb-4 p-0 h-auto font-normal text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar para Configurações
          </Button>
          
          <div className="flex items-center gap-4">
            {vehicle.imageUrl ? (
              <img 
                src={vehicle.imageUrl} 
                alt={vehicle.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                <Car className="h-8 w-8 text-blue-600" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{vehicle.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="font-mono">
                  {vehicle.plate}
                </Badge>
                <span className="text-gray-600">{vehicle.model} • {vehicle.year}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setLocation(`/vehicles/${id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button 
            variant="outline"
            onClick={() => setLocation(`/registros?vehicleId=${id}`)}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Registro
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Registros</p>
                  <p className="text-2xl font-bold">{statistics.totalRegistrations}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Custo Total</p>
                  <p className="text-2xl font-bold">{formatCurrency(statistics.totalCost)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Quilometragem</p>
                  <p className="text-2xl font-bold">{statistics.totalKm.toLocaleString()} km</p>
                </div>
                <MapPin className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Consumo Médio</p>
                  <p className="text-2xl font-bold">
                    {statistics.averageConsumption > 0 
                      ? `${statistics.averageConsumption.toFixed(1)} km/L`
                      : '--'
                    }
                  </p>
                </div>
                <Fuel className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Last Activities */}
      {statistics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {statistics.lastFueling && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Fuel className="h-5 w-5 text-green-600" />
                  Último Abastecimento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Data:</span>
                    <span className="text-sm font-medium">
                      {format(new Date(statistics.lastFueling.date), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Litros:</span>
                    <span className="text-sm font-medium">{statistics.lastFueling.liters}L</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Valor:</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(statistics.lastFueling.fuelCost || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {statistics.lastMaintenance && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-red-600" />
                  Última Manutenção
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Data:</span>
                    <span className="text-sm font-medium">
                      {format(new Date(statistics.lastMaintenance.date), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Valor:</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(statistics.lastMaintenance.maintenanceCost || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {statistics.lastTrip && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  Última Viagem
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Data:</span>
                    <span className="text-sm font-medium">
                      {format(new Date(statistics.lastTrip.date), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Destino:</span>
                    <span className="text-sm font-medium">{statistics.lastTrip.destination}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Distância:</span>
                    <span className="text-sm font-medium">
                      {((statistics.lastTrip.finalKm || 0) - (statistics.lastTrip.initialKm || 0))} km
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Recent Registrations */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Histórico de Registros</CardTitle>
              <CardDescription>
                Últimos registros deste veículo
              </CardDescription>
            </div>
            <Button 
              variant="outline"
              onClick={() => setLocation(`/registros/history?vehicleId=${id}`)}
            >
              Ver Todos
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {registrationsLoading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum registro encontrado</h3>
              <p className="text-gray-600 mb-4">Este veículo ainda não possui registros.</p>
              <Button onClick={() => setLocation(`/registros?vehicleId=${id}`)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Registro
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {registrations.slice(0, 5).map((registration) => (
                <div key={registration.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    {getRegistrationIcon(registration.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-sm">
                          {getRegistrationLabel(registration.type)}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {format(new Date(registration.date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                      <div className="text-right">
                        {registration.type === 'fuel' && (
                          <div className="text-sm font-medium">
                            {formatCurrency(registration.fuelCost || 0)}
                          </div>
                        )}
                        {registration.type === 'maintenance' && (
                          <div className="text-sm font-medium">
                            {formatCurrency(registration.maintenanceCost || 0)}
                          </div>
                        )}
                        {registration.type === 'trip' && (
                          <div className="text-sm font-medium">
                            {registration.destination}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
