const TOKEN_KEY = "f1_auth_token";
const USER_KEY = "f1_user";

export interface UserProfile {
  id: string;
  contact: string;
  role: "USER" | "ADMIN";
  display_name?: string;
  created_at?: string;
}

export const auth = {
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  setUser(user: UserProfile) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getUser(): UserProfile | null {
    const data = localStorage.getItem(USER_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  logout() {
    this.removeToken();
    localStorage.removeItem(USER_KEY);
    window.location.href = "/login";
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};
