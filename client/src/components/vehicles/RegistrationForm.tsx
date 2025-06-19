import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useLocation, useParams } from "wouter";
import { extendedRegistrationSchema } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { FileInput } from "@/components/ui/file-input";
import { Fuel, Wrench, MapPin, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type FormValues = z.infer<typeof extendedRegistrationSchema>;

interface RegistrationFormProps {
  editId?: string;
  editType?: string | null;
  mode?: "edit" | "view";
}

export function RegistrationForm({ editId, editType, mode }: RegistrationFormProps) {
  const { id } = useParams();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedType, setSelectedType] = useState<string>("fuel");
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(""); // Para preview em edição

  const form = useForm<FormValues>({
    resolver: zodResolver(extendedRegistrationSchema),
    defaultValues: {
      type: "fuel",
      date: new Date(),
      vehicleId: undefined,
      driverId: undefined,
      initialKm: undefined,
      finalKm: undefined,
      fuelStationId: undefined,
      fuelTypeId: undefined,
      maintenanceTypeId: undefined,
      liters: undefined,
      fuelCost: undefined,
      maintenanceCost: undefined,
      fullTank: false,
      arla: false,
      origin: undefined,
      destination: undefined,
      reason: undefined,
      observations: undefined,
    },
  });

  const watchType = form.watch("type");

  // Fetch all required data for the form with staleTime to evitar recarregamentos desnecessários
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useQuery({ 
    queryKey: ["/api/vehicles"], 
    staleTime: 60000 // 1 minuto
  });
  const { data: drivers = [], isLoading: isLoadingDrivers } = useQuery({ 
    queryKey: ["/api/drivers"],
    staleTime: 60000
  });
  const { data: fuelStations = [], isLoading: isLoadingFuelStations } = useQuery({ 
    queryKey: ["/api/fuel-stations"],
    staleTime: 60000
  });
  const { data: fuelTypes = [], isLoading: isLoadingFuelTypes } = useQuery({ 
    queryKey: ["/api/fuel-types"],
    staleTime: 60000
  });
  const { data: maintenanceTypes = [], isLoading: isLoadingMaintenanceTypes } = useQuery({ 
    queryKey: ["/api/maintenance-types"],
    staleTime: 60000
  });

  // --- Buscar dados para edição, se houver ID ---
  useEffect(() => {
    if (id) {
      console.log(`🔍 Iniciando busca de dados para edição - ID: ${id}`);
      fetch(`/api/registrations/${id}`, { credentials: "include" })
        .then((res) => {
          console.log(`📡 Resposta da API:`, res.status, res.statusText);
          if (!res.ok) {
            throw new Error(`Erro ao buscar registro: ${res.status} ${res.statusText}`);
          }
          return res.json();
        })
        .then((data) => {
          console.log(`📊 Dados recebidos para edição:`, data);
          // Certifique-se de que todos os campos necessários estão presentes
          const formData = {
            type: data.type || "fuel",
            date: data.date ? new Date(data.date) : new Date(),
            // IDs devem ser números válidos ou undefined (não null)
            vehicleId: data.vehicleId && data.vehicleId > 0 ? data.vehicleId : undefined,
            driverId: data.driverId && data.driverId > 0 ? data.driverId : undefined,
            fuelStationId: data.fuelStationId && data.fuelStationId > 0 ? data.fuelStationId : undefined,
            fuelTypeId: data.fuelTypeId && data.fuelTypeId > 0 ? data.fuelTypeId : undefined,
            maintenanceTypeId: data.maintenanceTypeId && data.maintenanceTypeId > 0 ? data.maintenanceTypeId : undefined,
            // Campos numéricos
            initialKm: data.initialKm && data.initialKm > 0 ? data.initialKm : undefined,
            finalKm: data.finalKm && data.finalKm > 0 ? data.finalKm : undefined,
            liters: data.liters && data.liters > 0 ? data.liters : undefined,
            // Conversão de centavos para reais
            fuelCost: data.fuelCost && data.fuelCost > 0 ? data.fuelCost / 100 : undefined,
            maintenanceCost: data.maintenanceCost && data.maintenanceCost > 0 ? data.maintenanceCost / 100 : undefined,
            // Campos booleanos
            fullTank: data.fullTank === true,
            arla: data.arla === true,
            // Campos de texto
            origin: data.origin || undefined,
            destination: data.destination || undefined,
            reason: data.reason || undefined,
            observations: data.observations || undefined,
          };
          
          console.log(`🎯 Dados mapeados para o formulário:`, formData);
          console.log(`🔧 Estado antes do reset:`, form.getValues());
          form.reset(formData);
          console.log(`✅ Estado após o reset:`, form.getValues());
          setSelectedType(data.type || "fuel");
          console.log(`🏷️ Tipo selecionado definido como:`, data.type || "fuel");
          setExistingPhotoUrl(data.photoUrl || "");
          console.log(`📸 URL da foto existente:`, data.photoUrl || "Nenhuma");
        })
        .catch((error) => {
          console.error(`❌ Erro ao carregar dados para edição:`, error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar os dados do registro. Tente novamente.",
            variant: "destructive",
          });
        });
    }
    // eslint-disable-next-line
  }, [id]);

  // Sincronizar selectedType com o valor do formulário
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "type" && value.type) {
        setSelectedType(value.type);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Mutation para criar ou editar
  const createOrUpdateRegistration = useMutation({
    mutationFn: async (values: FormValues) => {
      const formData = new FormData();
      const data = {
        ...values,
        // Mapear campos do formulário para o formato do banco se necessário
        fuelCost: values.fuelCost ? Math.round(values.fuelCost * 100) : undefined,
        maintenanceCost: values.maintenanceCost ? Math.round(values.maintenanceCost * 100) : undefined,
      };
      
      console.log(`Preparando ${id ? 'edição' : 'criação'} de registro:`, data);
      
      formData.append("data", JSON.stringify(data));
      if (selectedFile) {
        formData.append("photo", selectedFile);
      }
      
      const url = id ? `/api/registrations/${id}` : "/api/registrations";
      const method = id ? "PUT" : "POST";
      
      console.log(`Enviando requisição ${method} para ${url}`);
      
      try {
        const res = await fetch(url, {
          method,
          body: formData,
          credentials: "include",
        });
        
        console.log(`Resposta do servidor:`, res.status, res.statusText);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Erro na resposta:", errorText);
          let errorObj;
          try {
            errorObj = JSON.parse(errorText);
          } catch (e) {
            errorObj = { message: errorText };
          }
          throw new Error(errorObj.message || `Erro ao ${id ? 'atualizar' : 'criar'} registro (${res.status})`);
        }
        
        const responseData = await res.json();
        console.log("Dados da resposta:", responseData);
        return responseData;
      } catch (error) {
        console.error("Erro na requisição:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Registro salvo com sucesso.",
      });
      form.reset();
      setSelectedFile(null);
      
      // Invalidação mais agressiva do cache
      console.log("🔄 Invalidando cache de registrations");
      queryClient.invalidateQueries({ queryKey: ["/api/registrations"] });
      queryClient.removeQueries({ queryKey: ["/api/registrations"] });
      
      // Disparar evento customizado para notificar outros componentes
      console.log("🔄 Disparando evento registration-updated");
      window.dispatchEvent(new CustomEvent("registration-updated"));
      
      setLocation("/registros/history"); // URL corrigida para o histórico
    },
    onError: (error: Error) => {
      console.error("Erro ao salvar registro:", error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    // Validação adicional para comprovantes
    if (
      (values.type === "fuel" && !selectedFile && !existingPhotoUrl) ||
      (values.type === "maintenance" && !selectedFile && !existingPhotoUrl)
    ) {
      toast({
        title: "Erro",
        description: "É necessário enviar um comprovante para abastecimentos ou manutenções.",
        variant: "destructive",
      });
      return;
    }
    createOrUpdateRegistration.mutate(values);
  };

  const handleTypeSelect = (type: string) => {
    form.setValue("type", type as any);
    setSelectedType(type);
  };

  const isLoading =
    isLoadingVehicles ||
    isLoadingDrivers ||
    isLoadingFuelStations ||
    isLoadingFuelTypes ||
    isLoadingMaintenanceTypes;

  if (isLoading) {
    return (
      <Card className="w-full mb-20">
        <CardHeader>
          <CardTitle>Carregando...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full mb-20">
      <CardHeader>
        <CardTitle>Registro de Movimentação</CardTitle>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {/* Registration Type Selection */}
            <div className="space-y-2">
              <FormLabel>Tipo de Registro <span className="text-red-500">*</span></FormLabel>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  type="button"
                  className={cn(
                    "py-6 h-auto flex flex-col items-center justify-center",
                    selectedType === "fuel"
                      ? "bg-amber-500 text-white hover:bg-amber-600"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                  )}
                  onClick={() => handleTypeSelect("fuel")}
                >
                  <Fuel className="h-5 w-5 mb-1" />
                  <span>Abastecimento</span>
                </Button>
                <Button
                  type="button"
                  className={cn(
                    "py-6 h-auto flex flex-col items-center justify-center",
                    selectedType === "maintenance"
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                  )}
                  onClick={() => handleTypeSelect("maintenance")}
                >
                  <Wrench className="h-5 w-5 mb-1" />
                  <span>Manutenção</span>
                </Button>
                <Button
                  type="button"
                  className={cn(
                    "py-6 h-auto flex flex-col items-center justify-center",
                    selectedType === "trip"
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                  )}
                  onClick={() => handleTypeSelect("trip")}
                >
                  <MapPin className="h-5 w-5 mb-1" />
                  <span>Viagem</span>
                </Button>
              </div>
            </div>

            {/* Common Fields */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="vehicleId"
                render={({ field }) => {
                  console.log(`🚗 Select Veículo - Field Value:`, field.value, `Vehicles:`, Array.isArray(vehicles) ? vehicles.length : 0);
                  return (
                    <FormItem>
                      <FormLabel>Veículo <span className="text-red-500">*</span></FormLabel>
                      <Select
                        onValueChange={(value) => {
                          console.log(`🚗 Veículo selecionado:`, value);
                          field.onChange(parseInt(value));
                        }}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o veículo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(vehicles) && vehicles.map((vehicle: any) => (
                            <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                              {vehicle.name} - {vehicle.plate}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="driverId"
                render={({ field }) => {
                  console.log(`👨‍💼 Select Motorista - Field Value:`, field.value, `Drivers:`, Array.isArray(drivers) ? drivers.length : 0);
                  return (
                    <FormItem>
                      <FormLabel>Motorista <span className="text-red-500">*</span></FormLabel>
                      <Select
                        onValueChange={(value) => {
                          console.log(`👨‍💼 Motorista selecionado:`, value);
                          field.onChange(parseInt(value));
                        }}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o motorista" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(drivers) && drivers.map((driver: any) => (
                            <SelectItem key={driver.id} value={driver.id.toString()}>
                              {driver.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data <span className="text-red-500">*</span></FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          locale={ptBR}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="initialKm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>KM Inicial <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ex: 45000"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="finalKm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={watchType === "trip" ? "" : ""}>
                        KM Final {watchType === "trip" && <span className="text-red-500">*</span>}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ex: 45050"
                          value={field.value || ''}
                          onChange={(e) => 
                            field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Fuel Specific Fields */}
            {watchType === "fuel" && (
              <div className="space-y-4 border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium text-amber-600 mb-3">Dados do Abastecimento</h3>

                <FormField
                  control={form.control}
                  name="fuelStationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Posto <span className="text-red-500">*</span></FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o posto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(fuelStations) && fuelStations.map((station: any) => (
                            <SelectItem key={station.id} value={station.id.toString()}>
                              {station.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fuelTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Combustível <span className="text-red-500">*</span></FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o combustível" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(fuelTypes) && fuelTypes.map((type: any) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="liters"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Litros Abastecidos <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Ex: 45.5"
                            value={field.value || ''}
                            onChange={(e) => 
                              field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fuelCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor do Abastecimento <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Ex: 250.00"
                            value={field.value || ''}
                            onChange={(e) => 
                              field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                            }
                            className="pl-7"
                          />
                        </FormControl>
                        <div className="absolute mt-[9px] ml-3 text-gray-500">R$</div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fullTank"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Completou Tanque?</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="arla"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Abasteceu ARLA?</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  name="photoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comprovante <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <FileInput
                          accept={["image/jpeg", "image/png", "image/gif"]}
                          onFileChange={(file) => {
                            setSelectedFile(file);
                            field.onChange(file ? "temp" : existingPhotoUrl);
                          }}
                          defaultPreview={existingPhotoUrl || field.value}
                          error={form.formState.errors.photoUrl?.message}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Maintenance Specific Fields */}
            {watchType === "maintenance" && (
              <div className="space-y-4 border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium text-green-600 mb-3">Dados da Manutenção</h3>

                <FormField
                  control={form.control}
                  name="maintenanceTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Manutenção <span className="text-red-500">*</span></FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(maintenanceTypes) && maintenanceTypes.map((type: any) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maintenanceCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor da Manutenção <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Ex: 350.00"
                          value={field.value || ''}
                          onChange={(e) => 
                            field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                          }
                          className="pl-7"
                        />
                      </FormControl>
                      <div className="absolute mt-[9px] ml-3 text-gray-500">R$</div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="photoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comprovante <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <FileInput
                          accept={["image/jpeg", "image/png", "image/gif"]}
                          onFileChange={(file) => {
                            setSelectedFile(file);
                            field.onChange(file ? "temp" : existingPhotoUrl);
                          }}
                          defaultPreview={existingPhotoUrl || field.value}
                          error={form.formState.errors.photoUrl?.message}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Trip Specific Fields */}
            {watchType === "trip" && (
              <div className="space-y-4 border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium text-blue-600 mb-3">Dados da Viagem</h3>

                <FormField
                  control={form.control}
                  name="origin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origem <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Rio de Janeiro - RJ" 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destino <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: São Paulo - SP" 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Reunião com cliente" 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Common optional fields */}
            <div className="border-t border-gray-200 pt-4">
              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Observações adicionais sobre o registro" 
                        className="min-h-[100px]" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>

          <div className="px-6 py-4 bg-gray-50 border-t rounded-b-lg">
            <Button type="submit" className="w-full md:w-auto">
              Salvar Registro
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}

export default RegistrationForm;
