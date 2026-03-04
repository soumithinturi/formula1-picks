import { safeStorage } from "@/lib/utils";

const TOKEN_KEY = "f1_auth_token";
const USER_KEY = "f1_user";

export interface UserProfile {
  id: string;
  contact: string;
  role: "USER" | "ADMIN";
  display_name?: string;
  full_name?: string;
  avatar_url?: string;
  created_at?: string;
}

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
      // Returns any residual token if they haven't logged out yet
      return safeStorage.getItem(TOKEN_KEY);
    }
    return null;
  },

  removeToken() {
    if (typeof window !== "undefined") {
      safeStorage.removeItem(TOKEN_KEY);
    }
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
      safeStorage.removeItem(USER_KEY);

      // Fire-and-forget call to backend to clear HttpOnly cookie
      const url = process.env.BUN_PUBLIC_API_URL || import.meta.env?.BUN_PUBLIC_API_URL;
      const BASE_URL = url && url !== "undefined" ? url : (typeof window !== "undefined" && window.location.hostname === "localhost"
        ? "http://localhost:8080/api/v1"
        : "https://formula1-picks-production.up.railway.app/api/v1");

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
