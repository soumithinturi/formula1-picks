import { auth } from "./auth";

// In Bun frontend setups, `import.meta.env` corresponds to server/build environment variables.
// If not explicitly provided via a `.env` file or export, `NODE_ENV` is implicitly 'development' when running `bun dev`.
const isDev = process.env.NODE_ENV !== 'production';

// Use the explicit env variable first, fallback to context-aware defaults
const BASE_URL = import.meta.env?.BUN_PUBLIC_API_URL || (isDev
  ? "http://localhost:8080/api/v1"
  : "https://formula1-picks-production.up.railway.app/api/v1");

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
  sprint_date: string | null;
  sprint_quali_date: string | null;
  race_quali_date: string | null;
}

export interface Driver {
  driverId: string;
  permanentNumber?: string;
  code?: string;
  url: string;
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  nationality: string;
  constructorId?: string;
  constructorName?: string;
  rank?: number;
}

export interface ScoringConfig {
  p1?: { enabled: boolean; points: number };
  p2?: { enabled: boolean; points: number };
  p3?: { enabled: boolean; points: number };
  quali?: { enabled: boolean; points: number };
  podium?: { enabled: boolean; points: number };
  perfectOrder?: { enabled: boolean; points: number };
  fastestLap?: { enabled: boolean; points: number };
  sprintFastestLap?: { enabled: boolean; points: number };
  firstDNF?: { enabled: boolean; points: number };
}

export interface PickSelections {
  sprintQualifyingP1?: string | null;
  sprintP1?: string | null;
  sprintP2?: string | null;
  sprintP3?: string | null;
  sprintFastestLap?: string | null;
  raceQualifyingP1?: string | null;
  raceP1?: string | null;
  raceP2?: string | null;
  raceP3?: string | null;
  fastestLap?: string | null;
  firstDnf?: string | null;
}

export interface PickRow {
  sprint_qualifying_p1: string | null;
  sprint_p1: string | null;
  sprint_p2: string | null;
  sprint_p3: string | null;
  sprint_fastest_lap: string | null;
  race_qualifying_p1: string | null;
  race_p1: string | null;
  race_p2: string | null;
  race_p3: string | null;
  fastest_lap: string | null;
  first_dnf: string | null;
}

export interface League {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  members_count?: number;
  scoring_config?: ScoringConfig;
}

export interface Notification {
  id: string;
  type: "RESULTS_IN" | "PICKS_DUE" | "LEAGUE_ACTIVITY";
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface UserPreferences {
  themeId?: string;
  timezoneDisplay?: "local" | "track";
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = auth.getToken();
  const headers = new Headers(options.headers);

  // We still attach the Bearer token if it exists (for backward compatibility),
  // but the backend will rely primarily on the HttpOnly cookie.
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Ensure Content-Type is JSON unless it's FormData (which sets it auto)
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Explicitly tell fetch to send cookies cross-origin
  options.credentials = "include";

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

let cachedRaces: Race[] | null = null;

// Derived from 2025 Standings to act as default/initial sort order.
// Any driver not in this list gets pushed to the bottom (rank 999).
const driverStandings2025 = [
  "NOR", "VER", "PIA", "RUS", "LEC", "HAM", "ANT", "ALB", "SAI", "ALO",
  "HUL", "HAD", "BEA", "LAW", "OCO", "STR", "TSU", "GAS", "BOR", "COL", "DOO"
];

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

  patch: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  delete: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),

  // Specific API methods (can be moved to services later if gets too big)
  // ------------------------------------------------------------------
  // --- Feedback ---
  submitFeedback: (data: { type: 'bug' | 'feature_request' | 'general'; message: string; appVersion?: string; metadata?: any }) =>
    api.post("/feedback", data),

  auth: {
    requestOtp: (payload: { type: "email" | "phone"; contact: string }) =>
      api.post("/auth/request", payload),

    verifyOtp: (payload: { type: "email" | "phone"; contact: string; code: string }) =>
      api.post<{ token: string; user: any }>("/auth/verify", payload),

    sync: (payload: { access_token: string }) =>
      api.post<{ user: any }>("/auth/sync", payload),
  },

  users: {
    getMe: () =>
      api.get<{ user: { id: string; display_name: string | null; full_name: string | null; avatar_url: string | null; role: string; preferences: UserPreferences }, stats: { globalCorrectPredictions: number, globalTotalPredictions: number } }>("/users/me"),

    updateProfile: (payload: { display_name?: string; full_name?: string | null; avatar_url?: string | null; preferences?: UserPreferences }) =>
      api.put<{ user: any }>("/users/me", payload),
  },

  races: {
    list: async () => {
      if (cachedRaces) return cachedRaces;
      const data = await api.get<Race[]>("/races");
      cachedRaces = data;
      return data;
    },
  },

  drivers: {
    list: async () => {
      const data = await api.get<Driver[]>("/drivers");
      return data.map(driver => {
        // Find their rank based on the hardcoded 2025 standings list
        const rankIndex = driverStandings2025.indexOf(driver.code || "");
        return {
          ...driver,
          // If found, index + 1 is their rank. If not found, give them 999 so they go to the bottom.
          rank: rankIndex !== -1 ? rankIndex + 1 : 999
        };
      });
    },
  },

  leagues: {
    create: (payload: { name: string; scoringConfig?: any }) =>
      api.post<League>("/leagues", payload),

    update: (id: string, payload: { name: string }) =>
      api.patch<League>(`/leagues/${id}`, payload),

    list: () => api.get<League[]>("/leagues"),

    preview: (inviteCode: string) =>
      api.get<{ id: string; name: string; creatorName: string }>(`/leagues/invite/${inviteCode}`),

    join: (inviteCode: string) =>
      api.post<League>(`/leagues/join`, { inviteCode }),
  },

  picks: {
    get: (raceId: string, leagueId: string) =>
      api.get<PickRow>(`/picks/race/${raceId}?leagueId=${leagueId}`),

    submit: (payload: { raceId: string; leagueId: string; selections: any }) =>
      api.post("/picks", payload),
  },

  leaderboard: {
    get: (leagueId: string) => api.get<LeaderboardEntry[]>(`/leaderboard/${leagueId}`),
  },

  notifications: {
    list: () =>
      api.get<{ notifications: Notification[]; unreadCount: number }>("/notifications"),
    markAllRead: () => api.put<{ updated: number }>("/notifications/read", {}),
  },
};

export interface LeaderboardEntry {
  userId: string;
  displayName: string | null;
  contact?: string;
  avatarUrl?: string | null;
  totalPredictions?: number;
  leagueCorrectPredictions?: number;
  leagueTotalPredictions?: number;
  totalPoints: number;
}
