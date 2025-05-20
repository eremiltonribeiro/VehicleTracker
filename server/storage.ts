import {
  User,
  UpsertUser,
  users,
  Vehicle,
  InsertVehicle,
  Driver,
  InsertDriver,
  FuelStation,
  InsertFuelStation,
  FuelType,
  InsertFuelType,
  MaintenanceType,
  InsertMaintenanceType,
  VehicleRegistration,
  InsertRegistration,
  ChecklistTemplate,
  InsertChecklistTemplate,
  ChecklistItem,
  InsertChecklistItem,
  VehicleChecklist,
  InsertVehicleChecklist,
  ChecklistResult,
  InsertChecklistResult
} from "@shared/schema";

// Extend the storage interface with CRUD methods
export interface IStorage {
  // Métodos de usuário para Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Vehicle methods
  getVehicles(): Promise<Vehicle[]>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;

  // Driver methods
  getDrivers(): Promise<Driver[]>;
  getDriver(id: number): Promise<Driver | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;

  // Fuel station methods
  getFuelStations(): Promise<FuelStation[]>;
  getFuelStation(id: number): Promise<FuelStation | undefined>;
  createFuelStation(fuelStation: InsertFuelStation): Promise<FuelStation>;

  // Fuel type methods
  getFuelTypes(): Promise<FuelType[]>;
  getFuelType(id: number): Promise<FuelType | undefined>;
  createFuelType(fuelType: InsertFuelType): Promise<FuelType>;

  // Maintenance type methods
  getMaintenanceTypes(): Promise<MaintenanceType[]>;
  getMaintenanceType(id: number): Promise<MaintenanceType | undefined>;
  createMaintenanceType(maintenanceType: InsertMaintenanceType): Promise<MaintenanceType>;

