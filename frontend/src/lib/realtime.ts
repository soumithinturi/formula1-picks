import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { auth } from './auth';

const supabaseUrl = process.env.BUN_PUBLIC_SUPABASE_URL || import.meta.env?.BUN_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.BUN_PUBLIC_SUPABASE_PUBLISHABLE_KEY || import.meta.env?.BUN_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (supabaseInstance) return supabaseInstance;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[realtime] Missing Supabase env vars');
    return null;
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
        const token = await auth.getValidToken();
        const headers = new Headers(init?.headers as HeadersInit);
        headers.set('apikey', supabaseAnonKey);
        if (token) headers.set('Authorization', `Bearer ${token}`);
        return fetch(input as string, { ...(init ?? {}), headers });
      }) as typeof fetch,
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  // Supabase Realtime WebSockets don't go through the custom fetch above.
  // We must explicitly set the auth token on the Realtime transport.
  const token = auth.getToken();
  if (token) supabaseInstance.realtime.setAuth(token);

  return supabaseInstance;
};

/**
 * Call this when the access token is refreshed so the Realtime socket
 * stays authenticated without recreating the client.
 */
export const refreshRealtimeAuth = () => {
  if (!supabaseInstance) return;
  const token = auth.getToken();
  if (token) supabaseInstance.realtime.setAuth(token);
};

export const resetSupabase = () => {
  supabaseInstance = null;
};
