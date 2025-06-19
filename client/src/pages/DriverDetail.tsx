import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Edit, 
  Trash2, 
  ArrowLeft, 
  Calendar,
  Fuel,
  Wrench,
  MapPin,
  TrendingUp,
  Clock,
  Phone,
  CreditCard
} from "lucide-react";
import { Driver, VehicleRegistration } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DriverDetail() {
  const { id } = useParams();
  
  const { data: driver, isLoading: driverLoading } = useQuery<Driver>({
    queryKey: [`/api/drivers/${id}`],
  });
  
  const { data: registrations = [], isLoading: registrationsLoading } = useQuery<VehicleRegistration[]>({
    queryKey: [`/api/registrations?driverId=${id}`],
  });

  if (driverLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Motorista não encontrado</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">O motorista solicitado não existe.</p>
        <Link href="/cadastros">
          <Button className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Cadastros
          </Button>
        </Link>
      </div>
    );
  }

  // Filter registrations by type
  const fuelRegistrations = registrations.filter(r => r.type === 'fuel');
  const maintenanceRegistrations = registrations.filter(r => r.type === 'maintenance');
  const tripRegistrations = registrations.filter(r => r.type === 'trip');

  // Calculate statistics
  const totalFuelCost = fuelRegistrations.reduce((sum, r) => sum + (r.fuelCost || 0), 0);
  const totalMaintenanceCost = maintenanceRegistrations.reduce((sum, r) => sum + (r.maintenanceCost || 0), 0);
  const totalKilometers = tripRegistrations.reduce((sum, r) => {
    const distance = r.finalKm && r.initialKm ? r.finalKm - r.initialKm : 0;
    return sum + distance;
  }, 0);

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/cadastros">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <User className="h-8 w-8 mr-3 text-blue-600" />
              {driver.name}
            </h1>
            <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400 mt-1">
              <div className="flex items-center">
                <CreditCard className="h-4 w-4 mr-1" />
                CNH: {driver.license}
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-1" />
                {driver.phone}
              </div>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link href={`/cadastros/drivers/edit/${driver.id}`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
          <Button variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Driver Image */}
      {driver.imageUrl && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <img 
              src={driver.imageUrl} 
              alt={driver.name}
              className="w-48 h-48 mx-auto rounded-full shadow-lg object-cover"
            />
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
              <Fuel className="h-4 w-4 mr-2" />
              Combustível
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              R$ {(totalFuelCost / 100).toFixed(2)}
            </div>
            <p className="text-xs text-gray-500">{fuelRegistrations.length} abastecimentos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
              <Wrench className="h-4 w-4 mr-2" />
              Manutenções
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {(totalMaintenanceCost / 100).toFixed(2)}
            </div>
            <p className="text-xs text-gray-500">{maintenanceRegistrations.length} manutenções</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Quilometragem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {totalKilometers.toLocaleString()} km
            </div>
            <p className="text-xs text-gray-500">{tripRegistrations.length} viagens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Atividades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {registrations.length}
            </div>
            <p className="text-xs text-gray-500">registros totais</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumo de Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Consumo médio</span>
                <span className="font-semibold">
                  {fuelRegistrations.length > 0 && totalKilometers > 0 
                    ? (totalKilometers / fuelRegistrations.reduce((sum, r) => sum + (r.liters || 0), 0)).toFixed(1)
                    : '0'} km/L
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Custo por km</span>
                <span className="font-semibold">
                  R$ {totalKilometers > 0 
                    ? ((totalFuelCost + totalMaintenanceCost) / 100 / totalKilometers).toFixed(2)
                    : '0.00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Última atividade</span>
                <span className="font-semibold">
                  {registrations.length > 0 
                    ? format(new Date(Math.max(...registrations.map(r => new Date(r.date).getTime()))), 'dd/MM/yyyy')
                    : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Atividades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Fuel className="h-4 w-4 text-blue-600 mr-2" />
                  <span>Abastecimentos</span>
                </div>
                <Badge variant="default">{fuelRegistrations.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Wrench className="h-4 w-4 text-green-600 mr-2" />
                  <span>Manutenções</span>
                </div>
                <Badge variant="secondary">{maintenanceRegistrations.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-purple-600 mr-2" />
                  <span>Viagens</span>
                </div>
                <Badge variant="outline">{tripRegistrations.length}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Atividades Recentes
          </CardTitle>
          <CardDescription>
            Últimas 10 atividades realizadas por este motorista
          </CardDescription>
        </CardHeader>
        <CardContent>
          {registrationsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma atividade registrada ainda.</p>
              <Link href="/registros">
                <Button className="mt-4">Criar Primeiro Registro</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {registrations
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10)
                .map((registration) => (
                  <div key={registration.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                        {registration.type === 'fuel' && <Fuel className="h-4 w-4 text-blue-600" />}
                        {registration.type === 'maintenance' && <Wrench className="h-4 w-4 text-green-600" />}
                        {registration.type === 'trip' && <MapPin className="h-4 w-4 text-purple-600" />}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={
                            registration.type === 'fuel' ? 'default' :
                            registration.type === 'maintenance' ? 'secondary' : 'outline'
                          }>
                            {registration.type === 'fuel' ? 'Combustível' :
                             registration.type === 'maintenance' ? 'Manutenção' : 'Viagem'}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {format(new Date(registration.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {registration.type === 'fuel' && `${registration.liters}L - R$ ${((registration.fuelCost || 0) / 100).toFixed(2)}`}
                          {registration.type === 'maintenance' && `R$ ${((registration.maintenanceCost || 0) / 100).toFixed(2)}`}
                          {registration.type === 'trip' && `${registration.origin} → ${registration.destination} (${registration.finalKm && registration.initialKm ? registration.finalKm - registration.initialKm : 0}km)`}
                        </p>
                      </div>
                    </div>
                    <Link href={`/registros/view/${registration.id}`}>
                      <Button variant="outline" size="sm">Ver Detalhes</Button>
                    </Link>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}