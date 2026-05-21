import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase service-role client.
 * 
 * Factory function — Workers don't have a persistent boot lifecycle,
 * so we create the client from env bindings passed via Hono context.
 * Bypasses RLS for admin operations (sending OTPs, verifying tokens).
 */
export function createSupabaseClient(supabaseUrl: string, supabaseKey: string) {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
