import { db } from "./db";
import { eq, and, sql } from "drizzle-orm"; // Added 'and' and 'sql' for dynamic queries
import { PgTransaction } from 'drizzle-orm/pg-core';
import { NeonHttpProxy } from 'drizzle-orm/neon-http';
import * as schemaShared from '@shared/schema';
import { ExtractTablesWithRelations } from 'drizzle-orm';

// Define a more precise transaction type
type Transaction = PgTransaction<NeonHttpProxy<boolean, boolean>, typeof schemaShared, ExtractTablesWithRelations<typeof schemaShared>>;

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
  Role,
  roles,
  InsertRole,
  // Checklist related imports
  ChecklistTemplate,
  checklistTemplates,
  InsertChecklistTemplate,
  ChecklistItem,
  checklistItems,
  InsertChecklistItem,
  VehicleChecklist,
  vehicleChecklists,
  InsertVehicleChecklist,
  ChecklistResult,
  checklistResults,
  InsertChecklistResult,
} from "@shared/schema"; // Assuming schema types are correctly exported from @shared/schema
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User methods for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    let finalUserData = { ...userData };

    const existingUser = await this.getUser(finalUserData.id);

    if (!existingUser && !finalUserData.roleId) {
      try {
        const defaultRoleName = "Motorista";
        const [defaultRole] = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, defaultRoleName));
        if (defaultRole) {
          finalUserData.roleId = defaultRole.id;
          console.log(`Assigning default role "${defaultRoleName}" (ID: ${defaultRole.id}) to new user ${finalUserData.id}`);
        } else {
          console.error(`Default role "${defaultRoleName}" not found. New user ${finalUserData.id} will be created without a role or with roleId ${finalUserData.roleId}.`);
        }
      } catch (error) {
        console.error("Error fetching default role for new user:", error);
      }
    }

    if (!existingUser && finalUserData.passwordHash === undefined) {
        finalUserData.passwordHash = null;
    }

    const valuesToSet: UpsertUser = {
      id: finalUserData.id,
      email: finalUserData.email,
      firstName: finalUserData.firstName,
      lastName: finalUserData.lastName,
      profileImageUrl: finalUserData.profileImageUrl,
      passwordHash: finalUserData.passwordHash,
      roleId: finalUserData.roleId,
      createdAt: existingUser ? existingUser.createdAt : (finalUserData.createdAt || new Date()),
      updatedAt: new Date(),
    };

    const onConflictSet: Partial<UpsertUser> = {
      email: finalUserData.email,
      firstName: finalUserData.firstName,
      lastName: finalUserData.lastName,
      profileImageUrl: finalUserData.profileImageUrl,
      roleId: finalUserData.roleId,
      updatedAt: new Date(),
    };
    if (finalUserData.passwordHash !== undefined) {
      onConflictSet.passwordHash = finalUserData.passwordHash;
    }

    const [user] = await db
      .insert(users)
      .values(valuesToSet)
      .onConflictDoUpdate({
        target: users.id,
        set: onConflictSet,
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

  async updateVehicle(id: number, data: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const [vehicle] = await db.update(vehicles).set(data).where(eq(vehicles.id, id)).returning();
    return vehicle;
  }

  async deleteVehicle(id: number): Promise<boolean> {
    const result = await db.delete(vehicles).where(eq(vehicles.id, id)).returning({ id: vehicles.id });
    return result.length > 0;
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

  async updateDriver(id: number, data: Partial<InsertDriver>): Promise<Driver | undefined> {
    const [driver] = await db.update(drivers).set(data).where(eq(drivers.id, id)).returning();
    return driver;
  }

  async deleteDriver(id: number): Promise<boolean> {
    const result = await db.delete(drivers).where(eq(drivers.id, id)).returning({ id: drivers.id });
    return result.length > 0;
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

  async updateFuelStation(id: number, data: Partial<InsertFuelStation>): Promise<FuelStation | undefined> {
    const [station] = await db.update(fuelStations).set(data).where(eq(fuelStations.id, id)).returning();
    return station;
  }

  async deleteFuelStation(id: number): Promise<boolean> {
    const result = await db.delete(fuelStations).where(eq(fuelStations.id, id)).returning({ id: fuelStations.id });
    return result.length > 0;
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

  async updateFuelType(id: number, data: Partial<InsertFuelType>): Promise<FuelType | undefined> {
    const [type] = await db.update(fuelTypes).set(data).where(eq(fuelTypes.id, id)).returning();
    return type;
  }

  async deleteFuelType(id: number): Promise<boolean> {
    const result = await db.delete(fuelTypes).where(eq(fuelTypes.id, id)).returning({ id: fuelTypes.id });
    return result.length > 0;
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

  async updateMaintenanceType(id: number, data: Partial<InsertMaintenanceType>): Promise<MaintenanceType | undefined> {
    const [type] = await db.update(maintenanceTypes).set(data).where(eq(maintenanceTypes.id, id)).returning();
    return type;
  }

  async deleteMaintenanceType(id: number): Promise<boolean> {
    const result = await db.delete(maintenanceTypes).where(eq(maintenanceTypes.id, id)).returning({ id: maintenanceTypes.id });
    return result.length > 0;
  }

  // Vehicle registration methods
  async getRegistrations(filters?: {
    type?: string;
    vehicleId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<VehicleRegistration[]> {
    // This is a simplified version. For dynamic queries, you might need to build condition arrays.
    // Drizzle doesn't allow appending .where() like some other ORMs.
    const conditions = [];
    if (filters) {
      if (filters.type) {
        conditions.push(eq(vehicleRegistrations.type, filters.type));
      }
      if (filters.vehicleId) {
        conditions.push(eq(vehicleRegistrations.vehicleId, filters.vehicleId));
      }
      // Date filters would require gt, lt, gte, lte operators
      // e.g., if (filters.startDate) conditions.push(gte(vehicleRegistrations.date, filters.startDate));
      // e.g., if (filters.endDate) conditions.push(lte(vehicleRegistrations.date, filters.endDate));
    }

    if (conditions.length > 0) {
      // @ts-ignore because .where does not allow undefined
      return db.select().from(vehicleRegistrations).where(and(...conditions));
    }
    return db.select().from(vehicleRegistrations);
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

  async updateRegistration(id: number, data: Partial<InsertRegistration>): Promise<VehicleRegistration | undefined> {
    const [registration] = await db
      .update(vehicleRegistrations)
      .set(data)
      .where(eq(vehicleRegistrations.id, id))
      .returning();
    return registration;
  }

  async deleteRegistration(id: number): Promise<boolean> {
    const result = await db.delete(vehicleRegistrations).where(eq(vehicleRegistrations.id, id)).returning({id: vehicleRegistrations.id});
    return result.length > 0;
  }

  // Checklist template methods
  async getChecklistTemplates(): Promise<ChecklistTemplate[]> {
    return db.select().from(checklistTemplates);
  }

  async getChecklistTemplate(id: number): Promise<ChecklistTemplate | undefined> {
    const [template] = await db.select().from(checklistTemplates).where(eq(checklistTemplates.id, id));
    return template;
  }

  async createChecklistTemplate(template: InsertChecklistTemplate): Promise<ChecklistTemplate> {
    const [newTemplate] = await db.insert(checklistTemplates).values(template).returning();
    return newTemplate;
  }

  async updateChecklistTemplate(id: number, data: Partial<InsertChecklistTemplate>): Promise<ChecklistTemplate | undefined> {
    const [updatedTemplate] = await db
      .update(checklistTemplates)
      .set(data)
      .where(eq(checklistTemplates.id, id))
      .returning();
    return updatedTemplate;
  }

  async deleteChecklistTemplate(id: number): Promise<boolean> {
    // Check if template has associated items or checklists before deletion
    const items = await db.select().from(checklistItems).where(eq(checklistItems.templateId, id));
    const checklists = await db.select().from(vehicleChecklists).where(eq(vehicleChecklists.templateId, id));
    
    if (items.length > 0 || checklists.length > 0) {
      throw new Error("Template is currently in use and cannot be deleted.");
    }
    
    const result = await db.delete(checklistTemplates).where(eq(checklistTemplates.id, id)).returning({ id: checklistTemplates.id });
    return result.length > 0;
  }

  // Checklist item methods
  async getChecklistItems(templateId: number): Promise<ChecklistItem[]> {
    return db.select().from(checklistItems).where(eq(checklistItems.templateId, templateId));
  }

  async getChecklistItem(id: number): Promise<ChecklistItem | undefined> {
    const [item] = await db.select().from(checklistItems).where(eq(checklistItems.id, id));
    return item;
  }

  async createChecklistItem(item: InsertChecklistItem): Promise<ChecklistItem> {
    const [newItem] = await db.insert(checklistItems).values(item).returning();
    return newItem;
  }

  // Vehicle checklist methods
  async getVehicleChecklists(filters?: {
    vehicleId?: number;
    driverId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<VehicleChecklist[]> {
    const conditions = [];
    if (filters) {
      if (filters.vehicleId !== undefined) {
        conditions.push(eq(vehicleChecklists.vehicleId, filters.vehicleId));
      }
      if (filters.driverId !== undefined) {
        conditions.push(eq(vehicleChecklists.driverId, filters.driverId));
      }
      // Example for date range, assuming gte and lte are imported or available via sql``
      // if (filters.startDate) {
      //   conditions.push(sql`${vehicleChecklists.date} >= ${filters.startDate}`);
      // }
      // if (filters.endDate) {
      //   conditions.push(sql`${vehicleChecklists.date} <= ${filters.endDate}`);
      // }
    }

    if (conditions.length > 0) {
      // @ts-ignore
      return db.select().from(vehicleChecklists).where(and(...conditions));
    }
    return db.select().from(vehicleChecklists);
  }

  async getVehicleChecklist(id: number): Promise<VehicleChecklist | undefined> {
    const [checklist] = await db.select().from(vehicleChecklists).where(eq(vehicleChecklists.id, id));
    return checklist;
  }

  async createVehicleChecklist(checklist: InsertVehicleChecklist, tx?: Transaction): Promise<VehicleChecklist> {
    const [newChecklist] = await (tx || db).insert(vehicleChecklists).values(checklist).returning();
    return newChecklist;
  }

  async updateVehicleChecklist(id: number, data: Partial<InsertVehicleChecklist>, tx?: Transaction): Promise<VehicleChecklist | undefined> {
    const [updatedChecklist] = await (tx || db).update(vehicleChecklists).set(data).where(eq(vehicleChecklists.id, id)).returning();
    return updatedChecklist;
  }

  async deleteVehicleChecklist(id: number): Promise<boolean> {
    const result = await db.delete(vehicleChecklists).where(eq(vehicleChecklists.id, id)).returning({ id: vehicleChecklists.id });
    return result.length > 0;
  }

  // Checklist result methods
  async getChecklistResults(checklistId: number): Promise<ChecklistResult[]> {
    return db.select().from(checklistResults).where(eq(checklistResults.checklistId, checklistId));
  }

  async getChecklistResult(id: number): Promise<ChecklistResult | undefined> {
    const [result] = await db.select().from(checklistResults).where(eq(checklistResults.id, id));
    return result;
  }

  async createChecklistResult(resultData: InsertChecklistResult, tx?: Transaction): Promise<ChecklistResult> {
    const [newResult] = await (tx || db).insert(checklistResults).values(resultData).returning();
    return newResult;
  }

  async deleteChecklistResults(checklistId: number, tx?: Transaction): Promise<boolean> {
    // This deletes ALL results for a given checklistId.
    const result = await (tx || db).delete(checklistResults).where(eq(checklistResults.checklistId, checklistId)).returning({ id: checklistResults.id });
    return result.length > 0; // Returns true if any rows were deleted
  }

  // Role methods
  async getRoles(): Promise<Role[]> {
    return db.select().from(roles);
  }

  async getRole(id: number): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role;
  }

  async createRole(roleData: InsertRole): Promise<Role> {
    const [role] = await db.insert(roles).values(roleData).returning();
    return role;
  }

  async updateRole(id: number, roleData: Partial<InsertRole>): Promise<Role | undefined> {
    const [role] = await db
      .update(roles)
      .set(roleData)
      .where(eq(roles.id, id))
      .returning();
    return role;
  }

  async deleteRole(id: number): Promise<boolean> {
    const usersWithRole = await db.select({count: sql<number>`count(*)`}).from(users).where(eq(users.roleId, id));
    if (Number(usersWithRole[0].count) > 0) {
      throw new Error("Role is currently in use and cannot be deleted.");
    }
    const result = await db.delete(roles).where(eq(roles.id, id)).returning({id: roles.id});
    return result.length > 0;
  }

  // Extended User methods
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!email) return undefined;
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
    return result.length > 0;
  }

  async updateUserPassword(id: string, passwordHash: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }
}