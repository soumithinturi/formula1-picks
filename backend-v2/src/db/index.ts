import { SQL } from "bun";

// bun:sql auto-reads PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD env vars.
// We use DATABASE_URL (Supabase direct connection string) as the override.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

export const db = new SQL(connectionString);
