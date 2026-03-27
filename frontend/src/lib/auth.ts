import { safeStorage } from "@/lib/utils";

const TOKEN_KEY = "f1_auth_token";
const REFRESH_TOKEN_KEY = "f1_refresh_token";
const USER_KEY = "f1_user";

const SUPABASE_URL = process.env.BUN_PUBLIC_SUPABASE_URL || import.meta.env?.BUN_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.BUN_PUBLIC_SUPABASE_PUBLISHABLE_KEY || import.meta.env?.BUN_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export interface UserProfile {
  id: string;
  contact: string;
  role: "USER" | "ADMIN";
  display_name?: string;
  full_name?: string;
  avatar_url?: string;
  created_at?: string;
}

/** Decodes the exp claim from a JWT without verifying the signature. */
function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]!));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

/** Returns true if the token is expired or will expire within 60 seconds. */
function isTokenExpiredOrExpiring(token: string): boolean {
  const exp = getTokenExpiry(token);
  if (!exp) return true;
  return exp <= Math.floor(Date.now() / 1000) + 60;
}

let refreshPromise: Promise<string | null> | null = null;

export const auth = {
  // We store the JWT in localStorage as a fallback for cross-origin mobile environments
  // where third-party HttpOnly cookies are aggressively blocked (e.g., Safari on iOS).
  setToken(token: string) {
    if (typeof window !== "undefined") {
      safeStorage.setItem(TOKEN_KEY, token);
    }
  },

  getToken(): string | null {
    if (typeof window !== "undefined") {
      return safeStorage.getItem(TOKEN_KEY);
    }
    return null;
  },

  removeToken() {
    if (typeof window !== "undefined") {
      safeStorage.removeItem(TOKEN_KEY);
    }
  },

  setRefreshToken(token: string) {
    if (typeof window !== "undefined") {
      safeStorage.setItem(REFRESH_TOKEN_KEY, token);
    }
  },

  getRefreshToken(): string | null {
    if (typeof window !== "undefined") {
      return safeStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return null;
  },

  removeRefreshToken() {
    if (typeof window !== "undefined") {
      safeStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  },

  /**
   * Returns a valid (non-expired) access token.
   * If the current token is expired or about to expire, silently refreshes it
   * using the stored refresh_token from Supabase.
   * Returns null if no valid token can be obtained (user must re-login).
   */
  async getValidToken(): Promise<string | null> {
    const token = this.getToken();

    if (token && !isTokenExpiredOrExpiring(token)) {
      return token;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    // Deduplicate concurrent refresh calls
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
      try {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

        const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!res.ok) {
          // Refresh failed — force logout
          this.logout();
          return null;
        }

        const session = await res.json();
        if (session.access_token) {
          this.setToken(session.access_token);
          if (session.refresh_token) {
            this.setRefreshToken(session.refresh_token);
          }
          // Keep the Realtime WebSocket authenticated with the new token.
          // Dynamic import avoids a circular dependency (realtime.ts imports auth.ts).
          import('./realtime').then(({ refreshRealtimeAuth }) => refreshRealtimeAuth()).catch(() => { });
          return session.access_token as string;
        }

        return null;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  },

  setUser(user: UserProfile) {
    if (typeof window !== "undefined") {
      safeStorage.setItem(USER_KEY, JSON.stringify(user));
      window.dispatchEvent(new CustomEvent("f1_user_updated", { detail: user }));
    }
  },

  getUser(): UserProfile | null {
    if (typeof window === "undefined") return null;
    const data = safeStorage.getItem(USER_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  logout() {
    if (typeof window !== "undefined") {
      this.removeToken();
      this.removeRefreshToken();
      safeStorage.removeItem(USER_KEY);

      // Destroy the Supabase realtime singleton so a subsequent user on the same
      // browser tab doesn't inherit the previous user's WebSocket auth token.
      import('./realtime').then(({ resetSupabase }) => resetSupabase()).catch(() => { });

      // Fire-and-forget call to backend to clear HttpOnly cookie
      const url = process.env.BUN_PUBLIC_API_URL || import.meta.env?.BUN_PUBLIC_API_URL;
      let BASE_URL = url && url !== "undefined" ? url : "https://formula1-picks-production.up.railway.app/api/v1";

      if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        if (hostname === "localhost" || hostname === "127.0.0.1") {
          BASE_URL = "http://localhost:8080/api/v1";
        } else if (hostname.includes("-staging")) {
          BASE_URL = "https://formula1-picks-staging.up.railway.app/api/v1";
        } else if (hostname.includes("formula1-picks")) {
          BASE_URL = "https://formula1-picks-production.up.railway.app/api/v1";
        }
      }

      const apiEndpoint = BASE_URL.endsWith("/api/v1") ? `${BASE_URL}/auth/logout` : `${BASE_URL}/api/v1/auth/logout`;

      fetch(apiEndpoint, {
        method: "POST",
        credentials: "include"
      }).catch(console.error);

      window.location.hash = "/login";
    }
  },

  isAuthenticated(): boolean {
    // Rely on the presence of user data since we can't read the HttpOnly cookie.
    // If the cookie is expired, the next API call will return 401 and force a logout.
    return !!this.getUser();
  }
};
