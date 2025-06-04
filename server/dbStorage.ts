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
  Role,
  roles,
  InsertRole,
} from "@shared/schema";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User methods for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    let finalUserData = { ...userData };

    // Check if it's an insert or update by trying to fetch the user first
    // This is how Replit Auth's `verify` function implicitly works with our upsert.
    // If `storage.upsertUser` is called directly for creating a user (e.g. admin panel),
    // this logic will also apply if `roleId` is not preset in `userData`.
    const existingUser = await this.getUser(finalUserData.id);

    if (!existingUser && !finalUserData.roleId) { // This is a new user and no roleId is provided
      try {
        const defaultRoleName = "Motorista"; // Or "Default User", "Usuário"
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

    // For users authenticated via Replit (typical case for this upsert from replitAuth.ts),
    // passwordHash should not be set from userData unless explicitly intended (e.g. admin created user).
    // The `replitAuth.ts` `upsertUser` call does not provide `passwordHash`.
    // If `finalUserData.passwordHash` is undefined, it will be stored as NULL.
    if (!existingUser && finalUserData.passwordHash === undefined) {
        finalUserData.passwordHash = null; // Explicitly set to null for new Replit users
    }


    // Prepare data for insert or update
    const valuesToSet: UpsertUser = {
      id: finalUserData.id, // PK
      email: finalUserData.email,
      firstName: finalUserData.firstName,
      lastName: finalUserData.lastName,
      profileImageUrl: finalUserData.profileImageUrl,
      passwordHash: finalUserData.passwordHash,
      roleId: finalUserData.roleId,
      createdAt: existingUser ? existingUser.createdAt : (finalUserData.createdAt || new Date()), // Preserve original createdAt
      updatedAt: new Date(),
    };

    // Define what fields to update in case of conflict (user already exists)
    const onConflictSet: Partial<UpsertUser> = {
      email: finalUserData.email,
      firstName: finalUserData.firstName,
      lastName: finalUserData.lastName,
      profileImageUrl: finalUserData.profileImageUrl,
      roleId: finalUserData.roleId, // Allow role update if provided
      updatedAt: new Date(),
    };
    // Only update passwordHash if it's explicitly provided in finalUserData
    // This is important for Replit authenticated users who shouldn't have their null passwordHash overwritten
    // unless an admin is intentionally setting/changing it (which would come via a different flow for passwordHash).
    // For Replit Auth, finalUserData.passwordHash will be null for new users or undefined if not touched.
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

  async updateRegistration(id: number, data: any): Promise<VehicleRegistration> {
    const [registration] = await db
      .update(vehicleRegistrations)
      .set(data)
      .where(eq(vehicleRegistrations.id, id))
      .returning();
    return registration;
  }

  async deleteRegistration(id: number): Promise<boolean> {
    await db.delete(vehicleRegistrations).where(eq(vehicleRegistrations.id, id));
    return true;
  }

  // Checklist template methods
  async getChecklistTemplates(): Promise<ChecklistTemplate[]> {
    // Implementação temporária - deve ser substituída por acesso ao DB real
    console.log('DatabaseStorage.getChecklistTemplates não implementado completamente');
    return [];
  }

  async getChecklistTemplate(id: number): Promise<ChecklistTemplate | undefined> {
    // Implementação temporária - deve ser substituída por acesso ao DB real
    console.log('DatabaseStorage.getChecklistTemplate não implementado completamente');
    return undefined;
  }

  async createChecklistTemplate(template: InsertChecklistTemplate): Promise<ChecklistTemplate> {
    // Implementação temporária - deve ser substituída por acesso ao DB real
    console.log('DatabaseStorage.createChecklistTemplate não implementado completamente');
    return { id: 0, ...template };
  }

  // Checklist item methods
  async getChecklistItems(templateId: number): Promise<ChecklistItem[]> {
    // Implementação temporária - deve ser substituída por acesso ao DB real
    console.log('DatabaseStorage.getChecklistItems não implementado completamente');
    return [];
  }

  async getChecklistItem(id: number): Promise<ChecklistItem | undefined> {
    // Implementação temporária - deve ser substituída por acesso ao DB real
    console.log('DatabaseStorage.getChecklistItem não implementado completamente');
    return undefined;
  }

  async createChecklistItem(item: InsertChecklistItem): Promise<ChecklistItem> {
    // Implementação temporária - deve ser substituída por acesso ao DB real
    console.log('DatabaseStorage.createChecklistItem não implementado completamente');
    return { id: 0, ...item };
  }

  // Vehicle checklist methods
  async getVehicleChecklists(filters?: {
    vehicleId?: number;
    driverId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<VehicleChecklist[]> {
    // Implementação temporária - deve ser substituída por acesso ao DB real
    console.log('DatabaseStorage.getVehicleChecklists não implementado completamente');
    return [];
  }

  async getVehicleChecklist(id: number): Promise<VehicleChecklist | undefined> {
    // Implementação temporária - deve ser substituída por acesso ao DB real
    console.log('DatabaseStorage.getVehicleChecklist não implementado completamente');
    return undefined;
  }

  async createVehicleChecklist(checklist: InsertVehicleChecklist): Promise<VehicleChecklist> {
    // Implementação temporária - deve ser substituída por acesso ao DB real
    console.log('DatabaseStorage.createVehicleChecklist não implementado completamente');
    return { id: 0, ...checklist, date: new Date() };
  }

  async updateVehicleChecklist(id: number, data: any): Promise<VehicleChecklist> {
    // Implementação temporária - deve ser substituída por acesso ao DB real
    console.log(`DatabaseStorage.updateVehicleChecklist: Atualizando checklist ${id}`, data);
    return { id, ...data };
  }

  async deleteVehicleChecklist(id: number): Promise<boolean> {
    // Implementação temporária - deve ser substituída por acesso ao DB real
    console.log(`DatabaseStorage.deleteVehicleChecklist: Excluindo checklist ${id}`);
    return true;
  }

  // Checklist result methods
  async getChecklistResults(checklistId: number): Promise<ChecklistResult[]> {
    // Implementação temporária - deve ser substituída por acesso ao DB real
    console.log('DatabaseStorage.getChecklistResults não implementado completamente');
    return [];
  }

  async getChecklistResult(id: number): Promise<ChecklistResult | undefined> {
    // Implementação temporária - deve ser substituída por acesso ao DB real
    console.log('DatabaseStorage.getChecklistResult não implementado completamente');
    return undefined;
  }

  async createChecklistResult(result: InsertChecklistResult): Promise<ChecklistResult> {
    // Implementação temporária - deve ser substituída por acesso ao DB real
    console.log('DatabaseStorage.createChecklistResult não implementado completamente');
    return { id: 0, ...result };
  }

  async deleteChecklistResults(checklistId: number): Promise<boolean> {
    // Implementação temporária - deve ser substituída por acesso ao DB real
    console.log(`DatabaseStorage.deleteChecklistResults: Excluindo resultados do checklist ${checklistId}`);
    return true;
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

  async updateRole(id: number, roleData: Partial<InsertRole>): Promise<Role> {
    const [role] = await db
      .update(roles)
      .set(roleData)
      .where(eq(roles.id, id))
      .returning();
    return role;
  }

  async deleteRole(id: number): Promise<boolean> {
    // Before deleting a role, ensure it's not used by any user.
    // This check should ideally be in the service/route layer,
    // but a basic check here can prevent orphaned roleIds.
    const usersWithRole = await db.select().from(users).where(eq(users.roleId, id)).limit(1);
    if (usersWithRole.length > 0) {
      throw new Error("Role is currently in use and cannot be deleted.");
    }
    await db.delete(roles).where(eq(roles.id, id));
    return true;
  }

  // Extended User methods
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!email) return undefined; // Guard against empty email query
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