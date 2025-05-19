import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../shared/schema';

// Set up database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create drizzle instance
const db = drizzle(pool, { schema });

export default db;