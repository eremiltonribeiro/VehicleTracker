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
  VehicleChecklistWithDetails,
  InsertVehicleChecklist,
  ChecklistResult,
  InsertChecklistResult,
  Role,
  InsertRole,
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
  updateVehicle(id: number, data: any): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<boolean>;

  // Driver methods
  getDrivers(): Promise<Driver[]>;
  getDriver(id: number): Promise<Driver | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: number, data: any): Promise<Driver | undefined>;
  deleteDriver(id: number): Promise<boolean>;

  // Fuel station methods
  getFuelStations(): Promise<FuelStation[]>;
  getFuelStation(id: number): Promise<FuelStation | undefined>;
  createFuelStation(fuelStation: InsertFuelStation): Promise<FuelStation>;
  updateFuelStation(id: number, data: any): Promise<FuelStation | undefined>;
  deleteFuelStation(id: number): Promise<boolean>;

  // Fuel type methods
  getFuelTypes(): Promise<FuelType[]>;
  getFuelType(id: number): Promise<FuelType | undefined>;
  createFuelType(fuelType: InsertFuelType): Promise<FuelType>;
  updateFuelType(id: number, data: any): Promise<FuelType | undefined>;
  deleteFuelType(id: number): Promise<boolean>;

  // Maintenance type methods
  getMaintenanceTypes(): Promise<MaintenanceType[]>;
  getMaintenanceType(id: number): Promise<MaintenanceType | undefined>;
  createMaintenanceType(maintenanceType: InsertMaintenanceType): Promise<MaintenanceType>;
  updateMaintenanceType(id: number, data: any): Promise<MaintenanceType | undefined>;
  deleteMaintenanceType(id: number): Promise<boolean>;

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
  updateRegistration(id: number, data: any): Promise<VehicleRegistration | undefined>;
  deleteRegistration(id: number): Promise<boolean>;

  // Checklist template methods
  getChecklistTemplates(): Promise<ChecklistTemplate[]>;
  getChecklistTemplate(id: number): Promise<ChecklistTemplate | undefined>;
  createChecklistTemplate(template: InsertChecklistTemplate): Promise<ChecklistTemplate>;
  updateChecklistTemplate(id: number, data: Partial<InsertChecklistTemplate>): Promise<ChecklistTemplate | undefined>;
  deleteChecklistTemplate(id: number): Promise<boolean>;

  // Checklist item methods
  getChecklistItems(templateId: number): Promise<ChecklistItem[]>;
  getChecklistItem(id: number): Promise<ChecklistItem | undefined>;
  createChecklistItem(item: InsertChecklistItem): Promise<ChecklistItem>;
  updateChecklistItem(id: number, updates: Partial<InsertChecklistItem>): Promise<ChecklistItem | undefined>;
  deleteChecklistItem(id: number): Promise<boolean>;

  // Vehicle checklist methods
  getVehicleChecklists(filters?: {
    vehicleId?: number;
    driverId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<VehicleChecklist[]>;
  getVehicleChecklist(id: number): Promise<VehicleChecklistWithDetails | undefined>;
  createVehicleChecklist(checklist: InsertVehicleChecklist): Promise<VehicleChecklist>;
  updateVehicleChecklist(id: number, data: any): Promise<VehicleChecklist | undefined>;
  deleteVehicleChecklist(id: number): Promise<boolean>;

  // Checklist result methods
  getChecklistResults(checklistId: number): Promise<ChecklistResult[]>;
  getChecklistResult(id: number): Promise<ChecklistResult | undefined>;
  createChecklistResult(result: InsertChecklistResult): Promise<ChecklistResult>;
  updateChecklistResult(id: number, data: Partial<InsertChecklistResult>): Promise<ChecklistResult | undefined>;
  deleteChecklistResult(id: number): Promise<boolean>;
  deleteChecklistResults(checklistId: number): Promise<boolean>;

  // Role methods
  getRoles(): Promise<Role[]>;
  getRole(id: number): Promise<Role | undefined>;
  createRole(roleData: InsertRole): Promise<Role>;
  updateRole(id: number, roleData: Partial<InsertRole>): Promise<Role | undefined>;
  deleteRole(id: number): Promise<boolean>;

  // Extended User methods
  getAllUsers(): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  updateUserPassword(id: string, passwordHash: string): Promise<User | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>; // User ID is varchar in schema
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
  private roles: Map<number, Role>; // Added for MemStorage

  private userCurrentId: number; // This might be less relevant if user IDs are strings from Replit Auth
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
  private roleCurrentId: number; // Added for MemStorage

  constructor() {
    this.users = new Map(); // Keyed by string user ID
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
    this.roles = new Map(); // Initialize roles map

    this.userCurrentId = 1; // Potentially for numeric IDs if ever needed internally
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
    this.roleCurrentId = 1; // Initialize roleCurrentId

    // Add initial data
    this.initializeData();
  }

  private initializeData() {
    // Add initial roles for MemStorage
    this.createRole({ name: "admin", description: "Administrator", permissions: JSON.stringify({ dashboard: true, userManagement: true, settings: true }) });
    this.createRole({ name: "user", description: "Regular User", permissions: JSON.stringify({ dashboard: true }) });

    // Add sample vehicles
    this.createVehicle({
      name: "Gol",
      plate: "ABC-1234",
      model: "Gol",
      year: 2020
    });

    this.createVehicle({
      name: "Uno",
      plate: "XYZ-5678",
      model: "Uno",
      year: 2019
    });

    this.createVehicle({
      name: "HB20",
      plate: "DEF-9876",
      model: "HB20",
      year: 2021
    });

    // Add sample drivers
    this.createDriver({
      name: "João Silva",
      license: "12345678901",
      phone: "(11) 99999-9999"
    });

    this.createDriver({
      name: "Maria Santos", 
      license: "10987654321",
      phone: "(11) 88888-8888"
    });

    this.createDriver({
      name: "Carlos Oliveira",
      license: "11122233344",
      phone: "(11) 77777-7777"
    });

    // Add sample fuel stations
    this.createFuelStation({
      name: "Posto Shell",
      address: "Rua das Flores, 100"
    });

    this.createFuelStation({
      name: "Posto Ipiranga",
      address: "Av. Paulista, 1000"
    });

    this.createFuelStation({
      name: "Posto BR",
      address: "Rua Augusta, 500"
    });

    // Add sample fuel types
    this.createFuelType({
      name: "Gasolina Comum"
    });

    this.createFuelType({
      name: "Etanol"
    });

    this.createFuelType({
      name: "Diesel"
    });

    // Add sample maintenance types
    this.createMaintenanceType({
      name: "Troca de Óleo"
    });

    this.createMaintenanceType({
      name: "Alinhamento"
    });

    this.createMaintenanceType({
      name: "Reparo de Motor"
    });

    this.createMaintenanceType({
      name: "Revisão Geral"
    });

    this.createMaintenanceType({
      name: "Troca de Pneus"
    });

    // Adicionar dados de exemplo de registros para dashboard
    this.initializeSampleRegistrations();
    
    // Adicionar dados de exemplo de checklists
    this.initializeSampleChecklists();
  }

  private initializeSampleRegistrations() {
    const now = new Date();
    
    // Dados dos últimos 6 meses para análises realistas
    const dates: Date[] = [];
    for (let i = 0; i < 180; i += 7) { // A cada 7 dias
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      dates.push(date);
    }

    // Registros de Abastecimento (dados realistas)
    const fuelData = [
      { vehicleId: 1, liters: 45, cost: 25000, station: 1, type: 1, km: 25000 }, // Gol
      { vehicleId: 1, liters: 42, cost: 23500, station: 2, type: 1, km: 25500 },
      { vehicleId: 1, liters: 48, cost: 26800, station: 1, type: 1, km: 26000 },
      { vehicleId: 1, liters: 44, cost: 24600, station: 3, type: 1, km: 26500 },
      { vehicleId: 1, liters: 46, cost: 25700, station: 1, type: 1, km: 27000 },
      
      { vehicleId: 2, liters: 38, cost: 21300, station: 2, type: 1, km: 18000 }, // Uno
      { vehicleId: 2, liters: 40, cost: 22400, station: 1, type: 1, km: 18400 },
      { vehicleId: 2, liters: 37, cost: 20700, station: 3, type: 1, km: 18800 },
      { vehicleId: 2, liters: 39, cost: 21800, station: 2, type: 1, km: 19200 },
      
      { vehicleId: 3, liters: 50, cost: 28000, station: 1, type: 1, km: 12000 }, // HB20
      { vehicleId: 3, liters: 48, cost: 26800, station: 2, type: 1, km: 12500 },
      { vehicleId: 3, liters: 52, cost: 29100, station: 3, type: 1, km: 13000 },
    ];

    fuelData.forEach((data, index) => {
      this.createRegistration({
        type: "fuel",
        vehicleId: data.vehicleId,
        driverId: (data.vehicleId % 3) + 1, // Distribuir motoristas
        date: dates[index % dates.length].getTime(),
        initialKm: data.km,
        fuelStationId: data.station,
        fuelTypeId: data.type,
        liters: data.liters,
        fuelCost: data.cost,
        fullTank: true,
        arla: false
      });
    });

    // Registros de Manutenção (dados realistas)
    const maintenanceData = [
      { vehicleId: 1, type: 1, cost: 8000, km: 25200 }, // Troca de óleo - Gol
      { vehicleId: 1, type: 2, cost: 15000, km: 26200 }, // Alinhamento
      { vehicleId: 1, type: 4, cost: 35000, km: 27200 }, // Revisão geral
      
      { vehicleId: 2, type: 1, cost: 7500, km: 18200 }, // Troca de óleo - Uno
      { vehicleId: 2, type: 5, cost: 80000, km: 19000 }, // Troca de pneus
      
      { vehicleId: 3, type: 1, cost: 9000, km: 12200 }, // Troca de óleo - HB20
      { vehicleId: 3, type: 3, cost: 120000, km: 13200 }, // Reparo de motor
    ];

    maintenanceData.forEach((data, index) => {
      this.createRegistration({
        type: "maintenance",
        vehicleId: data.vehicleId,
        driverId: (data.vehicleId % 3) + 1,
        date: dates[(index * 3) % dates.length].getTime(),
        initialKm: data.km,
        maintenanceTypeId: data.type,
        maintenanceCost: data.cost
      });
    });

    // Registros de Viagem (dados realistas com origem)
    const tripData = [
      { vehicleId: 1, origin: "São Paulo", dest: "Campinas", reason: "Reunião", initialKm: 25000, finalKm: 25120 },
      { vehicleId: 1, origin: "Campinas", dest: "São Paulo", reason: "Retorno", initialKm: 25120, finalKm: 25240 },
      { vehicleId: 1, origin: "São Paulo", dest: "Santos", reason: "Entrega", initialKm: 25240, finalKm: 25320 },
      { vehicleId: 1, origin: "Santos", dest: "São Paulo", reason: "Retorno", initialKm: 25320, finalKm: 25400 },
      
      { vehicleId: 2, origin: "São Paulo", dest: "Ribeirão Preto", reason: "Visita técnica", initialKm: 18000, finalKm: 18350 },
      { vehicleId: 2, origin: "Ribeirão Preto", dest: "São Paulo", reason: "Retorno", initialKm: 18350, finalKm: 18700 },
      { vehicleId: 2, origin: "São Paulo", dest: "Sorocaba", reason: "Treinamento", initialKm: 18700, finalKm: 18800 },
      
      { vehicleId: 3, origin: "São Paulo", dest: "Guarulhos", reason: "Aeroporto", initialKm: 12000, finalKm: 12050 },
      { vehicleId: 3, origin: "Guarulhos", dest: "São Paulo", reason: "Retorno", initialKm: 12050, finalKm: 12100 },
      { vehicleId: 3, origin: "São Paulo", dest: "ABC", reason: "Cliente", initialKm: 12100, finalKm: 12180 },
    ];

    tripData.forEach((data, index) => {
      this.createRegistration({
        type: "trip",
        vehicleId: data.vehicleId,
        driverId: (data.vehicleId % 3) + 1,
        date: dates[(index * 2) % dates.length].getTime(),
        initialKm: data.initialKm,
        finalKm: data.finalKm,
        origin: data.origin,
        destination: data.dest,
        reason: data.reason
      });
    });
  }

  // --- User methods (MemStorage specific, not all in IStorage) ---
  // The IStorage getUser(id: string) is implemented by the Replit Auth specific method later
  // This getUser(id: number) is a legacy from before User.id became varchar.
  // It can be removed or aliased if strictly numeric ID access is needed for MemStorage.
  // For now, it will cause a type error due to conflicting signatures if we don't rename or remove.
  // Let's remove this one to avoid conflict with the IStorage signature.
  // async getUser(id: number): Promise<User | undefined> {
  //   return this.users.get(id);
  // }

  // getUserByUsername and createUser are not part of IStorage.
  // User schema does not have 'username'. 'InsertUser' is not a defined type.
  // These methods are likely legacy and should be removed or updated if functionality is truly needed.
  // async getUserByUsername(username: string): Promise<User | undefined> {
  //   return Array.from(this.users.values()).find(
  //     (user) => (user as any).username === username // User type doesn't have username
  //   );
  // }
  // async createUser(insertUser: UpsertUser): Promise<User> { // Changed InsertUser to UpsertUser
  //   const id = this.userCurrentId++; // This assumes numeric, sequential IDs. Replit IDs are strings.
  //   const user: User = { ...insertUser, id: id.toString(), createdAt: new Date(), updatedAt: new Date() }; // Ensure ID is string
  //   this.users.set(user.id, user);
  //   return user;
  // }

  // --- Vehicle methods ---
  async getVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values());
  }
  async getVehicle(id: number): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }
  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const id = this.vehicleCurrentId++;
    const vehicle: Vehicle = { 
      ...insertVehicle, 
      id,
      imageUrl: insertVehicle.imageUrl || null
    };
    this.vehicles.set(id, vehicle);
    return vehicle;
  }
  async updateVehicle(id: number, data: any): Promise<Vehicle> {
    const existingVehicle = this.vehicles.get(id);
    if (!existingVehicle) throw new Error(`Veículo com ID ${id} não encontrado`);
    const updatedVehicle: Vehicle = { ...existingVehicle, ...data, id };
    this.vehicles.set(id, updatedVehicle);
    return updatedVehicle;
  }
  async deleteVehicle(id: number): Promise<boolean> {
    const exists = this.vehicles.has(id);
    if (!exists) throw new Error(`Veículo com ID ${id} não encontrado`);
    return this.vehicles.delete(id);
  }

  // --- Driver methods ---
  async getDrivers(): Promise<Driver[]> {
    return Array.from(this.drivers.values());
  }
  async getDriver(id: number): Promise<Driver | undefined> {
    return this.drivers.get(id);
  }
  async createDriver(insertDriver: InsertDriver): Promise<Driver> {
    const id = this.driverCurrentId++;
    const driver: Driver = { 
      ...insertDriver, 
      id,
      imageUrl: insertDriver.imageUrl || null
    };
    this.drivers.set(id, driver);
    return driver;
  }
  async updateDriver(id: number, data: any): Promise<Driver> {
    const existingDriver = this.drivers.get(id);
    if (!existingDriver) throw new Error(`Motorista com ID ${id} não encontrado`);
    const updatedDriver: Driver = { ...existingDriver, ...data, id };
    this.drivers.set(id, updatedDriver);
    return updatedDriver;
  }
  async deleteDriver(id: number): Promise<boolean> {
    const exists = this.drivers.has(id);
    if (!exists) throw new Error(`Motorista com ID ${id} não encontrado`);
    return this.drivers.delete(id);
  }

  // --- Fuel station methods ---
  async getFuelStations(): Promise<FuelStation[]> {
    return Array.from(this.fuelStations.values());
  }
  async getFuelStation(id: number): Promise<FuelStation | undefined> {
    return this.fuelStations.get(id);
  }
  async createFuelStation(insertFuelStation: InsertFuelStation): Promise<FuelStation> {
    const id = this.fuelStationCurrentId++;
    const fuelStation: FuelStation = { 
      ...insertFuelStation, 
      id,
      address: insertFuelStation.address || null
    };
    this.fuelStations.set(id, fuelStation);
    return fuelStation;
  }
  async updateFuelStation(id: number, data: any): Promise<FuelStation> {
    const existing = this.fuelStations.get(id);
    if (!existing) throw new Error(`Posto com ID ${id} não encontrado`);
    const updated: FuelStation = { ...existing, ...data, id };
    this.fuelStations.set(id, updated);
    return updated;
  }
  async deleteFuelStation(id: number): Promise<boolean> {
    const exists = this.fuelStations.has(id);
    if (!exists) throw new Error(`Posto com ID ${id} não encontrado`);
    return this.fuelStations.delete(id);
  }

  // --- Fuel type methods ---
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
  async updateFuelType(id: number, data: any): Promise<FuelType> {
    const existing = this.fuelTypes.get(id);
    if (!existing) throw new Error(`Tipo de combustível com ID ${id} não encontrado`);
    const updated: FuelType = { ...existing, ...data, id };
    this.fuelTypes.set(id, updated);
    return updated;
  }
  async deleteFuelType(id: number): Promise<boolean> {
    const exists = this.fuelTypes.has(id);
    if (!exists) throw new Error(`Tipo de combustível com ID ${id} não encontrado`);
    return this.fuelTypes.delete(id);
  }

  // --- Maintenance type methods ---
  async getMaintenanceTypes(): Promise<MaintenanceType[]> {
    return Array.from(this.maintenanceTypes.values());
  }
  async getMaintenanceType(id: number): Promise<MaintenanceType | undefined> {
    return this.maintenanceTypes.get(id);
  }
  async createMaintenanceType(insertMaintenanceType: InsertMaintenanceType): Promise<MaintenanceType> {
    const id = this.maintenanceTypeCurrentId++;
    const maintenanceType: MaintenanceType = { ...insertMaintenanceType, id };
    this.maintenanceTypes.set(id, maintenanceType);
    return maintenanceType;
  }
  async updateMaintenanceType(id: number, data: any): Promise<MaintenanceType> {
    const existing = this.maintenanceTypes.get(id);
    if (!existing) throw new Error(`Tipo de manutenção com ID ${id} não encontrado`);
    const updated: MaintenanceType = { ...existing, ...data, id };
    this.maintenanceTypes.set(id, updated);
    return updated;
  }
  async deleteMaintenanceType(id: number): Promise<boolean> {
    const exists = this.maintenanceTypes.has(id);
    if (!exists) throw new Error(`Tipo de manutenção com ID ${id} não encontrado`);
    return this.maintenanceTypes.delete(id);
  }

  // --- Vehicle registration methods ---
  async updateRegistration(id: number, data: any): Promise<VehicleRegistration> {
    const existingRegistration = this.registrations.get(id);
    if (!existingRegistration) throw new Error(`Registro com ID ${id} não encontrado`);
    const updatedRegistration: VehicleRegistration = { ...existingRegistration, ...data, id };
    this.registrations.set(id, updatedRegistration);
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
      if (filters.type) registrations = registrations.filter((reg) => reg.type === filters.type);
      if (filters.vehicleId) registrations = registrations.filter((reg) => reg.vehicleId === filters.vehicleId);
      if (filters.startDate) registrations = registrations.filter((reg) => new Date(reg.date) >= filters.startDate!);
      if (filters.endDate) registrations = registrations.filter((reg) => new Date(reg.date) <= filters.endDate!);
    }
    return registrations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  async getRegistration(id: number): Promise<VehicleRegistration | undefined> {
    return this.registrations.get(id);
  }
  async createRegistration(insertRegistration: InsertRegistration): Promise<VehicleRegistration> {
    const id = this.registrationCurrentId++;
    const registration: VehicleRegistration = { 
      type: insertRegistration.type,
      vehicleId: insertRegistration.vehicleId,
      driverId: insertRegistration.driverId,
      initialKm: insertRegistration.initialKm,
      id,
      date: insertRegistration.date || Date.now(),
      finalKm: insertRegistration.finalKm || null,
      fuelStationId: insertRegistration.fuelStationId || null,
      fuelTypeId: insertRegistration.fuelTypeId || null,
      liters: insertRegistration.liters || null,
      fuelCost: insertRegistration.fuelCost || null,
      fullTank: insertRegistration.fullTank || null,
      arla: insertRegistration.arla || null,
      maintenanceTypeId: insertRegistration.maintenanceTypeId || null,
      maintenanceCost: insertRegistration.maintenanceCost || null,
      origin: insertRegistration.origin || null,
      destination: insertRegistration.destination || null,
      reason: insertRegistration.reason || null,
      observations: insertRegistration.observations || null,
      photoUrl: insertRegistration.photoUrl || null
    };
    this.registrations.set(id, registration);
    return registration;
  }
  async deleteRegistration(id: number): Promise<boolean> {
    const exists = this.registrations.has(id);
    if (!exists) throw new Error(`Registro com ID ${id} não encontrado`);
    return this.registrations.delete(id);
  }

  // --- Checklist template methods ---
  async getChecklistTemplates(): Promise<ChecklistTemplate[]> {
    return Array.from(this.checklistTemplates.values());
  }
  async getChecklistTemplate(id: number): Promise<ChecklistTemplate | undefined> {
    return this.checklistTemplates.get(id);
  }
  async createChecklistTemplate(template: InsertChecklistTemplate): Promise<ChecklistTemplate> {
    const id = this.checklistTemplateCurrentId++;
    const checklistTemplate: ChecklistTemplate = { 
      ...template, 
      id,
      description: template.description || null,
      isDefault: template.isDefault || null,
      createdAt: Date.now()
    };
    this.checklistTemplates.set(id, checklistTemplate);
    return checklistTemplate;
  }

  async updateChecklistTemplate(id: number, data: Partial<InsertChecklistTemplate>): Promise<ChecklistTemplate | undefined> {
    const template = this.checklistTemplates.get(id);
    if (!template) return undefined;
    
    const updatedTemplate = { ...template, ...data };
    this.checklistTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async deleteChecklistTemplate(id: number): Promise<boolean> {
    const hasItems = Array.from(this.checklistItems.values()).some(item => item.templateId === id);
    const hasChecklists = Array.from(this.vehicleChecklists.values()).some(checklist => checklist.templateId === id);
    
    if (hasItems || hasChecklists) {
      throw new Error("Template is currently in use and cannot be deleted.");
    }
    
    return this.checklistTemplates.delete(id);
  }

  // --- Checklist item methods ---
  async getChecklistItems(templateId: number): Promise<ChecklistItem[]> {
    return Array.from(this.checklistItems.values())
      .filter(item => item.templateId === templateId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }
  async getChecklistItem(id: number): Promise<ChecklistItem | undefined> {
    return this.checklistItems.get(id);
  }
  async createChecklistItem(item: InsertChecklistItem): Promise<ChecklistItem> {
    const id = this.checklistItemCurrentId++;
    const checklistItem: ChecklistItem = { 
      ...item, 
      id,
      description: item.description || null,
      isRequired: item.isRequired || null,
      category: item.category || null,
      order: item.order || null
    };
    this.checklistItems.set(id, checklistItem);
    return checklistItem;
  }

  async updateChecklistItem(id: number, updates: Partial<InsertChecklistItem>): Promise<ChecklistItem | undefined> {
    const existingItem = this.checklistItems.get(id);
    if (!existingItem) return undefined;
    
    const updatedItem: ChecklistItem = {
      ...existingItem,
      ...updates,
      id, // Preserve the original ID
    };
    
    this.checklistItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteChecklistItem(id: number): Promise<boolean> {
    return this.checklistItems.delete(id);
  }

  // --- Vehicle checklist methods ---
  async getVehicleChecklists(filters?: {
    vehicleId?: number;
    driverId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<VehicleChecklist[]> {
    let checklists = Array.from(this.vehicleChecklists.values());
    if (filters) {
      if (filters.vehicleId) checklists = checklists.filter(c => c.vehicleId === filters.vehicleId);
      if (filters.driverId) checklists = checklists.filter(c => c.driverId === filters.driverId);
      if (filters.startDate) checklists = checklists.filter(c => new Date(c.date) >= filters.startDate!);
      if (filters.endDate) checklists = checklists.filter(c => new Date(c.date) <= filters.endDate!);
    }
    return checklists.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  async getVehicleChecklist(id: number): Promise<VehicleChecklistWithDetails | undefined> {
    const checklist = this.vehicleChecklists.get(id);
    if (!checklist) return undefined;

    // Buscar os resultados associados
    const results = await this.getChecklistResults(id);
    
    // Para cada resultado, buscar as informações do item
    const resultsWithItems = await Promise.all(
      results.map(async (result) => {
        const item = await this.getChecklistItem(result.itemId);
        return {
          ...result,
          item: item
        };
      })
    );

    // Buscar informações do veículo, motorista e template
    const vehicle = await this.getVehicle(checklist.vehicleId);
    const driver = await this.getDriver(checklist.driverId);
    const template = await this.getChecklistTemplate(checklist.templateId);

    return {
      ...checklist,
      results: resultsWithItems,
      vehicle: vehicle,
      driver: driver,
      template: template
    };
  }
  async createVehicleChecklist(checklist: InsertVehicleChecklist): Promise<VehicleChecklist> {
    const id = this.vehicleChecklistCurrentId++;
    const vehicleChecklist: VehicleChecklist = { 
      ...checklist, 
      id,
      date: checklist.date || Date.now(),
      observations: checklist.observations || null,
      photoUrl: checklist.photoUrl || null
    };
    this.vehicleChecklists.set(id, vehicleChecklist);
    return vehicleChecklist;
  }
  async updateVehicleChecklist(id: number, data: any): Promise<VehicleChecklist> {
    const existingChecklist = this.vehicleChecklists.get(id);
    if (!existingChecklist) throw new Error(`Checklist with id ${id} not found`);
    const updatedChecklist: VehicleChecklist = { ...existingChecklist, ...data, id };
    this.vehicleChecklists.set(id, updatedChecklist);
    return updatedChecklist;
  }
  async deleteVehicleChecklist(id: number): Promise<boolean> {
    return this.vehicleChecklists.delete(id);
  }

  // --- Checklist result methods ---
  async getChecklistResults(checklistId: number): Promise<ChecklistResult[]> {
    return Array.from(this.checklistResults.values()).filter(result => result.checklistId === checklistId);
  }
  async getChecklistResult(id: number): Promise<ChecklistResult | undefined> {
    return this.checklistResults.get(id);
  }
  async createChecklistResult(result: InsertChecklistResult): Promise<ChecklistResult> {
    const id = this.checklistResultCurrentId++;
    const checklistResult: ChecklistResult = { 
      ...result, 
      id,
      photoUrl: result.photoUrl || null,
      observation: result.observation || null
    };
    this.checklistResults.set(id, checklistResult);
    return checklistResult;
  }

  async updateChecklistResult(id: number, data: Partial<InsertChecklistResult>): Promise<ChecklistResult | undefined> {
    const existingResult = this.checklistResults.get(id);
    if (!existingResult) return undefined;
    
    const updatedResult = { ...existingResult, ...data };
    this.checklistResults.set(id, updatedResult);
    return updatedResult;
  }

  async deleteChecklistResult(id: number): Promise<boolean> {
    return this.checklistResults.delete(id);
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

  // --- Role methods (for MemStorage) ---
  async getRoles(): Promise<Role[]> {
    return Array.from(this.roles.values());
  }
  async getRole(id: number): Promise<Role | undefined> {
    return this.roles.get(id);
  }
  async createRole(roleData: InsertRole): Promise<Role> {
    const id = this.roleCurrentId++;
    const newRole: Role = { 
      ...roleData, 
      id,
      description: roleData.description || null
    };
    this.roles.set(id, newRole);
    return newRole;
  }
  async updateRole(id: number, roleData: Partial<InsertRole>): Promise<Role> {
    const existingRole = this.roles.get(id);
    if (!existingRole) throw new Error(`Role with ID ${id} not found`);
    const updatedRole = { ...existingRole, ...roleData, id };
    this.roles.set(id, updatedRole);
    return updatedRole;
  }
  async deleteRole(id: number): Promise<boolean> {
    const isRoleInUse = Array.from(this.users.values()).some(user => user.roleId === id);
    if (isRoleInUse) {
      throw new Error("Role is currently in use and cannot be deleted.");
    }
    return this.roles.delete(id);
  }

  // --- Replit Auth (implements IStorage user methods) ---
  async getUser(id: string): Promise<User | undefined> { // Implements IStorage.getUser
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> { // Implements IStorage.upsertUser
    if (!userData.id) {
      throw new Error("User ID is required for upsertUser.");
    }

    let finalUserData = { ...userData };
    const existingUser = this.users.get(finalUserData.id);

    if (!existingUser && !finalUserData.roleId) { // New user and no roleId provided
      const defaultRoleName = "Motorista";
      const defaultRole = Array.from(this.roles.values()).find(r => r.name === defaultRoleName);
      if (defaultRole) {
        finalUserData.roleId = defaultRole.id;
        console.log(`MemStorage: Assigning default role "${defaultRoleName}" (ID: ${defaultRole.id}) to new user ${finalUserData.id}`);
      } else {
        console.error(`MemStorage: Default role "${defaultRoleName}" not found. New user ${finalUserData.id} created without a role.`);
      }
    }

    if (!existingUser && finalUserData.passwordHash === undefined) {
      finalUserData.passwordHash = null; // Explicitly null for new Replit users
    }

    if (existingUser) {
      const updatedUser: User = {
        ...existingUser,
        ...finalUserData,
        passwordHash: finalUserData.passwordHash !== undefined ? finalUserData.passwordHash : existingUser.passwordHash,
        updatedAt: Date.now()
      };
      this.users.set(updatedUser.id, updatedUser);
      return updatedUser;
    } else {
      const newUser: User = {
        id: finalUserData.id,
        email: finalUserData.email ?? null,
        firstName: finalUserData.firstName ?? null,
        lastName: finalUserData.lastName ?? null,
        profileImageUrl: finalUserData.profileImageUrl ?? null,
        passwordHash: finalUserData.passwordHash ?? null,
        roleId: finalUserData.roleId ?? null,
        createdAt: finalUserData.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
      this.users.set(newUser.id, newUser);
      return newUser;
    }
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async updateUserPassword(id: string, passwordHash: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      user.passwordHash = passwordHash;
      user.updatedAt = Date.now();
      this.users.set(id, user);
      return user;
    }
    return undefined;
  }

  // This method is not part of IStorage and seems specific to a previous implementation
  // For now, I'll keep it, but it might need review.
  async getUserById(id: string): Promise<User | null> {
    try {
      const userId = id;
      // Tentar buscar do localStorage primeiro (padrão do seu exemplo)
      // No NodeJS isso não existe, mas ok, mantém a compatibilidade do código
      const userFromStorage = typeof localStorage !== "undefined" ? localStorage.getItem(`user_${userId}`) : null;
      if (userFromStorage) {
        return JSON.parse(userFromStorage);
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return null;
    }
  }

  private initializeSampleChecklists() {
    // Criar templates de checklist
    const inspectionTemplate = this.createChecklistTemplate({
      name: "Inspeção Diária",
      description: "Checklist padrão para inspeção diária de veículos",
      isDefault: true
    });

    const maintenanceTemplate = this.createChecklistTemplate({
      name: "Checklist de Manutenção",
      description: "Verificação antes de manutenção preventiva",
      isDefault: false
    });

    // Criar itens para o template de inspeção diária
    const dailyInspectionItems = [
      { name: "Verificar nível de óleo do motor", category: "motor", isRequired: true, order: 1 },
      { name: "Verificar nível do líquido de arrefecimento", category: "motor", isRequired: true, order: 2 },
      { name: "Verificar pressão dos pneus", category: "pneus", isRequired: true, order: 3 },
      { name: "Verificar estado dos pneus (desgaste)", category: "pneus", isRequired: true, order: 4 },
      { name: "Testar funcionamento dos faróis", category: "luzes", isRequired: true, order: 5 },
      { name: "Testar funcionamento das lanternas", category: "luzes", isRequired: true, order: 6 },
      { name: "Verificar funcionamento das setas", category: "luzes", isRequired: true, order: 7 },
      { name: "Verificar limpeza dos espelhos", category: "exterior", isRequired: false, order: 8 },
      { name: "Verificar funcionamento dos limpadores", category: "exterior", isRequired: true, order: 9 },
      { name: "Verificar documentação do veículo", category: "documentacao", isRequired: true, order: 10 },
      { name: "Verificar kit de primeiros socorros", category: "seguranca", isRequired: true, order: 11 },
      { name: "Verificar extintor de incêndio", category: "seguranca", isRequired: true, order: 12 },
      { name: "Verificar triângulo de sinalização", category: "seguranca", isRequired: true, order: 13 },
      { name: "Verificar funcionamento do ar condicionado", category: "interior", isRequired: false, order: 14 },
      { name: "Verificar limpeza interna", category: "interior", isRequired: false, order: 15 }
    ];

    dailyInspectionItems.forEach(item => {
      this.createChecklistItem({
        templateId: 1, // inspectionTemplate.id
        name: item.name,
        category: item.category,
        isRequired: item.isRequired,
        order: item.order
      });
    });

    // Criar itens para o template de manutenção
    const maintenanceItems = [
      { name: "Verificar nível de fluido de freio", category: "motor", isRequired: true, order: 1 },
      { name: "Verificar estado das pastilhas de freio", category: "motor", isRequired: true, order: 2 },
      { name: "Verificar alinhamento e balanceamento", category: "pneus", isRequired: true, order: 3 },
      { name: "Verificar sistema de suspensão", category: "motor", isRequired: true, order: 4 },
      { name: "Verificar bateria e sistema elétrico", category: "motor", isRequired: true, order: 5 },
      { name: "Verificar correia do motor", category: "motor", isRequired: true, order: 6 },
      { name: "Verificar filtro de ar", category: "motor", isRequired: false, order: 7 },
      { name: "Verificar sistema de escape", category: "exterior", isRequired: true, order: 8 }
    ];

    maintenanceItems.forEach(item => {
      this.createChecklistItem({
        templateId: 2, // maintenanceTemplate.id
        name: item.name,
        category: item.category,
        isRequired: item.isRequired,
        order: item.order
      });
    });

    // Criar alguns checklists de exemplo
    const now = new Date();
    
    // Checklist 1 - Gol
    const checklist1 = this.createVehicleChecklist({
      vehicleId: 1,
      driverId: 1,
      templateId: 1,
      odometer: 25100,
      status: "complete",
      date: now.getTime() - 1 * 24 * 60 * 60 * 1000
    });

    // Checklist 2 - Uno (com problemas)
    const checklist2 = this.createVehicleChecklist({
      vehicleId: 2,
      driverId: 2,
      templateId: 1,
      odometer: 18250,
      status: "failed",
      date: now.getTime() - 2 * 24 * 60 * 60 * 1000
    });

    // Checklist 3 - HB20 (manutenção)
    const checklist3 = this.createVehicleChecklist({
      vehicleId: 3,
      driverId: 3,
      templateId: 2,
      odometer: 12150,
      status: "complete",
      date: now.getTime() - 3 * 24 * 60 * 60 * 1000
    });

    // Adicionar resultados para cada checklist
    // Para checklist1 (completo)
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].forEach(itemId => {
      this.createChecklistResult({
        checklistId: 1,
        itemId: itemId,
        status: "ok",
        observation: null
      });
    });

    // Para checklist2 (com problemas)
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].forEach(itemId => {
      let status = "ok";
      let observation = null;
      
      if (itemId === 1) {
        status = "issue";
        observation = "Nível baixo de óleo do motor";
      } else if (itemId === 3) {
        status = "issue";
        observation = "Pressão baixa no pneu dianteiro direito";
      }
      
      this.createChecklistResult({
        checklistId: 2,
        itemId: itemId,
        status: status,
        observation: observation
      });
    });

    // Para checklist3 (manutenção completa)
    [16, 17, 18, 19, 20, 21, 22, 23].forEach(itemId => {
      this.createChecklistResult({
        checklistId: 3,
        itemId: itemId,
        status: "ok",
        observation: null
      });
    });
  }
}

export const storage = new MemStorage();
// import { DatabaseStorage } from "./dbStorage";
// export const storage = new DatabaseStorage();
