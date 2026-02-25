import { auth } from "./auth";

const BASE_URL = (import.meta.env && import.meta.env.BUN_PUBLIC_API_URL) || "https://formula1-picks-production.up.railway.app/api/v1" || "http://localhost:8080/api/v1";

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface Race {
  id: string;
  name: string;
  date: string; // ISO string
  has_sprint: boolean;
  status: "UPCOMING" | "OPEN" | "CLOSED" | "COMPLETED";
  race_deadline: string;
  sprint_deadline?: string;
}

export interface Driver {
  id: string;
  full_name: string;
  racing_number: string;
  team_name: string;
  tla: string;
}

export interface League {
  id: string;
  name: string;
  invite_code: string;
  created_by: string; // user id
  members_count?: number;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = auth.getToken();
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Ensure Content-Type is JSON unless it's FormData (which sets it auto)
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token is invalid/expired/from old project. Force logout.
      auth.logout();
      throw new Error("Session expired. Please log in again.");
    }

    let errorMessage = "An unexpected error occurred";
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.error || errorBody.message || errorMessage;
    } catch {
      errorMessage = response.statusText;
    }
    throw new Error(errorMessage);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  try {
    return await response.json();
  } catch {
    return {} as T;
  }
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: "GET" }),

  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),

  // Specific API methods (can be moved to services later if gets too big)
  // ------------------------------------------------------------------

  auth: {
    requestOtp: (payload: { type: "email" | "phone"; contact: string }) =>
      api.post("/auth/request", payload),

    verifyOtp: (payload: { type: "email" | "phone"; contact: string; code: string }) =>
      api.post<{ token: string; user: any }>("/auth/verify", payload),

    sync: (payload: { access_token: string }) =>
      api.post<{ user: any }>("/auth/sync", payload),
  },

  users: {
    updateProfile: (payload: { display_name: string }) =>
      api.put<{ user: any }>("/users/me", payload),
  },

  races: {
    list: () => api.get<Race[]>("/races"),
  },

  drivers: {
    list: () => api.get<Driver[]>("/drivers"),
  },

  leagues: {
    create: (payload: { name: string; scoringConfig?: any }) =>
      api.post<League>("/leagues", payload),

    list: () => api.get<League[]>("/leagues"),

    join: (inviteCode: string) =>
      api.post<League>(`/leagues/${inviteCode}/join`, {}),
  },

  picks: {
    get: (raceId: string, leagueId: string) =>
      api.get<any>(`/picks/race/${raceId}?leagueId=${leagueId}`),

    submit: (payload: { raceId: string; leagueId: string; selections: any }) =>
      api.post("/picks", payload),
  },

  leaderboard: {
    get: (leagueId: string) => api.get<LeaderboardEntry[]>(`/leaderboard/${leagueId}`),
  },
};

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  contact?: string;
  totalPoints: number;
}
