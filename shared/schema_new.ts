import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage para Replit Auth
export const sessions = sqliteTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess").notNull(),
    expire: integer("expire").notNull(),
  }
);

// Tabela de usuários melhorada com Replit Auth
export const users = sqliteTable("users", {
  id: text("id").primaryKey().notNull(),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  passwordHash: text("password_hash"), // For users created manually / not via Replit Auth
  roleId: integer("role_id").references(() => roles.id),
  createdAt: integer("created_at").default(Date.now()),
  updatedAt: integer("updated_at").default(Date.now()),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Roles table
export const roles = sqliteTable("roles", {
  id: integer("id").primaryKey(),
  name: text("name").unique().notNull(),
  description: text("description"),
  permissions: text("permissions").notNull(), // Storing JSON as text
});

export type InsertRole = typeof roles.$inferInsert;
export type Role = typeof roles.$inferSelect;

// Vehicles table
export const vehicles = sqliteTable("vehicles", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  plate: text("plate").notNull().unique(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  imageUrl: text("image_url"),
});

export const insertVehicleSchema = createInsertSchema(vehicles).pick({
  name: true,
  plate: true,
  model: true,
  year: true,
  imageUrl: true,
});

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;

// Add Zod schema for imageUrl to insertVehicleSchema
export const ZodInsertVehicleSchema = insertVehicleSchema.extend({
  imageUrl: z.string().optional().nullable(),
});
export type ZodInsertVehicle = z.infer<typeof ZodInsertVehicleSchema>;

// Drivers table
export const drivers = sqliteTable("drivers", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  license: text("license").notNull(),
  phone: text("phone").notNull(),
  imageUrl: text("image_url"),
});

export const insertDriverSchema = createInsertSchema(drivers).pick({
  name: true,
  license: true,
  phone: true,
  imageUrl: true,
});

export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Driver = typeof drivers.$inferSelect;

// Add Zod schema for imageUrl to insertDriverSchema
export const ZodInsertDriverSchema = insertDriverSchema.extend({
  imageUrl: z.string().url().optional().nullable(),
});
export type ZodInsertDriver = z.infer<typeof ZodInsertDriverSchema>;

// Fuel stations table
export const fuelStations = sqliteTable("fuel_stations", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
});

export const insertFuelStationSchema = createInsertSchema(fuelStations).pick({
  name: true,
  address: true,
});

export type InsertFuelStation = z.infer<typeof insertFuelStationSchema>;
export type FuelStation = typeof fuelStations.$inferSelect;

// Fuel types table
export const fuelTypes = sqliteTable("fuel_types", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
});

export const insertFuelTypeSchema = createInsertSchema(fuelTypes).pick({
  name: true,
});

export type InsertFuelType = z.infer<typeof insertFuelTypeSchema>;
export type FuelType = typeof fuelTypes.$inferSelect;

// Maintenance types table
export const maintenanceTypes = sqliteTable("maintenance_types", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
});

export const insertMaintenanceTypeSchema = createInsertSchema(maintenanceTypes).pick({
  name: true,
});

export type InsertMaintenanceType = z.infer<typeof insertMaintenanceTypeSchema>;
export type MaintenanceType = typeof maintenanceTypes.$inferSelect;

// Registration types enum
export const RegistrationType = {
  FUEL: "fuel",
  MAINTENANCE: "maintenance",
  TRIP: "trip",
} as const;

export type RegistrationType = (typeof RegistrationType)[keyof typeof RegistrationType];

// Vehicle registrations table
export const vehicleRegistrations = sqliteTable("vehicle_registrations", {
  id: integer("id").primaryKey(),
  type: text("type").notNull(), // "fuel", "maintenance", "trip"
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
  driverId: integer("driver_id").notNull().references(() => drivers.id),
  date: integer("date").notNull().default(Date.now()),
  initialKm: integer("initial_km").notNull(),
  finalKm: integer("final_km"),
  
  // Fuel fields
  fuelStationId: integer("fuel_station_id").references(() => fuelStations.id),
  fuelTypeId: integer("fuel_type_id").references(() => fuelTypes.id),
  liters: integer("liters"),
  fuelCost: integer("fuel_cost"), // in cents
  fullTank: integer("full_tank", { mode: 'boolean' }),
  arla: integer("arla", { mode: 'boolean' }),
  
  // Maintenance fields
  maintenanceTypeId: integer("maintenance_type_id").references(() => maintenanceTypes.id),
  maintenanceCost: integer("maintenance_cost"), // in cents

  // Trip fields
  origin: text("origin"),
  destination: text("destination"),
  reason: text("reason"),
  
  // Common fields
  observations: text("observations"),
  photoUrl: text("photo_url"),
});

export const insertRegistrationSchema = createInsertSchema(vehicleRegistrations).omit({
  id: true
});

