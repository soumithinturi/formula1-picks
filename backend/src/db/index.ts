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
const clients = new Map<string, ReturnType<typeof postgres>>();

export function getDb(connectionString: string) {
  let sql = clients.get(connectionString);
  if (!sql) {
    sql = postgres(connectionString, {
      // Disable prepared statements — required for Hyperdrive and PgBouncer transaction mode.
      prepare: false,
    });
    clients.set(connectionString, sql);
  }
  return sql;
}

// Re-export the type for use in route handlers
export type Sql = ReturnType<typeof postgres>;
