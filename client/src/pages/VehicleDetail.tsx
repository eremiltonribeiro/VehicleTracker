import { useParams, Link } from "wouter";
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
  Clock
} from "lucide-react";
import { Vehicle, VehicleRegistration } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function VehicleDetail() {
  const { id } = useParams();
  
  const { data: vehicle, isLoading: vehicleLoading } = useQuery<Vehicle>({
    queryKey: [`/api/vehicles/${id}`],
  });
  
  const { data: registrations = [], isLoading: registrationsLoading } = useQuery<VehicleRegistration[]>({
    queryKey: [`/api/registrations?vehicleId=${id}`],
  });

  if (vehicleLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Veículo não encontrado</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">O veículo solicitado não existe.</p>
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
              <Car className="h-8 w-8 mr-3 text-blue-600" />
              {vehicle.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {vehicle.model} • {vehicle.year} • Placa: {vehicle.plate}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link href={`/cadastros/vehicles/edit/${vehicle.id}`}>
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

      {/* Vehicle Image */}
      {vehicle.imageUrl && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <img 
              src={vehicle.imageUrl} 
              alt={vehicle.name}
              className="w-full max-w-md mx-auto rounded-lg shadow-lg"
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
              Total Combustível
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
              Total Manutenção
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
              Registros Totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {registrations.length}
            </div>
            <p className="text-xs text-gray-500">atividades registradas</p>
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
            Últimas 10 atividades registradas para este veículo
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