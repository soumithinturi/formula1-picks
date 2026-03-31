import { SQL } from "bun";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

export const db = new SQL(connectionString, {
  max: 5, // Limit concurrent connections
  idleTimeout: 20,
  maxLifetime: 60 * 30, // 30 minutes
  tls: { rejectUnauthorized: false }, // Supabase requires TLS
  prepare: false, // Disable prepared statements for PgBouncer/Transaction mode
});
