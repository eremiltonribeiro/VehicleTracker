<<<<<<< HEAD
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
=======
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
>>>>>>> f637565a40665382154ff66e15537e66e19f2dc7
import * as schema from "@shared/schema";
import path from "path";

<<<<<<< HEAD
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
=======
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
>>>>>>> f637565a40665382154ff66e15537e66e19f2dc7
