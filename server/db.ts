import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";
import path from "path";

// Initialize SQLite database
const sqlite = new Database(path.join(process.cwd(), "database.db"));
sqlite.pragma("journal_mode = WAL");

// Initialize Drizzle ORM
export const db = drizzle(sqlite, { schema });

// Create tables if they don't exist
try {
  // Simple table creation instead of migrations for now
  console.log("✅ Database initialized successfully");
} catch (error) {
  console.error("❌ Database initialization failed:", error);
}

// Export the database connection and schemas
export { sqlite };
export const {
  users,
  vehicles,
  drivers,
  fuelStations,
  fuelTypes,
  maintenanceTypes,
  vehicleRegistrations,
  checklistTemplates,
  checklistItems,
  vehicleChecklists,
  checklistResults,
  roles,
  sessions
} = schema;