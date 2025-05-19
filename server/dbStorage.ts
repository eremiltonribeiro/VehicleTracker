import { db } from "./db";
import { eq } from "drizzle-orm";
import {
  User,
  UpsertUser,
  users,
  Vehicle,
  vehicles,
  InsertVehicle,
  Driver,
  drivers,
  InsertDriver,
  FuelStation,
  fuelStations,
  InsertFuelStation,
  FuelType,
  fuelTypes,
  InsertFuelType,
  MaintenanceType,
  maintenanceTypes,
  InsertMaintenanceType,
  VehicleRegistration,
  vehicleRegistrations,
  InsertRegistration,
} from "@shared/schema";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User methods for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Vehicle methods
  async getVehicles(): Promise<Vehicle[]> {
    return db.select().from(vehicles);
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle;
  }

  async createVehicle(vehicleData: InsertVehicle): Promise<Vehicle> {
    const [vehicle] = await db.insert(vehicles).values(vehicleData).returning();
    return vehicle;
  }

  // Driver methods
  async getDrivers(): Promise<Driver[]> {
    return db.select().from(drivers);
  }

  async getDriver(id: number): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.id, id));
    return driver;
  }

  async createDriver(driverData: InsertDriver): Promise<Driver> {
    const [driver] = await db.insert(drivers).values(driverData).returning();
    return driver;
  }

  // Fuel station methods
  async getFuelStations(): Promise<FuelStation[]> {
    return db.select().from(fuelStations);
  }

  async getFuelStation(id: number): Promise<FuelStation | undefined> {
    const [station] = await db.select().from(fuelStations).where(eq(fuelStations.id, id));
    return station;
  }

  async createFuelStation(stationData: InsertFuelStation): Promise<FuelStation> {
    const [station] = await db.insert(fuelStations).values(stationData).returning();
    return station;
  }

  // Fuel type methods
  async getFuelTypes(): Promise<FuelType[]> {
    return db.select().from(fuelTypes);
  }

  async getFuelType(id: number): Promise<FuelType | undefined> {
    const [type] = await db.select().from(fuelTypes).where(eq(fuelTypes.id, id));
    return type;
  }

  async createFuelType(typeData: InsertFuelType): Promise<FuelType> {
    const [type] = await db.insert(fuelTypes).values(typeData).returning();
    return type;
  }

  // Maintenance type methods
  async getMaintenanceTypes(): Promise<MaintenanceType[]> {
    return db.select().from(maintenanceTypes);
  }

  async getMaintenanceType(id: number): Promise<MaintenanceType | undefined> {
    const [type] = await db.select().from(maintenanceTypes).where(eq(maintenanceTypes.id, id));
    return type;
  }

  async createMaintenanceType(typeData: InsertMaintenanceType): Promise<MaintenanceType> {
    const [type] = await db.insert(maintenanceTypes).values(typeData).returning();
    return type;
  }

  // Vehicle registration methods
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
      // Data filters would be implemented similarly with date comparison operators
    }

    return query;
  }

  async getRegistration(id: number): Promise<VehicleRegistration | undefined> {
    const [registration] = await db
      .select()
      .from(vehicleRegistrations)
      .where(eq(vehicleRegistrations.id, id));
    return registration;
  }

  async createRegistration(registrationData: InsertRegistration): Promise<VehicleRegistration> {
    const [registration] = await db
      .insert(vehicleRegistrations)
      .values(registrationData)
      .returning();
    return registration;
  }
}