// Extended schema with validation
export const extendedRegistrationSchema = insertRegistrationSchema.extend({
  type: z.enum(["fuel", "maintenance", "trip"]),
  
  // Common required fields
  vehicleId: z.coerce.number().min(1, "Veículo é obrigatório"),
  driverId: z.coerce.number().min(1, "Motorista é obrigatório"),
  date: z.coerce.date({ required_error: "Data é obrigatória" }),
  initialKm: z.coerce.number().min(0, "KM inicial é obrigatório"),

  // Conditional validation based on type
  finalKm: z.coerce.number().optional().nullable(),
  fuelStationId: z.coerce.number().optional().nullable(),
  fuelTypeId: z.coerce.number().optional().nullable(),
  liters: z.coerce.number().optional().nullable(),
  fuelCost: z.coerce.number().optional().nullable(),
  fullTank: z.boolean().optional().nullable(),
  arla: z.boolean().optional().nullable(),
  maintenanceTypeId: z.coerce.number().optional().nullable(),
  maintenanceCost: z.coerce.number().optional().nullable(),
  origin: z.string().optional().nullable(),
  destination: z.string().optional().nullable(),
  reason: z.string().optional().nullable(),
  observations: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
});

export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;
export type VehicleRegistration = typeof vehicleRegistrations.$inferSelect;

// Actual form schemas with conditional validation
export const fuelRegistrationSchema = extendedRegistrationSchema.refine(
  (data) => {
    if (data.type === "fuel") {
      return data.fuelStationId && data.fuelTypeId && data.liters && data.fuelCost;
    }
    return true;
  },
  {
    message: "Posto, tipo de combustível, litros e valor são obrigatórios para abastecimento",
    path: ["type"],
  }
);

export const maintenanceRegistrationSchema = extendedRegistrationSchema.refine(
  (data) => {
    if (data.type === "maintenance") {
      return data.maintenanceTypeId && data.maintenanceCost;
    }
    return true;
  },
  {
    message: "Tipo de manutenção e valor são obrigatórios para manutenção",
    path: ["type"],
  }
);

export const tripRegistrationSchema = extendedRegistrationSchema.refine(
  (data) => {
    if (data.type === "trip") {
      return data.origin && data.destination && data.reason && data.finalKm;
    }
    return true;
  },
  {
    message: "Origem, destino, motivo e KM final são obrigatórios para viagem",
    path: ["type"],
  }
);

// ========= Checklist de Veículos =========
// Tabela para modelos de checklist
export const checklistTemplates = sqliteTable("checklist_templates", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isDefault: integer("is_default", { mode: 'boolean' }).default(false),
  createdAt: integer("created_at").default(Date.now()),
});

export const insertChecklistTemplateSchema = createInsertSchema(checklistTemplates).pick({
  name: true,
  description: true,
  isDefault: true,
});

export type InsertChecklistTemplate = z.infer<typeof insertChecklistTemplateSchema>;
export type ChecklistTemplate = typeof checklistTemplates.$inferSelect;

// Tabela para itens de checklist
export const checklistItems = sqliteTable("checklist_items", {
  id: integer("id").primaryKey(),
  templateId: integer("template_id").notNull().references(() => checklistTemplates.id),
  name: text("name").notNull(),
  description: text("description"),
  isRequired: integer("is_required", { mode: 'boolean' }).default(true),
  category: text("category"),
  order: integer("order").default(0),
});

export const insertChecklistItemSchema = createInsertSchema(checklistItems).pick({
  templateId: true,
  name: true,
  description: true,
  isRequired: true,
  category: true,
  order: true,
});

export type InsertChecklistItem = z.infer<typeof insertChecklistItemSchema>;
export type ChecklistItem = typeof checklistItems.$inferSelect;

// Tabela para checklists realizados
export const vehicleChecklists = sqliteTable("vehicle_checklists", {
  id: integer("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
  driverId: integer("driver_id").notNull().references(() => drivers.id),
  templateId: integer("template_id").notNull().references(() => checklistTemplates.id),
  date: integer("date").notNull().default(Date.now()),
  observations: text("observations"),
  odometer: integer("odometer").notNull(),
  status: text("status").notNull(), // 'pending', 'complete', 'failed'
  photoUrl: text("photo_url"),
});

export const insertVehicleChecklistSchema = createInsertSchema(vehicleChecklists).omit({
  id: true
});

export type InsertVehicleChecklist = z.infer<typeof insertVehicleChecklistSchema>;
export type VehicleChecklist = typeof vehicleChecklists.$inferSelect;

// Tabela para resultados dos itens de checklist
export const checklistResults = sqliteTable("checklist_results", {
  id: integer("id").primaryKey(),
  checklistId: integer("checklist_id").notNull().references(() => vehicleChecklists.id),
  itemId: integer("item_id").notNull().references(() => checklistItems.id),
  status: text("status").notNull(), // 'ok', 'issue', 'not_applicable'
  observation: text("observation"),
  photoUrl: text("photo_url"),
});

export const insertChecklistResultSchema = createInsertSchema(checklistResults).omit({
  id: true
});

export type InsertChecklistResult = z.infer<typeof insertChecklistResultSchema>;
export type ChecklistResult = typeof checklistResults.$inferSelect;

// Tipo estendido para checklist com resultados e relacionamentos
export type VehicleChecklistWithDetails = VehicleChecklist & {
  results?: (ChecklistResult & { 
    item?: ChecklistItem 
  })[];
  vehicle?: Vehicle;
  driver?: Driver;
  template?: ChecklistTemplate;
};
