import type { Sql } from "../db/index.ts";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Cloudflare Workers environment bindings.
 * These are configured in wrangler.jsonc and set as secrets via `wrangler secret put`.
 */
export interface Bindings {
  // Hyperdrive provides a pooled connection string for Supabase Postgres
  HYPERDRIVE: Hyperdrive;

  // Supabase
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
  SUPABASE_PUBLISHABLE_DEFAULT_KEY: string;

  // Cron webhook authentication
  CRON_SECRET: string;

  // Web Push (VAPID)
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_EMAIL: string;

  // Runtime
  NODE_ENV: string;
}

/**
 * Variables stored on Hono context via middleware injection.
 * Route handlers access these via `c.get("db")`, `c.get("supabase")`, etc.
 * 
 * `user` is set by authMiddleware — it's optional here because not all routes
 * require auth, but authMiddleware guarantees it's present before authed handlers run.
 */
export interface Variables {
  db: Sql;
  supabase: SupabaseClient;
  env: Bindings;
  user: {
    id: string;
    contact: string;
    role: "USER" | "ADMIN";
  };
}
