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
      initialKm: undefined,
      finalKm: undefined,
      fullTank: false,
      arla: false,
    },
  });

  const watchType = form.watch("type");

  // Fetch all required data for the form
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useQuery({ queryKey: ["/api/vehicles"] });
  const { data: drivers = [], isLoading: isLoadingDrivers } = useQuery({ queryKey: ["/api/drivers"] });
  const { data: fuelStations = [], isLoading: isLoadingFuelStations } = useQuery({ queryKey: ["/api/fuel-stations"] });
  const { data: fuelTypes = [], isLoading: isLoadingFuelTypes } = useQuery({ queryKey: ["/api/fuel-types"] });
  const { data: maintenanceTypes = [], isLoading: isLoadingMaintenanceTypes } = useQuery({ queryKey: ["/api/maintenance-types"] });

  // --- Buscar dados para edição, se houver ID ---
  useEffect(() => {
    if (id) {
      fetch(`/api/registrations/${id}`, { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          form.reset({
            ...data,
            date: data.date ? new Date(data.date) : new Date(),
            fuelCost: data.fuelCost ? data.fuelCost / 100 : undefined,
            maintenanceCost: data.maintenanceCost ? data.maintenanceCost / 100 : undefined,
          });
          setSelectedType(data.type || "fuel");
          setExistingPhotoUrl(data.photoUrl || "");
        });
    }
    // eslint-disable-next-line
  }, [id]);

  // Mutation para criar ou editar
  const createOrUpdateRegistration = useMutation({
    mutationFn: async (values: FormValues) => {
      const formData = new FormData();
      const data = {
        ...values,
        fuelCost: values.fuelCost ? Math.round(values.fuelCost * 100) : undefined,
        maintenanceCost: values.maintenanceCost ? Math.round(values.maintenanceCost * 100) : undefined,
      };
      formData.append("data", JSON.stringify(data));
      if (selectedFile) {
        formData.append("photo", selectedFile);
      }
      const url = id ? `/api/registrations/${id}` : "/api/registrations";
      const method = id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erro ao salvar registro");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Registro salvo com sucesso.",
      });
      form.reset();
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["/api/registrations"] });
      setLocation("/?view=history");
    },
    onError: (error: Error) => {
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Veículo <span className="text-red-500">*</span></FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
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
                )}
              />

              <FormField
                control={form.control}
                name="driverId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motorista <span className="text-red-500">*</span></FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
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
                )}
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
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
                            field.onChange(e.target.value ? parseInt(e.target.value) : null)
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
                        defaultValue={field.value?.toString()}
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
                        defaultValue={field.value?.toString()}
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
                              field.onChange(e.target.value ? parseFloat(e.target.value) : null)
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
                              field.onChange(e.target.value ? parseFloat(e.target.value) : null)
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
                            checked={field.value}
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
                            checked={field.value}
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
                        defaultValue={field.value?.toString()}
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
                            field.onChange(e.target.value ? parseFloat(e.target.value) : null)
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
