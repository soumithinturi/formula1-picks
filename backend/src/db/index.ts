import { SQL } from "bun";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

export const db = new SQL(connectionString, {
  max: 10, // Allow more concurrent connections
  // 20s was too aggressive — connections dropped between requests causing auth failures.
  // Supabase's pooler keeps sessions alive for ~120s by default, so we match that.
  idleTimeout: 120,
  maxLifetime: 60 * 30, // 30 minutes
  tls: { rejectUnauthorized: false }, // Supabase requires TLS
  prepare: false, // Disable prepared statements for PgBouncer/Transaction mode
});
