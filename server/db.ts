import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from "@shared/schema";

// This is needed for Neon database to work with serverless environments
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Make sure you have a .env file in the root directory with DATABASE_URL=your_connection_string",
  );
}

// Let's try to modify the connection string to ensure SSL is used properly
let connectionString = process.env.DATABASE_URL;
if (!connectionString.includes('?sslmode=')) {
  connectionString += '?sslmode=require';
}

console.log("Connecting to database...");
export const pool = new Pool({ 
  connectionString: connectionString
});

export const db = drizzle(pool, { schema });