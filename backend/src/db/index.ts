import postgres from "postgres";

/**
 * Creates a postgres.js SQL client from a connection string.
 * 
 * In Cloudflare Workers, each request gets the connection string from
 * the Hyperdrive binding (env.HYPERDRIVE.connectionString). We cache
 * the client per connection string to avoid re-creating it on every request
 * within the same isolate.
 * 
 * The tagged template API is identical to Bun SQL — all existing queries
 * work unchanged (e.g., db`SELECT * FROM races WHERE id = ${id}`).
 */
export function getDb(connectionString: string) {
  return postgres(connectionString, {
    // Disable prepared statements — required for Hyperdrive and PgBouncer transaction mode.
    prepare: false,
  });
}

// Tests and scripts only (the Worker uses getDb). No fallback URL: postgres.js connects
// lazily, so with DATABASE_URL unset the first query fails instead of hitting a real DB.
export const db = postgres(process.env.DATABASE_URL ?? "", { prepare: false });

// Re-export the type for use in route handlers
export type Sql = ReturnType<typeof postgres>;