  // Vehicle registration methods
  getRegistrations(filters?: {
    type?: string;
    vehicleId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<VehicleRegistration[]>;
  getRegistration(id: number): Promise<VehicleRegistration | undefined>;
  createRegistration(
    registration: InsertRegistration
  ): Promise<VehicleRegistration>;
  updateRegistration(id: number, data: any): Promise<VehicleRegistration>;
  deleteRegistration(id: number): Promise<boolean>;

  // Checklist template methods
  getChecklistTemplates(): Promise<ChecklistTemplate[]>;
  getChecklistTemplate(id: number): Promise<ChecklistTemplate | undefined>;
  createChecklistTemplate(template: InsertChecklistTemplate): Promise<ChecklistTemplate>;

  // Checklist item methods
  getChecklistItems(templateId: number): Promise<ChecklistItem[]>;
  getChecklistItem(id: number): Promise<ChecklistItem | undefined>;
  createChecklistItem(item: InsertChecklistItem): Promise<ChecklistItem>;

  // Vehicle checklist methods
  getVehicleChecklists(filters?: {
    vehicleId?: number;
    driverId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<VehicleChecklist[]>;
  getVehicleChecklist(id: number): Promise<VehicleChecklist | undefined>;
  createVehicleChecklist(checklist: InsertVehicleChecklist): Promise<VehicleChecklist>;
  updateVehicleChecklist(id: number, data: any): Promise<VehicleChecklist>;
  deleteVehicleChecklist(id: number): Promise<boolean>;

  // Checklist result methods
  getChecklistResults(checklistId: number): Promise<ChecklistResult[]>;
  getChecklistResult(id: number): Promise<ChecklistResult | undefined>;
  createChecklistResult(result: InsertChecklistResult): Promise<ChecklistResult>;
  deleteChecklistResults(checklistId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private vehicles: Map<number, Vehicle>;
  private drivers: Map<number, Driver>;
  private fuelStations: Map<number, FuelStation>;
  private fuelTypes: Map<number, FuelType>;
  private maintenanceTypes: Map<number, MaintenanceType>;
  private registrations: Map<number, VehicleRegistration>;
  private checklistTemplates: Map<number, ChecklistTemplate>;
  private checklistItems: Map<number, ChecklistItem>;
  private vehicleChecklists: Map<number, VehicleChecklist>;
  private checklistResults: Map<number, ChecklistResult>;

  private userCurrentId: number;
  private vehicleCurrentId: number;
  private driverCurrentId: number;
  private fuelStationCurrentId: number;
  private fuelTypeCurrentId: number;
  private maintenanceTypeCurrentId: number;
  private registrationCurrentId: number;
  private checklistTemplateCurrentId: number;
  private checklistItemCurrentId: number;
  private vehicleChecklistCurrentId: number;
  private checklistResultCurrentId: number;

  constructor() {
    this.users = new Map();
    this.vehicles = new Map();
    this.drivers = new Map();
    this.fuelStations = new Map();
    this.fuelTypes = new Map();
    this.maintenanceTypes = new Map();
    this.registrations = new Map();
    this.checklistTemplates = new Map();
    this.checklistItems = new Map();
    this.vehicleChecklists = new Map();
    this.checklistResults = new Map();

    this.userCurrentId = 1;
    this.vehicleCurrentId = 1;
    this.driverCurrentId = 1;
    this.fuelStationCurrentId = 1;
    this.fuelTypeCurrentId = 1;
    this.maintenanceTypeCurrentId = 1;
    this.registrationCurrentId = 1;
    this.checklistTemplateCurrentId = 1;
    this.checklistItemCurrentId = 1;
    this.vehicleChecklistCurrentId = 1;
    this.checklistResultCurrentId = 1;

    // Add initial data
    this.initializeData();
  }

  private initializeData() {
    // Add vehicles
    this.createVehicle({ name: "Ford Ranger", plate: "ABC-1234", model: "Ranger XLT", year: 2020 });
    this.createVehicle({ name: "Toyota Hilux", plate: "DEF-5678", model: "Hilux SRV", year: 2021 });
    this.createVehicle({ name: "Fiat Toro", plate: "GHI-9012", model: "Toro Freedom", year: 2019 });
    this.createVehicle({ name: "Volkswagen Amarok", plate: "JKL-3456", model: "Amarok Highline", year: 2022 });

    // Add drivers
    this.createDriver({ name: "João Silva", license: "12345678", phone: "(11) 98765-4321" });
    this.createDriver({ name: "Maria Oliveira", license: "87654321", phone: "(11) 91234-5678" });
    this.createDriver({ name: "Carlos Santos", license: "45678912", phone: "(11) 94567-8912" });
    this.createDriver({ name: "Ana Pereira", license: "78912345", phone: "(11) 97891-2345" });

    // Add fuel stations
    this.createFuelStation({ name: "Posto Ipiranga", address: "Av. Paulista, 1000" });
    this.createFuelStation({ name: "Posto Shell", address: "Rua Augusta, 500" });
    this.createFuelStation({ name: "Posto Petrobras", address: "Av. Rebouças, 750" });
    this.createFuelStation({ name: "Posto Ale", address: "Av. Faria Lima, 2000" });

    // Add fuel types
    this.createFuelType({ name: "Gasolina Comum" });
    this.createFuelType({ name: "Gasolina Aditivada" });
    this.createFuelType({ name: "Etanol" });
    this.createFuelType({ name: "Diesel S10" });
    this.createFuelType({ name: "Diesel S500" });

    // Add maintenance types
    this.createMaintenanceType({ name: "Troca de Óleo" });
    this.createMaintenanceType({ name: "Revisão Periódica" });
    this.createMaintenanceType({ name: "Troca de Pneus" });
    this.createMaintenanceType({ name: "Reparo no Motor" });
    this.createMaintenanceType({ name: "Reparo na Suspensão" });
    this.createMaintenanceType({ name: "Reparo nos Freios" });
    this.createMaintenanceType({ name: "Outro" });

    // Add checklist templates
    const dailyTemplate = this.createChecklistTemplate({
      name: "Checklist Diário",
      description: "Itens básicos a serem verificados antes de cada viagem",
      isDefault: true
    });

    const weeklyTemplate = this.createChecklistTemplate({
      name: "Checklist Semanal",
      description: "Verificação mais completa para ser realizada uma vez por semana",
      isDefault: false
    });

    // Add checklist items for daily template
    this.createChecklistItem({
      templateId: dailyTemplate.id,
      name: "Verificação do óleo do motor",
      description: "Verificar nível do óleo",
      isRequired: true,
      category: "Motor",
      order: 1
    });

    this.createChecklistItem({
      templateId: dailyTemplate.id,
      name: "Verificação do líquido de arrefecimento",
      description: "Verificar nível do radiador",
      isRequired: true,
      category: "Motor",
      order: 2
    });

    this.createChecklistItem({
      templateId: dailyTemplate.id,
      name: "Verificação dos freios",
      description: "Verificar funcionamento e nível do fluido",
      isRequired: true,
      category: "Segurança",
      order: 3
    });

    this.createChecklistItem({
      templateId: dailyTemplate.id,
      name: "Verificação das luzes",
      description: "Testar faróis, lanternas e setas",
      isRequired: true,
      category: "Segurança",
      order: 4
    });

    this.createChecklistItem({
      templateId: dailyTemplate.id,
      name: "Verificação da pressão dos pneus",
      description: "Verificar pressão conforme manual",
      isRequired: true,
      category: "Pneus",
      order: 5
    });

    // Add items for weekly template
    this.createChecklistItem({
      templateId: weeklyTemplate.id,
      name: "Verificação da suspensão",
      description: "Verificar amortecedores e molas",
      isRequired: true,
      category: "Suspensão",
      order: 1
    });

    this.createChecklistItem({
      templateId: weeklyTemplate.id,
      name: "Verificação da bateria",
      description: "Verificar terminais e carga",
      isRequired: true,
      category: "Elétrica",
      order: 2
    });

    this.createChecklistItem({
      templateId: weeklyTemplate.id,
      name: "Verificação do filtro de ar",
      description: "Verificar limpeza do filtro",
      isRequired: true,
      category: "Motor",
      order: 3
    });

    // Sample vehicle checklist
    const sampleChecklist = this.createVehicleChecklist({
      vehicleId: 1,
      driverId: 1,
      templateId: dailyTemplate.id,
      date: new Date(),
      observations: "Veículo em boas condições gerais",
      odometer: 5430,
      status: "complete",
      photoUrl: null
    });

    // Sample checklist results
    this.createChecklistResult({
      checklistId: sampleChecklist.id,
      itemId: 1,
      status: "ok",
      observation: null,
      photoUrl: null
    });

    this.createChecklistResult({
      checklistId: sampleChecklist.id,
      itemId: 2,
      status: "ok",
      observation: null,
      photoUrl: null
    });

    this.createChecklistResult({
      checklistId: sampleChecklist.id,
      itemId: 3,
      status: "issue",
      observation: "Freios com desgaste acentuado, programar manutenção",
      photoUrl: "/uploads/freios.jpg"
    });

    this.createChecklistResult({
      checklistId: sampleChecklist.id,
      itemId: 4,
      status: "ok",
      observation: null,
      photoUrl: null
    });

    this.createChecklistResult({
      checklistId: sampleChecklist.id,
      itemId: 5,
      status: "ok",
      observation: null,
      photoUrl: null
    });

    // Add sample registrations
    const now = new Date();
    const fiveDaysAgo = new Date(now);
    fiveDaysAgo.setDate(now.getDate() - 5);
    const tenDaysAgo = new Date(now);
    tenDaysAgo.setDate(now.getDate() - 10);

    // Sample fuel registration
    this.createRegistration({
      type: "fuel",
      vehicleId: 1,
      driverId: 1,
      date: fiveDaysAgo,
      initialKm: 45000,
      finalKm: null,
      fuelStationId: 1,
      fuelTypeId: 4, // Diesel S10
      liters: 40.5,
      fuelCost: 25000, // R$ 250,00
      fullTank: true,
      arla: false,
      maintenanceTypeId: null,
      maintenanceCost: null,
      destination: null,
      reason: null,
      observations: "Abastecimento completo para viagem",
      photoUrl: "/uploads/fuel-receipt-sample.jpg",
    });

    // Sample maintenance registration
    this.createRegistration({
      type: "maintenance",
      vehicleId: 2,
      driverId: 3,
      date: tenDaysAgo,
      initialKm: 32500,
      finalKm: null,
      fuelStationId: null,
      fuelTypeId: null,
      liters: null,
      fuelCost: null,
      fullTank: null,
      arla: null,
      maintenanceTypeId: 1, // Troca de Óleo
      maintenanceCost: 35000, // R$ 350,00
      destination: null,
      reason: null,
      observations: "Troca de óleo realizada conforme programação",
      photoUrl: "/uploads/maintenance-receipt-sample.jpg",
    });

    // Sample trip registration
    this.createRegistration({
      type: "trip",
      vehicleId: 3,
      driverId: 2,
      date: tenDaysAgo,
      initialKm: 27800,
      finalKm: 28350,
      fuelStationId: null,
      fuelTypeId: null,
      liters: null,
      fuelCost: null,
      fullTank: null,
      arla: null,
      maintenanceTypeId: null,
      maintenanceCost: null,
      destination: "São Paulo - SP",
      reason: "Reunião com cliente",
      observations: "Viagem realizada com sucesso",
      photoUrl: null,
    });
  }

  // User methods (keeping original)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Vehicle methods
  async getVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values());
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const id = this.vehicleCurrentId++;
    const vehicle: Vehicle = { ...insertVehicle, id };
    this.vehicles.set(id, vehicle);
    return vehicle;
  }

  // Driver methods
  async getDrivers(): Promise<Driver[]> {
    return Array.from(this.drivers.values());
  }

  async getDriver(id: number): Promise<Driver | undefined> {
    return this.drivers.get(id);
  }

  async createDriver(insertDriver: InsertDriver): Promise<Driver> {
    const id = this.driverCurrentId++;
    const driver: Driver = { ...insertDriver, id };
    this.drivers.set(id, driver);
    return driver;
  }

  // Fuel station methods
  async getFuelStations(): Promise<FuelStation[]> {
    return Array.from(this.fuelStations.values());
  }

  async getFuelStation(id: number): Promise<FuelStation | undefined> {
    return this.fuelStations.get(id);
  }

  async createFuelStation(
    insertFuelStation: InsertFuelStation
  ): Promise<FuelStation> {
    const id = this.fuelStationCurrentId++;
    const fuelStation: FuelStation = { ...insertFuelStation, id };
    this.fuelStations.set(id, fuelStation);
    return fuelStation;
  }

  // Fuel type methods
  async getFuelTypes(): Promise<FuelType[]> {
    return Array.from(this.fuelTypes.values());
  }

  async getFuelType(id: number): Promise<FuelType | undefined> {
    return this.fuelTypes.get(id);
  }

  async createFuelType(insertFuelType: InsertFuelType): Promise<FuelType> {
    const id = this.fuelTypeCurrentId++;
    const fuelType: FuelType = { ...insertFuelType, id };
    this.fuelTypes.set(id, fuelType);
    return fuelType;
  }

  // Maintenance type methods
  async getMaintenanceTypes(): Promise<MaintenanceType[]> {
    return Array.from(this.maintenanceTypes.values());
  }

  async getMaintenanceType(id: number): Promise<MaintenanceType | undefined> {
    return this.maintenanceTypes.get(id);
  }

  async createMaintenanceType(
    insertMaintenanceType: InsertMaintenanceType
  ): Promise<MaintenanceType> {
    const id = this.maintenanceTypeCurrentId++;
    const maintenanceType: MaintenanceType = { ...insertMaintenanceType, id };
    this.maintenanceTypes.set(id, maintenanceType);
    return maintenanceType;
  }

  // Vehicle registration methods
  async updateRegistration(id: number, data: any): Promise<VehicleRegistration> {
    const existingRegistration = this.registrations.get(id);
    if (!existingRegistration) {
      throw new Error(`Registro com ID ${id} não encontrado`);
    }

    // Preservar campos que não foram fornecidos na atualização
    const updatedRegistration: VehicleRegistration = { 
      ...existingRegistration,
      ...data,
      id // Garantir que o ID não seja alterado
    };

    this.registrations.set(id, updatedRegistration);
    console.log(`Registro ${id} atualizado com sucesso:`, updatedRegistration);
    return updatedRegistration;
  }

  async getRegistrations(filters?: {
    type?: string;
    vehicleId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<VehicleRegistration[]> {
    let registrations = Array.from(this.registrations.values());

    if (filters) {
      if (filters.type) {
        registrations = registrations.filter((reg) => reg.type === filters.type);
      }

      if (filters.vehicleId) {
        registrations = registrations.filter(
          (reg) => reg.vehicleId === filters.vehicleId
        );
      }

      if (filters.startDate) {
        registrations = registrations.filter(
          (reg) => new Date(reg.date) >= filters.startDate!
        );
      }

      if (filters.endDate) {
        registrations = registrations.filter(
          (reg) => new Date(reg.date) <= filters.endDate!
        );
      }
    }

    // Sort by date (newest first)
    return registrations.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getRegistration(id: number): Promise<VehicleRegistration | undefined> {
    return this.registrations.get(id);
  }

  async createRegistration(
    insertRegistration: InsertRegistration
  ): Promise<VehicleRegistration> {
    const id = this.registrationCurrentId++;
    const registration: VehicleRegistration = { ...insertRegistration, id };
    this.registrations.set(id, registration);
    return registration;
  }

  async deleteRegistration(id: number): Promise<boolean> {
    const exists = this.registrations.has(id);
    if (!exists) {
      throw new Error(`Registro com ID ${id} não encontrado`);
    }
    const result = this.registrations.delete(id);
    console.log(`Registro ${id} excluído: ${result}`);
    return result;
  }

  // Checklist template methods
  async getChecklistTemplates(): Promise<ChecklistTemplate[]> {
    return Array.from(this.checklistTemplates.values());
  }

  async getChecklistTemplate(id: number): Promise<ChecklistTemplate | undefined> {
    return this.checklistTemplates.get(id);
  }

  async createChecklistTemplate(template: InsertChecklistTemplate): Promise<ChecklistTemplate> {
    const id = this.checklistTemplateCurrentId++;
    const checklistTemplate: ChecklistTemplate = { ...template, id };
    this.checklistTemplates.set(id, checklistTemplate);
    return checklistTemplate;
  }

  // Checklist item methods
  async getChecklistItems(templateId: number): Promise<ChecklistItem[]> {
    return Array.from(this.checklistItems.values())
      .filter(item => item.templateId === templateId)
      .sort((a, b) => a.order - b.order);
  }

  async getChecklistItem(id: number): Promise<ChecklistItem | undefined> {
    return this.checklistItems.get(id);
  }

  async createChecklistItem(item: InsertChecklistItem): Promise<ChecklistItem> {
    const id = this.checklistItemCurrentId++;
    const checklistItem: ChecklistItem = { ...item, id };
    this.checklistItems.set(id, checklistItem);
    return checklistItem;
  }

  // Vehicle checklist methods
  async getVehicleChecklists(filters?: {
    vehicleId?: number;
    driverId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<VehicleChecklist[]> {
    let checklists = Array.from(this.vehicleChecklists.values());

    if (filters) {
      if (filters.vehicleId) {
        checklists = checklists.filter(c => c.vehicleId === filters.vehicleId);
      }

      if (filters.driverId) {
        checklists = checklists.filter(c => c.driverId === filters.driverId);
      }

      if (filters.startDate) {
        checklists = checklists.filter(c => new Date(c.date) >= filters.startDate!);
      }

      if (filters.endDate) {
        checklists = checklists.filter(c => new Date(c.date) <= filters.endDate!);
      }
    }

    // Sort by date (newest first)
    return checklists.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getVehicleChecklist(id: number): Promise<VehicleChecklist | undefined> {
    return this.vehicleChecklists.get(id);
  }

  async createVehicleChecklist(checklist: InsertVehicleChecklist): Promise<VehicleChecklist> {
    const id = this.vehicleChecklistCurrentId++;

    // Garantir que a data está definida
    if (!checklist.date) {
      checklist.date = new Date();
    }

    const vehicleChecklist: VehicleChecklist = { ...checklist, id };
    this.vehicleChecklists.set(id, vehicleChecklist);
    return vehicleChecklist;
  }

  async updateVehicleChecklist(id: number, data: any): Promise<VehicleChecklist> {
    const existingChecklist = this.vehicleChecklists.get(id);
    if (!existingChecklist) {
      throw new Error(`Checklist with id ${id} not found`);
    }

    const updatedChecklist: VehicleChecklist = { ...existingChecklist, ...data, id };
    this.vehicleChecklists.set(id, updatedChecklist);
    return updatedChecklist;
  }

  async deleteVehicleChecklist(id: number): Promise<boolean> {
    return this.vehicleChecklists.delete(id);
  }

  // Checklist result methods
  async getChecklistResults(checklistId: number): Promise<ChecklistResult[]> {
    return Array.from(this.checklistResults.values())
      .filter(result => result.checklistId === checklistId);
  }

  async getChecklistResult(id: number): Promise<ChecklistResult | undefined> {
    return this.checklistResults.get(id);
  }

  async createChecklistResult(result: InsertChecklistResult): Promise<ChecklistResult> {
    const id = this.checklistResultCurrentId++;
    const checklistResult: ChecklistResult = { ...result, id };
    this.checklistResults.set(id, checklistResult);
    return checklistResult;
  }

  async deleteChecklistResults(checklistId: number): Promise<boolean> {
    const resultsToDelete = Array.from(this.checklistResults.values()).filter(
      (result) => result.checklistId === checklistId
    );

    for (const result of resultsToDelete) {
      this.checklistResults.delete(result.id);
    }

    return true;
  }

  // Implementação para Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    // Como estamos usando número no MemStorage mas string na interface
    // vamos tentar converter
    const numId = parseInt(id);
    return this.users.get(numId);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Verificar se o usuário já existe
    const existingUser = Array.from(this.users.values())
      .find(user => user.id === userData.id);

    if (existingUser) {
      // Atualizar usuário existente
      const updatedUser = { ...existingUser, ...userData, updatedAt: new Date() };
      this.users.set(parseInt(updatedUser.id), updatedUser);
      return updatedUser;
    } else {
      // Criar novo usuário
      const newUserId = userData.id || this.userCurrentId.toString();
      const newUser: User = { 
        ...userData, 
        id: newUserId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.users.set(parseInt(newUserId), newUser);
      this.userCurrentId = Math.max(this.userCurrentId, parseInt(newUserId) + 1);
      return newUser;
    }
  }
}

export const storage = new MemStorage();