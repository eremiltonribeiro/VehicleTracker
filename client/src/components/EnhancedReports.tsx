import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  Filter, 
  Calendar,
  Car,
  User,
  Fuel,
  Wrench,
  MapPin,
  TrendingUp,
  DollarSign
} from "lucide-react";
import { VehicleRegistration, Vehicle, Driver } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function EnhancedReports() {
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    vehicleId: "",
    driverId: "",
    type: ""
  });

  const { data: registrations = [] } = useQuery<VehicleRegistration[]>({
    queryKey: ["/api/registrations"],
  });

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
  });

  // Filter registrations based on current filters
  const filteredRegistrations = registrations.filter(registration => {
    if (filters.startDate && new Date(registration.date) < new Date(filters.startDate)) return false;
    if (filters.endDate && new Date(registration.date) > new Date(filters.endDate)) return false;
    if (filters.vehicleId && registration.vehicleId !== parseInt(filters.vehicleId)) return false;
    if (filters.driverId && registration.driverId !== parseInt(filters.driverId)) return false;
    if (filters.type && registration.type !== filters.type) return false;
    return true;
  });

  // Calculate statistics
  const fuelRegistrations = filteredRegistrations.filter(r => r.type === 'fuel');
  const maintenanceRegistrations = filteredRegistrations.filter(r => r.type === 'maintenance');
  const tripRegistrations = filteredRegistrations.filter(r => r.type === 'trip');

  const totalFuelCost = fuelRegistrations.reduce((sum, r) => sum + (r.fuelCost || 0), 0);
  const totalMaintenanceCost = maintenanceRegistrations.reduce((sum, r) => sum + (r.maintenanceCost || 0), 0);
  const totalLiters = fuelRegistrations.reduce((sum, r) => sum + (r.liters || 0), 0);
  const totalKilometers = tripRegistrations.reduce((sum, r) => {
    const distance = r.finalKm && r.initialKm ? r.finalKm - r.initialKm : 0;
    return sum + distance;
  }, 0);

  const exportToPDF = () => {
    // Implementation for PDF export
    console.log("Exporting to PDF...");
  };

  const exportToCSV = () => {
    const csvContent = [
      ["Data", "Tipo", "Veículo", "Motorista", "Valor", "Observações"],
      ...filteredRegistrations.map(r => [
        format(new Date(r.date), 'dd/MM/yyyy'),
        r.type === 'fuel' ? 'Combustível' : r.type === 'maintenance' ? 'Manutenção' : 'Viagem',
        vehicles.find(v => v.id === r.vehicleId)?.name || 'N/A',
        drivers.find(d => d.id === r.driverId)?.name || 'N/A',
        r.type === 'fuel' ? `R$ ${((r.fuelCost || 0) / 100).toFixed(2)}` :
        r.type === 'maintenance' ? `R$ ${((r.maintenanceCost || 0) / 100).toFixed(2)}` : 'N/A',
        r.observations || ''
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Filter Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros de Relatório
          </CardTitle>
          <CardDescription>
            Configure os filtros para gerar relatórios personalizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="vehicleId">Veículo</Label>
              <Select value={filters.vehicleId} onValueChange={(value) => setFilters({...filters, vehicleId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os veículos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os veículos</SelectItem>
                  {vehicles.map(vehicle => (
                    <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                      {vehicle.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="driverId">Motorista</Label>
              <Select value={filters.driverId} onValueChange={(value) => setFilters({...filters, driverId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os motoristas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os motoristas</SelectItem>
                  {drivers.map(driver => (
                    <SelectItem key={driver.id} value={driver.id.toString()}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type">Tipo</Label>
              <Select value={filters.type} onValueChange={(value) => setFilters({...filters, type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os tipos</SelectItem>
                  <SelectItem value="fuel">Combustível</SelectItem>
                  <SelectItem value="maintenance">Manutenção</SelectItem>
                  <SelectItem value="trip">Viagem</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <p className="text-xs text-gray-500">{totalLiters.toFixed(1)}L em {fuelRegistrations.length} abastecimentos</p>
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
            <p className="text-xs text-gray-500">{maintenanceRegistrations.length} manutenções realizadas</p>
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
            <p className="text-xs text-gray-500">{tripRegistrations.length} viagens registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Custo Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              R$ {((totalFuelCost + totalMaintenanceCost) / 100).toFixed(2)}
            </div>
            <p className="text-xs text-gray-500">{filteredRegistrations.length} registros no período</p>
          </CardContent>
        </Card>
      </div>

      {/* Export Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Exportar Relatório</CardTitle>
              <CardDescription>
                Exporte os dados filtrados em diferentes formatos
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button onClick={exportToCSV} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
              <Button onClick={exportToPDF}>
                <FileText className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.slice(0, 50).map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell>
                      {format(new Date(registration.date), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        registration.type === 'fuel' ? 'default' :
                        registration.type === 'maintenance' ? 'secondary' : 'outline'
                      }>
                        {registration.type === 'fuel' ? 'Combustível' :
                         registration.type === 'maintenance' ? 'Manutenção' : 'Viagem'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {vehicles.find(v => v.id === registration.vehicleId)?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {drivers.find(d => d.id === registration.driverId)?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {registration.type === 'fuel' && `R$ ${((registration.fuelCost || 0) / 100).toFixed(2)}`}
                      {registration.type === 'maintenance' && `R$ ${((registration.maintenanceCost || 0) / 100).toFixed(2)}`}
                      {registration.type === 'trip' && 'N/A'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {registration.type === 'fuel' && `${registration.liters}L`}
                      {registration.type === 'maintenance' && registration.observations}
                      {registration.type === 'trip' && `${registration.origin} → ${registration.destination}`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredRegistrations.length > 50 && (
            <div className="text-center mt-4 text-sm text-gray-500">
              Mostrando primeiros 50 registros de {filteredRegistrations.length} encontrados
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}