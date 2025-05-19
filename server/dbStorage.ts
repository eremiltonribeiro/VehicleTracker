import { db } from "./db";
import { eq } from "drizzle-orm";
import {
  users,
  vehicles,
  drivers,
  fuelStations,
  fuelTypes,
  maintenanceTypes,
  vehicleRegistrations,
  type User,
  type UpsertUser,
  type Vehicle,
  type InsertVehicle,
  type Driver,
  type InsertDriver,
  type FuelStation,
  type InsertFuelStation,
  type FuelType,
  type InsertFuelType,
  type MaintenanceType,
  type InsertMaintenanceType,
  type VehicleRegistration,
  type InsertRegistration,
} from "@shared/schema";
import { IStorage } from "./storage";

// Implementação de armazenamento usando banco de dados PostgreSQL
export class DatabaseStorage implements IStorage {
  // Métodos de usuário
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Métodos de veículos
  async getVehicles(): Promise<Vehicle[]> {
    return await db.select().from(vehicles);
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle;
  }

  async createVehicle(vehicleData: InsertVehicle): Promise<Vehicle> {
    const [vehicle] = await db.insert(vehicles).values(vehicleData).returning();
    return vehicle;
  }

  // Métodos de motoristas
  async getDrivers(): Promise<Driver[]> {
    return await db.select().from(drivers);
  }

  async getDriver(id: number): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.id, id));
    return driver;
  }

  async createDriver(driverData: InsertDriver): Promise<Driver> {
    const [driver] = await db.insert(drivers).values(driverData).returning();
    return driver;
  }

  // Métodos de postos de combustível
  async getFuelStations(): Promise<FuelStation[]> {
    return await db.select().from(fuelStations);
  }

  async getFuelStation(id: number): Promise<FuelStation | undefined> {
    const [station] = await db.select().from(fuelStations).where(eq(fuelStations.id, id));
    return station;
  }

  async createFuelStation(stationData: InsertFuelStation): Promise<FuelStation> {
    const [station] = await db.insert(fuelStations).values(stationData).returning();
    return station;
  }

  // Métodos de tipos de combustível
  async getFuelTypes(): Promise<FuelType[]> {
    return await db.select().from(fuelTypes);
  }

  async getFuelType(id: number): Promise<FuelType | undefined> {
    const [fuelType] = await db.select().from(fuelTypes).where(eq(fuelTypes.id, id));
    return fuelType;
  }

  async createFuelType(typeData: InsertFuelType): Promise<FuelType> {
    const [fuelType] = await db.insert(fuelTypes).values(typeData).returning();
    return fuelType;
  }

  // Métodos de tipos de manutenção
  async getMaintenanceTypes(): Promise<MaintenanceType[]> {
    return await db.select().from(maintenanceTypes);
  }

  async getMaintenanceType(id: number): Promise<MaintenanceType | undefined> {
    const [maintenanceType] = await db.select().from(maintenanceTypes).where(eq(maintenanceTypes.id, id));
    return maintenanceType;
  }

  async createMaintenanceType(typeData: InsertMaintenanceType): Promise<MaintenanceType> {
    const [maintenanceType] = await db.insert(maintenanceTypes).values(typeData).returning();
    return maintenanceType;
  }

  // Métodos de registros de veículos
  async getRegistrations(filters?: {
    type?: string;
    vehicleId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<VehicleRegistration[]> {
    let query = db.select().from(vehicleRegistrations);
    
    if (filters) {
      if (filters.type) {
        query = query.where(eq(vehicleRegistrations.type, filters.type));
      }
      
      if (filters.vehicleId) {
        query = query.where(eq(vehicleRegistrations.vehicleId, filters.vehicleId));
      }
      
      // Filtros de data podem ser adicionados usando o operador correto
      // para o banco de dados PostgreSQL
    }
    
    return await query;
  }

  async getRegistration(id: number): Promise<VehicleRegistration | undefined> {
    const [registration] = await db.select().from(vehicleRegistrations).where(eq(vehicleRegistrations.id, id));
    return registration;
  }

  async createRegistration(registrationData: InsertRegistration): Promise<VehicleRegistration> {
    const [registration] = await db.insert(vehicleRegistrations).values(registrationData).returning();
    return registration;
  }
}