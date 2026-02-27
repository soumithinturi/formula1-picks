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
  // We keep setToken empty to prevent storing new JWTs in localStorage.
  // The server handles setting the HttpOnly cookie for us.
  setToken(token: string) {
    if (typeof window !== "undefined") {
      // Intentionally avoiding localStorage.setItem(TOKEN_KEY, token);
      // to mitigate XSS risks on the token.
    }
  },

  getToken(): string | null {
    if (typeof window !== "undefined") {
      // Returns any residual token if they haven't logged out yet
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  },

  removeToken() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  setUser(user: UserProfile) {
    if (typeof window !== "undefined") {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      window.dispatchEvent(new CustomEvent("f1_user_updated", { detail: user }));
    }
  },

  getUser(): UserProfile | null {
    if (typeof window === "undefined") return null;
    const data = localStorage.getItem(USER_KEY);
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
      localStorage.removeItem(USER_KEY);

      // Fire-and-forget call to backend to clear HttpOnly cookie
      const BASE_URL = import.meta.env?.BUN_PUBLIC_API_URL || (process.env.NODE_ENV !== 'production'
        ? "http://localhost:8080/api/v1"
        : "https://formula1-picks-production.up.railway.app/api/v1");

      fetch(`${BASE_URL}/auth/logout`, {
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
