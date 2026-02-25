import { SQL } from "bun";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

export const db = new SQL(connectionString, {
  idle_timeout: 20,
  max_lifetime: 60 * 30, // 30 minutes
  tls: { rejectUnauthorized: false }, // Supabase requires TLS
});
